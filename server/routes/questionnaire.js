/**
 * Questionnaire routes — VibeCheck compatibility quiz.
 *
 * Questions live in public.compatibility_questions (seeded in Supabase).
 * Answers live in public.user_compatibility_answers, one row per
 * user+question, with an importance level that weights the score:
 *   a_little=1, somewhat=10, very=50, dealbreaker=250
 * Scoring itself happens in SQL: public.compute_compatibility().
 */
const express        = require('express');
const supabase       = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const IMPORTANCE_LEVELS = ['a_little', 'somewhat', 'very', 'dealbreaker'];

// ── GET /api/questionnaire/questions ───────────────────────────
// Returns all active questions plus the user's existing answers,
// so the quiz can resume where they left off.
router.get('/questions', authMiddleware, async (req, res) => {
  const [{ data: questions, error: qErr }, { data: answers, error: aErr }] =
    await Promise.all([
      supabase
        .from('compatibility_questions')
        .select('id, category, question, options, is_scale, display_order')
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('user_compatibility_answers')
        .select('question_id, answer_index, importance')
        .eq('user_id', req.user.id),
    ]);

  if (qErr || aErr) {
    console.error('Questionnaire fetch error:', qErr || aErr);
    return res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }

  res.json({ questions: questions || [], answers: answers || [] });
});

// ── GET /api/questionnaire/status ──────────────────────────────
// Lightweight progress check for the dashboard nudge.
router.get('/status', authMiddleware, async (req, res) => {
  const [{ count: total }, { count: answered }] = await Promise.all([
    supabase
      .from('compatibility_questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('user_compatibility_answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id),
  ]);

  res.json({ total: total ?? 0, answered: answered ?? 0 });
});

// ── POST /api/questionnaire/answers ────────────────────────────
// Body: { answers: [{ question_id, answer_index, importance }] }
// Upserts — safe to call repeatedly (retake / edit answers).
router.post('/answers', authMiddleware, async (req, res) => {
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers must be a non-empty array' });
  }

  const rows = [];
  for (const a of answers) {
    const questionId  = Number(a.question_id);
    const answerIndex = Number(a.answer_index);
    if (!Number.isInteger(questionId) || !Number.isInteger(answerIndex) || answerIndex < 0) {
      return res.status(400).json({ error: 'Each answer needs question_id and answer_index' });
    }
    if (!IMPORTANCE_LEVELS.includes(a.importance)) {
      return res.status(400).json({ error: `importance must be one of: ${IMPORTANCE_LEVELS.join(', ')}` });
    }
    rows.push({
      user_id:      req.user.id,
      question_id:  questionId,
      answer_index: answerIndex,
      importance:   a.importance,
    });
  }

  const { error } = await supabase
    .from('user_compatibility_answers')
    .upsert(rows, { onConflict: 'user_id,question_id' });

  if (error) {
    console.error('Questionnaire save error:', error);
    return res.status(500).json({ error: 'Failed to save answers' });
  }

  res.json({ saved: rows.length });
});

module.exports = router;
