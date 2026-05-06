const express        = require('express');
const supabase       = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── GET /api/circles ──────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  const { data: circles, error } = await supabase
    .from('circles')
    .select('id, name, description, category, member_count, created_at')
    .eq('is_active', true)
    .order('member_count', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch circles' });

  // Determine membership for each circle
  const { data: memberships } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', req.user.id);

  const memberSet = new Set((memberships || []).map((m) => m.circle_id));

  res.json(circles.map((c) => ({ ...c, is_member: memberSet.has(c.id) })));
});

// ── POST /api/circles ─────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Circle name is required' });

  const { data: circle, error } = await supabase
    .from('circles')
    .insert({ name, description: description || null, category: category || null, creator_id: req.user.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create circle' });

  // Auto-join creator as moderator
  await supabase.from('circle_members').insert({ circle_id: circle.id, user_id: req.user.id, role: 'moderator' });
  await supabase.from('circles').update({ member_count: 1 }).eq('id', circle.id);

  res.status(201).json(circle);
});

// ── POST /api/circles/:id/join ────────────────────────────────
router.post('/:id/join', authMiddleware, async (req, res) => {
  const { error } = await supabase
    .from('circle_members')
    .upsert({ circle_id: req.params.id, user_id: req.user.id }, { onConflict: 'circle_id,user_id', ignoreDuplicates: true });

  if (error) return res.status(500).json({ error: 'Failed to join circle' });

  // Recalculate member_count accurately
  const { count } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('circle_id', req.params.id);

  await supabase.from('circles').update({ member_count: count || 0 }).eq('id', req.params.id);
  res.json({ message: 'Joined circle' });
});

// ── POST /api/circles/:id/leave ───────────────────────────────
router.post('/:id/leave', authMiddleware, async (req, res) => {
  await supabase.from('circle_members').delete()
    .eq('circle_id', req.params.id)
    .eq('user_id', req.user.id);

  const { count } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('circle_id', req.params.id);

  await supabase.from('circles').update({ member_count: count || 0 }).eq('id', req.params.id);
  res.json({ message: 'Left circle' });
});

// ── GET /api/circles/:id/messages ─────────────────────────────
router.get('/:id/messages', authMiddleware, async (req, res) => {
  // Verify membership
  const { data: member } = await supabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (!member) return res.status(403).json({ error: 'Join the circle to view messages' });

  const { data, error } = await supabase
    .from('circle_messages')
    .select('id, content, created_at, users(id, first_name, profile_photo_url)')
    .eq('circle_id', req.params.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: 'Failed to fetch messages' });

  const flat = (data || []).reverse().map(({ users, ...msg }) => ({
    ...msg,
    user_id:           users?.id,
    first_name:        users?.first_name,
    profile_photo_url: users?.profile_photo_url,
  }));

  res.json(flat);
});

// ── POST /api/circles/:id/messages ────────────────────────────
router.post('/:id/messages', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

  const { data: member } = await supabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (!member) return res.status(403).json({ error: 'Join the circle first' });

  const { data, error } = await supabase
    .from('circle_messages')
    .insert({ circle_id: req.params.id, user_id: req.user.id, content: content.trim() })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to send message' });
  res.status(201).json(data);
});

module.exports = router;
