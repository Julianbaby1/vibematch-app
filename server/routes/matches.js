const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const DAILY_LIMIT = 5;

// Compute a simple compatibility score between two users
async function computeScore(userId, targetId) {
  // Shared interests
  const interests = await db.query(
    `SELECT COUNT(*) AS shared FROM user_interests ui1
     JOIN user_interests ui2 ON LOWER(ui1.interest) = LOWER(ui2.interest)
     WHERE ui1.user_id = $1 AND ui2.user_id = $2`,
    [userId, targetId]
  );

  // Similar prompt responses (overlap in word count as proxy)
  const prompts = await db.query(
    `SELECT upr1.response AS r1, upr2.response AS r2
     FROM user_prompt_responses upr1
     JOIN user_prompt_responses upr2 ON upr1.prompt_id = upr2.prompt_id
     WHERE upr1.user_id = $1 AND upr2.user_id = $2`,
    [userId, targetId]
  );

  const sharedInterests = parseInt(interests.rows[0].shared, 10);
  const promptScore = prompts.rows.length * 10; // each shared prompt adds 10 pts

  return Math.min(100, sharedInterests * 15 + promptScore);
}

// GET /api/matches/daily — today's suggested profiles (max 5)
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Already queued for today?
    const existing = await db.query(
      `SELECT dmq.suggested_user_id, dmq.action,
              u.id, u.first_name, u.date_of_birth, u.life_stage, u.bio,
              u.city, u.profile_photo_url, u.visibility_score, u.response_rate,
              COALESCE(json_agg(DISTINCT ui.interest) FILTER (WHERE ui.id IS NOT NULL), '[]') AS interests,
              COALESCE(json_agg(DISTINCT jsonb_build_object(
                'question', p.question, 'response', upr.response
              )) FILTER (WHERE upr.id IS NOT NULL), '[]') AS prompt_responses
       FROM daily_match_queue dmq
       JOIN users u ON u.id = dmq.suggested_user_id
       LEFT JOIN user_interests ui ON ui.user_id = u.id
       LEFT JOIN user_prompt_responses upr ON upr.user_id = u.id
       LEFT JOIN prompts p ON p.id = upr.prompt_id
       WHERE dmq.user_id = $1 AND dmq.date = $2
       GROUP BY dmq.suggested_user_id, dmq.action, u.id`,
      [req.user.id, today]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows);
    }

    // Build today's fresh queue — find candidates
    const candidates = await db.query(
      `SELECT u.id FROM users u
       WHERE u.id != $1
         AND u.is_active = true
         AND u.is_banned = false
         AND u.id NOT IN (
           SELECT CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
           FROM matches m WHERE m.user1_id = $1 OR m.user2_id = $1
         )
         AND u.id NOT IN (
           SELECT suggested_user_id FROM daily_match_queue
           WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
         )
       ORDER BY u.visibility_score DESC, RANDOM()
       LIMIT 20`,
      [req.user.id]
    );

    const picks = [];
    for (const cand of candidates.rows.slice(0, DAILY_LIMIT)) {
      const score = await computeScore(req.user.id, cand.id);
      picks.push({ id: cand.id, score });
    }

    // Sort by score, take top 5
    picks.sort((a, b) => b.score - a.score);
    const topIds = picks.slice(0, DAILY_LIMIT).map((p) => p.id);

    for (const suggestedId of topIds) {
      await db.query(
        `INSERT INTO daily_match_queue (user_id, suggested_user_id, date)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [req.user.id, suggestedId, today]
      );
    }

    // Return enriched profiles
    if (topIds.length === 0) return res.json([]);

    const placeholders = topIds.map((_, i) => `$${i + 2}`).join(',');
    const { rows } = await db.query(
      `SELECT dmq.suggested_user_id, dmq.action,
              u.id, u.first_name, u.date_of_birth, u.life_stage, u.bio,
              u.city, u.profile_photo_url, u.visibility_score, u.response_rate,
              COALESCE(json_agg(DISTINCT ui.interest) FILTER (WHERE ui.id IS NOT NULL), '[]') AS interests,
              COALESCE(json_agg(DISTINCT jsonb_build_object(
                'question', p.question, 'response', upr.response
              )) FILTER (WHERE upr.id IS NOT NULL), '[]') AS prompt_responses
       FROM daily_match_queue dmq
       JOIN users u ON u.id = dmq.suggested_user_id
       LEFT JOIN user_interests ui ON ui.user_id = u.id
       LEFT JOIN user_prompt_responses upr ON upr.user_id = u.id
       LEFT JOIN prompts p ON p.id = upr.prompt_id
       WHERE dmq.user_id = $1 AND dmq.suggested_user_id IN (${placeholders})
       GROUP BY dmq.suggested_user_id, dmq.action, u.id`,
      [req.user.id, ...topIds]
    );

    res.json(rows);
  } catch (err) {
    console.error('Daily matches error:', err);
    res.status(500).json({ error: 'Failed to fetch daily matches' });
  }
});

// POST /api/matches/action — connect or pass
router.post('/action', authMiddleware, async (req, res) => {
  try {
    const { target_id, action } = req.body; // action: 'connect' | 'pass'
    if (!['connect', 'pass'].includes(action)) {
      return res.status(400).json({ error: 'Action must be connect or pass' });
    }

    const today = new Date().toISOString().split('T')[0];

    await db.query(
      `UPDATE daily_match_queue SET action = $1
       WHERE user_id = $2 AND suggested_user_id = $3 AND date = $4`,
      [action, req.user.id, target_id, today]
    );

    if (action !== 'connect') return res.json({ matched: false });

    // Check if the other user already connected with us
    const mutual = await db.query(
      `SELECT id FROM daily_match_queue
       WHERE user_id = $1 AND suggested_user_id = $2 AND action = 'connect'`,
      [target_id, req.user.id]
    );

    if (mutual.rows.length === 0) {
      return res.json({ matched: false, message: 'Connection request sent' });
    }

    // Mutual — create a match
    const [u1, u2] = [req.user.id, target_id].sort();
    const score = await computeScore(req.user.id, target_id);

    const { rows } = await db.query(
      `INSERT INTO matches (user1_id, user2_id, compatibility_score)
       VALUES ($1, $2, $3)
       ON CONFLICT (user1_id, user2_id) DO UPDATE SET compatibility_score = EXCLUDED.compatibility_score
       RETURNING id`,
      [u1, u2, score]
    );

    // Seed response tracking rows
    const matchId = rows[0].id;
    await db.query(
      `INSERT INTO response_tracking (match_id, user_id, last_responded_at)
       VALUES ($1, $2, NOW()), ($1, $3, NOW())
       ON CONFLICT DO NOTHING`,
      [matchId, req.user.id, target_id]
    );

    res.json({ matched: true, match_id: matchId });
  } catch (err) {
    console.error('Match action error:', err);
    res.status(500).json({ error: 'Failed to process action' });
  }
});

// GET /api/matches — all confirmed matches
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.id AS match_id, m.compatibility_score, m.last_message_at, m.created_at,
              u.id, u.first_name, u.profile_photo_url, u.city, u.response_rate,
              (SELECT content FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) AS last_message,
              (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND sender_id != $1 AND is_read = false)::int AS unread_count
       FROM matches m
       JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
       WHERE (m.user1_id = $1 OR m.user2_id = $1)
         AND u.is_banned = false
       ORDER BY COALESCE(m.last_message_at, m.created_at) DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

module.exports = router;
