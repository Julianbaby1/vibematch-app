const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/circles — list all circles
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.name, c.description, c.category, c.member_count, c.created_at,
              EXISTS(
                SELECT 1 FROM circle_members cm WHERE cm.circle_id = c.id AND cm.user_id = $1
              ) AS is_member
       FROM circles c
       WHERE c.is_active = true
       ORDER BY c.member_count DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch circles' });
  }
});

// POST /api/circles — create a new circle
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Circle name is required' });

    const { rows } = await db.query(
      `INSERT INTO circles (name, description, category, creator_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description || null, category || null, req.user.id]
    );

    const circle = rows[0];

    // Creator auto-joins as moderator
    await db.query(
      `INSERT INTO circle_members (circle_id, user_id, role) VALUES ($1, $2, 'moderator')`,
      [circle.id, req.user.id]
    );
    await db.query(
      'UPDATE circles SET member_count = member_count + 1 WHERE id = $1',
      [circle.id]
    );

    res.status(201).json(circle);
  } catch (err) {
    console.error('Create circle error:', err);
    res.status(500).json({ error: 'Failed to create circle' });
  }
});

// POST /api/circles/:id/join
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    await db.query(
      `INSERT INTO circle_members (circle_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.params.id, req.user.id]
    );
    await db.query(
      'UPDATE circles SET member_count = member_count + 1 WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Joined circle' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join circle' });
  }
});

// POST /api/circles/:id/leave
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM circle_members WHERE circle_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rowCount > 0) {
      await db.query(
        'UPDATE circles SET member_count = GREATEST(0, member_count - 1) WHERE id = $1',
        [req.params.id]
      );
    }
    res.json({ message: 'Left circle' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave circle' });
  }
});

// GET /api/circles/:id/messages
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const isMember = await db.query(
      'SELECT 1 FROM circle_members WHERE circle_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!isMember.rows[0]) return res.status(403).json({ error: 'Join the circle to view messages' });

    const { rows } = await db.query(
      `SELECT cm.id, cm.content, cm.created_at,
              u.id AS user_id, u.first_name, u.profile_photo_url
       FROM circle_messages cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.circle_id = $1
       ORDER BY cm.created_at DESC
       LIMIT 100`,
      [req.params.id]
    );

    res.json(rows.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/circles/:id/messages
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const isMember = await db.query(
      'SELECT 1 FROM circle_members WHERE circle_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!isMember.rows[0]) return res.status(403).json({ error: 'Join the circle first' });

    const { rows } = await db.query(
      `INSERT INTO circle_messages (circle_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user.id, content.trim()]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
