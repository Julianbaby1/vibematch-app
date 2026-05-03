const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'second-wind-dev-secret';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function ageFromDob(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, date_of_birth, life_stage, bio, location, city } = req.body;

    if (!email || !password || !first_name || !date_of_birth) {
      return res.status(400).json({ error: 'Email, password, name, and date of birth are required' });
    }

    if (ageFromDob(date_of_birth) < 39) {
      return res.status(400).json({ error: 'Second Wind is for users aged 39 and older' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, first_name, date_of_birth, life_stage, bio, location, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, first_name, date_of_birth, life_stage, bio, location, city, is_admin, created_at`,
      [email.toLowerCase(), password_hash, first_name, date_of_birth, life_stage || null, bio || null, location || null, city || null]
    );

    const user = rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_banned = false',
      [email.toLowerCase()]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update login streak
    const today = new Date().toDateString();
    const lastLogin = user.last_login_at ? new Date(user.last_login_at).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let newStreak = lastLogin === yesterday ? user.login_streak + 1 : 1;
    if (lastLogin === today) newStreak = user.login_streak; // already logged in today

    await db.query(
      'UPDATE users SET last_login_at = NOW(), login_streak = $1 WHERE id = $2',
      [newStreak, user.id]
    );

    // Award streak badges
    if (newStreak >= 7) {
      await db.query(
        `INSERT INTO user_badges (user_id, badge_type) VALUES ($1, 'streak_7') ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }
    if (newStreak >= 30) {
      await db.query(
        `INSERT INTO user_badges (user_id, badge_type) VALUES ($1, 'streak_30') ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }

    const { password_hash: _, ...safeUser } = user;
    safeUser.login_streak = newStreak;

    res.json({ token: signToken(user), user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.email, u.first_name, u.date_of_birth, u.life_stage, u.bio,
              u.location, u.city, u.profile_photo_url, u.voice_intro_url,
              u.visibility_score, u.response_rate, u.login_streak, u.is_admin,
              u.created_at,
              COALESCE(json_agg(DISTINCT ui.interest) FILTER (WHERE ui.id IS NOT NULL), '[]') AS interests,
              COALESCE(json_agg(DISTINCT jsonb_build_object('badge_type', ub.badge_type, 'earned_at', ub.earned_at))
                       FILTER (WHERE ub.id IS NOT NULL), '[]') AS badges
       FROM users u
       LEFT JOIN user_interests ui ON ui.user_id = u.id
       LEFT JOIN user_badges ub ON ub.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
