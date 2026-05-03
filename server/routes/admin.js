const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users, matches, messages, events, reports] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users WHERE is_banned = false'),
      db.query('SELECT COUNT(*) FROM matches'),
      db.query('SELECT COUNT(*) FROM messages'),
      db.query('SELECT COUNT(*) FROM events WHERE event_date >= NOW()'),
      db.query("SELECT COUNT(*) FROM reports WHERE status = 'pending'"),
    ]);

    const [newToday, activeWeek] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours'"),
      db.query("SELECT COUNT(*) FROM users WHERE last_login_at >= NOW() - INTERVAL '7 days'"),
    ]);

    res.json({
      total_users: parseInt(users.rows[0].count, 10),
      total_matches: parseInt(matches.rows[0].count, 10),
      total_messages: parseInt(messages.rows[0].count, 10),
      upcoming_events: parseInt(events.rows[0].count, 10),
      pending_reports: parseInt(reports.rows[0].count, 10),
      new_users_today: parseInt(newToday.rows[0].count, 10),
      active_users_week: parseInt(activeWeek.rows[0].count, 10),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1 } = req.query;
    const limit = 25;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.first_name, u.date_of_birth, u.city,
             u.is_active, u.is_banned, u.is_admin,
             u.visibility_score, u.response_rate, u.login_streak,
             u.created_at, u.last_login_at,
             (SELECT COUNT(*) FROM matches m WHERE m.user1_id = u.id OR m.user2_id = u.id)::int AS match_count,
             (SELECT COUNT(*) FROM reports r WHERE r.reported_user_id = u.id)::int AS report_count
      FROM users u
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE (u.email ILIKE $1 OR u.first_name ILIKE $1)`;
    }

    params.push(limit, offset);
    query += ` ORDER BY u.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/ban/:userId
router.post('/ban/:userId', async (req, res) => {
  try {
    const { reason } = req.body;
    await db.query(
      'UPDATE users SET is_banned = true, is_active = false WHERE id = $1',
      [req.params.userId]
    );
    if (reason) {
      await db.query(
        `INSERT INTO reports (reporter_id, reported_user_id, reason, status, details)
         VALUES ($1, $2, 'admin_ban', 'resolved', $3)`,
        [req.user.id, req.params.userId, reason]
      );
    }
    res.json({ message: 'User banned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// POST /api/admin/unban/:userId
router.post('/unban/:userId', async (req, res) => {
  try {
    await db.query(
      'UPDATE users SET is_banned = false, is_active = true WHERE id = $1',
      [req.params.userId]
    );
    res.json({ message: 'User unbanned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.reason, r.details, r.status, r.created_at,
              reporter.first_name AS reporter_name, reporter.email AS reporter_email,
              reported.first_name AS reported_name, reported.email AS reported_email,
              reported.id AS reported_user_id
       FROM reports r
       JOIN users reporter ON reporter.id = r.reporter_id
       JOIN users reported ON reported.id = r.reported_user_id
       ORDER BY r.created_at DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// PATCH /api/admin/reports/:id
router.patch('/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE reports SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Report updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

module.exports = router;
