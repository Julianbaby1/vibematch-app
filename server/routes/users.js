/**
 * User routes — profile CRUD + Supabase Storage uploads.
 *
 * File uploads now go to Supabase Storage instead of local disk.
 * Buckets required (create in Supabase dashboard):
 *   profile-photos  (public)
 *   voice-intros    (public)
 */
const express        = require('express');
const multer         = require('multer');
const supabase       = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Use memory storage — file is buffered and uploaded to Supabase Storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── GET /api/users/prompts/list ────────────────────────────────
// Public endpoint — no auth required (used during registration before user has a token)
// Placed before /:id to avoid route collision
router.get('/prompts/list', async (req, res) => {
  const { data, error } = await supabase
    .from('prompts')
    .select('id, question, category')
    .eq('is_active', true)
    .order('category');

  if (error) return res.status(500).json({ error: 'Failed to fetch prompts' });
  res.json(data);
});

// ── GET /api/users/:id ─────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.rpc('get_full_user_profile', {
    p_user_id: req.params.id,
  });

  if (error || !data) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// ── PUT /api/users/profile ─────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  const { first_name, life_stage, bio, location, city, interests, prompt_responses } = req.body;

  // Update scalar fields (only fields that are provided)
  const updates = {};
  if (first_name !== undefined) updates.first_name = first_name;
  if (life_stage  !== undefined) updates.life_stage  = life_stage;
  if (bio         !== undefined) updates.bio         = bio;
  if (location    !== undefined) updates.location    = location;
  if (city        !== undefined) updates.city        = city;

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('users').update(updates).eq('id', req.user.id);
    if (error) return res.status(500).json({ error: 'Failed to update profile' });
  }

  // Replace interests
  if (Array.isArray(interests)) {
    await supabase.from('user_interests').delete().eq('user_id', req.user.id);
    if (interests.length > 0) {
      const rows = interests.slice(0, 10).map((interest) => ({
        user_id: req.user.id,
        interest: interest.trim(),
      }));
      const { error } = await supabase.from('user_interests').insert(rows);
      if (error) return res.status(500).json({ error: 'Failed to update interests' });
    }
  }

  // Upsert prompt responses
  if (Array.isArray(prompt_responses) && prompt_responses.length > 0) {
    const rows = prompt_responses.map(({ prompt_id, response }) => ({
      user_id: req.user.id,
      prompt_id,
      response,
    }));
    const { error } = await supabase
      .from('user_prompt_responses')
      .upsert(rows, { onConflict: 'user_id,prompt_id' });
    if (error) return res.status(500).json({ error: 'Failed to update responses' });
  }

  res.json({ message: 'Profile updated' });
});

// ── POST /api/users/upload/photo ───────────────────────────────
router.post('/upload/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext      = req.file.originalname.split('.').pop();
  const filePath = `${req.user.id}/photo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    console.error('Photo upload error:', uploadError);
    return res.status(500).json({ error: 'Upload failed' });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath);

  await supabase.from('users').update({ profile_photo_url: publicUrl }).eq('id', req.user.id);
  res.json({ url: publicUrl });
});

// ── POST /api/users/upload/voice ───────────────────────────────
router.post('/upload/voice', authMiddleware, upload.single('voice'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext      = req.file.originalname.split('.').pop();
  const filePath = `${req.user.id}/voice-intro-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('voice-intros')
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    console.error('Voice upload error:', uploadError);
    return res.status(500).json({ error: 'Upload failed' });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('voice-intros')
    .getPublicUrl(filePath);

  await supabase.from('users').update({ voice_intro_url: publicUrl }).eq('id', req.user.id);
  res.json({ url: publicUrl });
});

// ── POST /api/users/report/:id ─────────────────────────────────
router.post('/report/:id', authMiddleware, async (req, res) => {
  const { reason, details } = req.body;
  const { error } = await supabase.from('reports').insert({
    reporter_id:      req.user.id,
    reported_user_id: req.params.id,
    reason,
    details,
  });
  if (error) return res.status(500).json({ error: 'Failed to submit report' });
  res.json({ message: 'Report submitted' });
});

module.exports = router;
