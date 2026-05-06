/**
 * Match routes — daily queue, connect/pass, matches list.
 *
 * Complex queries are handled by PostgreSQL functions called via
 * supabase.rpc() — this keeps the Express handlers thin while
 * keeping all business logic in versioned SQL.
 */
const express        = require('express');
const supabase       = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── GET /api/matches/daily ─────────────────────────────────────
// Returns today's 5 curated profiles (creates queue if needed).
router.get('/daily', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.rpc('get_or_build_daily_queue', {
    p_user_id: req.user.id,
  });

  if (error) {
    console.error('Daily matches error:', error);
    return res.status(500).json({ error: 'Failed to fetch daily matches' });
  }

  // Enrich each profile with interests and prompt responses
  const profiles = Array.isArray(data) ? data : [];
  const enriched = await Promise.all(
    profiles.map(async (profile) => {
      const [{ data: interests }, { data: prompts }] = await Promise.all([
        supabase
          .from('user_interests')
          .select('interest')
          .eq('user_id', profile.id),
        supabase
          .from('user_prompt_responses')
          .select('response, prompts(question)')
          .eq('user_id', profile.id),
      ]);

      return {
        ...profile,
        interests:        (interests  || []).map((r) => r.interest),
        prompt_responses: (prompts    || []).map((r) => ({
          question: r.prompts?.question,
          response: r.response,
        })),
      };
    })
  );

  res.json(enriched);
});

// ── POST /api/matches/action ───────────────────────────────────
// Body: { target_id, action: 'connect' | 'pass' }
router.post('/action', authMiddleware, async (req, res) => {
  const { target_id, action } = req.body;
  if (!['connect', 'pass'].includes(action)) {
    return res.status(400).json({ error: 'Action must be connect or pass' });
  }

  const { data, error } = await supabase.rpc('process_match_action', {
    p_user_id:   req.user.id,
    p_target_id: target_id,
    p_action:    action,
  });

  if (error) {
    console.error('Match action error:', error);
    return res.status(500).json({ error: 'Failed to process action' });
  }

  res.json(data);
});

// ── GET /api/matches ───────────────────────────────────────────
// Returns all confirmed matches with last message + unread count.
router.get('/', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.rpc('get_matches_for_user', {
    p_user_id: req.user.id,
  });

  if (error) {
    console.error('Get matches error:', error);
    return res.status(500).json({ error: 'Failed to fetch matches' });
  }

  res.json(Array.isArray(data) ? data : []);
});

module.exports = router;
