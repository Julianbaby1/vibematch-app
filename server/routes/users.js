const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// GET /api/users/:id — public profile
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.first_name, u.date_of_birth, u.life_stage, u.bio,
              u.city, u.profile_photo_url, u.voice_intro_url,
              u.visibility_score, u.response_rate, u.login_streak,
              COALESCE(json_agg(DISTINCT ui.interest) FILTER (WHERE ui.id IS NOT NULL), '[]') AS interests,
              COALESCE(json_agg(DISTINCT jsonb_build_object(
                'question', p.question,
                'response', upr.response
              )) FILTER (WHERE upr.id IS NOT NULL), '[]') AS prompt_responses,
              COALESCE(json_agg(DISTINCT jsonb_build_object('badge_type', ub.badge_type))
                       FILTER (WHERE ub.id IS NOT NULL), '[]') AS badges
       FROM users u
       LEFT JOIN user_interests ui ON ui.user_id = u.id
       LEFT JOIN user_prompt_responses upr ON upr.user_id = u.id
       LEFT JOIN prompts p ON p.id = upr.prompt_id
       LEFT JOIN user_badges ub ON ub.user_id = u.id
       WHERE u.id = $1 AND u.is_active = true AND u.is_banned = false
       GROUP BY u.id`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/users/profile — update own profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { first_name, life_stage, bio, location, city, interests, prompt_responses } = req.body;

    await db.query(
      `UPDATE users SET first_name = COALESCE($1, first_name),
                        life_stage = COALESCE($2, life_stage),
                        bio = COALESCE($3, bio),
                        location = COALESCE($4, location),
                        city = COALESCE($5, city),
                        updated_at = NOW()
       WHERE id = $6`,
      [first_name, life_stage, bio, location, city, req.user.id]
    );

    // Replace interests
    if (Array.isArray(interests)) {
      await db.query('DELETE FROM user_interests WHERE user_id = $1', [req.user.id]);
      for (const interest of interests.slice(0, 10)) {
        await db.query(
          'INSERT INTO user_interests (user_id, interest) VALUES ($1, $2)',
          [req.user.id, interest.trim()]
        );
      }
    }

    // Replace prompt responses
    if (Array.isArray(prompt_responses)) {
      for (const { prompt_id, response } of prompt_responses) {
        await db.query(
          `INSERT INTO user_prompt_responses (user_id, prompt_id, response)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, prompt_id) DO UPDATE SET response = EXCLUDED.response`,
          [req.user.id, prompt_id, response]
        );
      }
    }

    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/upload/photo
router.post('/upload/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    await db.query('UPDATE users SET profile_photo_url = $1 WHERE id = $2', [url, req.user.id]);
    res.json({ url });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/users/upload/voice
router.post('/upload/voice', authMiddleware, upload.single('voice'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    await db.query('UPDATE users SET voice_intro_url = $1 WHERE id = $2', [url, req.user.id]);
    res.json({ url });
  } catch (err) {
    console.error('Voice upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/users/prompts/list — available prompts
router.get('/prompts/list', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, question, category FROM prompts WHERE is_active = true ORDER BY category');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// POST /api/users/report/:id
router.post('/report/:id', authMiddleware, async (req, res) => {
  try {
    const { reason, details } = req.body;
    await db.query(
      'INSERT INTO reports (reporter_id, reported_user_id, reason, details) VALUES ($1, $2, $3, $4)',
      [req.user.id, req.params.id, reason, details]
    );
    res.json({ message: 'Report submitted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
