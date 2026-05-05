const express        = require('express');
const supabase       = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', async (req, res) => {
  const [
    { count: totalUsers },
    { count: totalMatches },
    { count: totalMessages },
    { count: upcomingEvents },
    { count: pendingReports },
    { count: newToday },
    { count: activeWeek },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_banned', false),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).gte('event_date', new Date().toISOString()),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .gte('last_login_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  res.json({
    total_users:      totalUsers   || 0,
    total_matches:    totalMatches  || 0,
    total_messages:   totalMessages || 0,
    upcoming_events:  upcomingEvents|| 0,
    pending_reports:  pendingReports|| 0,
    new_users_today:  newToday      || 0,
    active_users_week: activeWeek   || 0,
  });
});

// ── GET /api/admin/users ──────────────────────────────────────
router.get('/users', async (req, res) => {
  const { search, page = 1 } = req.query;
  const limit  = 25;
  const offset = (parseInt(page, 10) - 1) * limit;

  let query = supabase
    .from('users')
    .select('id, email, first_name, date_of_birth, city, is_active, is_banned, is_admin, visibility_score, response_rate, login_streak, created_at, last_login_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to fetch users' });
  res.json(data || []);
});

// ── POST /api/admin/ban/:userId ───────────────────────────────
router.post('/ban/:userId', async (req, res) => {
  const { reason } = req.body;

  await supabase.from('users').update({ is_banned: true, is_active: false }).eq('id', req.params.userId);

  if (reason) {
    await supabase.from('reports').insert({
      reporter_id:      req.user.id,
      reported_user_id: req.params.userId,
      reason:           'admin_ban',
      details:          reason,
      status:           'resolved',
    });
  }

  res.json({ message: 'User banned' });
});

// ── POST /api/admin/unban/:userId ─────────────────────────────
router.post('/unban/:userId', async (req, res) => {
  await supabase.from('users').update({ is_banned: false, is_active: true }).eq('id', req.params.userId);
  res.json({ message: 'User unbanned' });
});

// ── GET /api/admin/reports ────────────────────────────────────
router.get('/reports', async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id, reason, details, status, created_at,
      reporter:reporter_id(first_name, email),
      reported:reported_user_id(id, first_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: 'Failed to fetch reports' });

  const flat = (data || []).map(({ reporter, reported, ...r }) => ({
    ...r,
    reporter_name:    reporter?.first_name,
    reporter_email:   reporter?.email,
    reported_name:    reported?.first_name,
    reported_email:   reported?.email,
    reported_user_id: reported?.id,
  }));

  res.json(flat);
});

// ── PATCH /api/admin/reports/:id ──────────────────────────────
router.patch('/reports/:id', async (req, res) => {
  const { status } = req.body;
  const { error } = await supabase.from('reports').update({ status }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to update report' });
  res.json({ message: 'Report updated' });
});

module.exports = router;
