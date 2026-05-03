const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/events — browse events (optional ?city=)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { city, category } = req.query;

    let query = `
      SELECT e.id, e.title, e.description, e.location, e.city, e.event_date,
             e.max_attendees, e.category, e.is_online, e.rsvp_count, e.created_at,
             u.first_name AS creator_name, u.id AS creator_id,
             EXISTS(
               SELECT 1 FROM event_rsvps er WHERE er.event_id = e.id AND er.user_id = $1
             ) AS has_rsvped,
             (SELECT er.status FROM event_rsvps er WHERE er.event_id = e.id AND er.user_id = $1) AS rsvp_status
      FROM events e
      JOIN users u ON u.id = e.creator_id
      WHERE e.event_date >= NOW()
    `;
    const params = [req.user.id];

    if (city) {
      params.push(city);
      query += ` AND LOWER(e.city) = LOWER($${params.length})`;
    }
    if (category) {
      params.push(category);
      query += ` AND e.category = $${params.length}`;
    }

    query += ' ORDER BY e.event_date ASC LIMIT 50';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events — create event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, location, city, event_date, max_attendees, category, is_online } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and event date are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO events (creator_id, title, description, location, city, event_date, max_attendees, category, is_online)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, title, description || null, location || null, city || null,
       event_date, max_attendees || null, category || null, is_online || false]
    );

    // Award badge for organizing events
    await db.query(
      `INSERT INTO user_badges (user_id, badge_type) VALUES ($1, 'event_organizer') ON CONFLICT DO NOTHING`,
      [req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const { status = 'going' } = req.body;

    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ error: 'Invalid RSVP status' });
    }

    // Check capacity
    if (status === 'going') {
      const { rows: eventRows } = await db.query(
        'SELECT max_attendees, rsvp_count FROM events WHERE id = $1',
        [req.params.id]
      );
      const event = eventRows[0];
      if (!event) return res.status(404).json({ error: 'Event not found' });

      if (event.max_attendees && event.rsvp_count >= event.max_attendees) {
        return res.status(409).json({ error: 'Event is at capacity' });
      }
    }

    const { rows: existing } = await db.query(
      'SELECT id, status FROM event_rsvps WHERE event_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existing[0]) {
      const oldStatus = existing[0].status;
      await db.query(
        'UPDATE event_rsvps SET status = $1 WHERE event_id = $2 AND user_id = $3',
        [status, req.params.id, req.user.id]
      );

      // Adjust rsvp_count
      const wasGoing = oldStatus === 'going';
      const nowGoing = status === 'going';
      if (wasGoing && !nowGoing) {
        await db.query('UPDATE events SET rsvp_count = rsvp_count - 1 WHERE id = $1', [req.params.id]);
      } else if (!wasGoing && nowGoing) {
        await db.query('UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = $1', [req.params.id]);
      }
    } else {
      await db.query(
        'INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1, $2, $3)',
        [req.params.id, req.user.id, status]
      );
      if (status === 'going') {
        await db.query('UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = $1', [req.params.id]);
      }
    }

    res.json({ message: 'RSVP updated', status });
  } catch (err) {
    console.error('RSVP error:', err);
    res.status(500).json({ error: 'Failed to update RSVP' });
  }
});

// GET /api/events/:id/attendees
router.get('/:id/attendees', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.first_name, u.profile_photo_url, u.city, er.status
       FROM event_rsvps er
       JOIN users u ON u.id = er.user_id
       WHERE er.event_id = $1 AND er.status = 'going'
       ORDER BY er.rsvped_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
});

module.exports = router;
