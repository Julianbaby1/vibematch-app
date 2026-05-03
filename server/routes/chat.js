const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const GHOST_THRESHOLD_HOURS = 72;

// GET /api/chat/:matchId — message history
router.get('/:matchId', authMiddleware, async (req, res) => {
  try {
    // Verify user belongs to this match
    const { rows: matchRows } = await db.query(
      'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [req.params.matchId, req.user.id]
    );
    if (!matchRows[0]) return res.status(403).json({ error: 'Access denied' });

    const { rows } = await db.query(
      `SELECT m.id, m.sender_id, m.content, m.message_type, m.media_url, m.is_read, m.created_at,
              u.first_name, u.profile_photo_url
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.match_id = $1
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [req.params.matchId]
    );

    // Mark incoming messages as read
    await db.query(
      'UPDATE messages SET is_read = true WHERE match_id = $1 AND sender_id != $2',
      [req.params.matchId, req.user.id]
    );

    // Update last_seen
    const col = await db.query(
      'SELECT user1_id FROM matches WHERE id = $1',
      [req.params.matchId]
    );
    const isUser1 = col.rows[0].user1_id === req.user.id;
    await db.query(
      `UPDATE matches SET ${isUser1 ? 'user1_last_seen' : 'user2_last_seen'} = NOW() WHERE id = $1`,
      [req.params.matchId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get chat error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/:matchId — send a message (REST fallback; primary is Socket.io)
router.post('/:matchId', authMiddleware, async (req, res) => {
  try {
    const { content, message_type = 'text', media_url } = req.body;

    const { rows: matchRows } = await db.query(
      'SELECT id, user1_id, user2_id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [req.params.matchId, req.user.id]
    );
    if (!matchRows[0]) return res.status(403).json({ error: 'Access denied' });

    const { rows } = await db.query(
      `INSERT INTO messages (match_id, sender_id, content, message_type, media_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.matchId, req.user.id, content, message_type, media_url || null]
    );

    await db.query(
      'UPDATE matches SET last_message_at = NOW() WHERE id = $1',
      [req.params.matchId]
    );

    // Reset ghost tracking for this user
    await db.query(
      `UPDATE response_tracking
       SET last_responded_at = NOW(), ghost_warning_sent = false, penalty_applied = false
       WHERE match_id = $1 AND user_id = $2`,
      [req.params.matchId, req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Background job hook: called by a cron or scheduled task
// POST /api/chat/jobs/check-ghosting — run periodically to apply penalties
router.post('/jobs/check-ghosting', async (req, res) => {
  // In production, secure this with a shared secret header
  if (req.headers['x-job-secret'] !== process.env.JOB_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const threshold = new Date(Date.now() - GHOST_THRESHOLD_HOURS * 3600 * 1000);

    const { rows: ghosted } = await db.query(
      `SELECT rt.user_id, rt.match_id
       FROM response_tracking rt
       JOIN matches m ON m.id = rt.match_id
       WHERE rt.last_responded_at < $1
         AND rt.penalty_applied = false`,
      [threshold]
    );

    for (const row of ghosted) {
      // Reduce visibility score by 5 points, floor at 0
      await db.query(
        `UPDATE users
         SET visibility_score = GREATEST(0, visibility_score - 5)
         WHERE id = $1`,
        [row.user_id]
      );

      await db.query(
        'UPDATE response_tracking SET penalty_applied = true WHERE match_id = $1 AND user_id = $2',
        [row.match_id, row.user_id]
      );
    }

    // Boost high-responders — users with response_rate > 90 who haven't been boosted recently
    await db.query(
      `UPDATE users
       SET visibility_score = LEAST(100, visibility_score + 2)
       WHERE response_rate > 90 AND visibility_score < 100`
    );

    res.json({ penalized: ghosted.length });
  } catch (err) {
    console.error('Ghosting check error:', err);
    res.status(500).json({ error: 'Job failed' });
  }
});

module.exports = router;
