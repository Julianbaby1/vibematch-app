/**
 * Chat routes — message history + send message REST endpoint.
 *
 * Real-time delivery is now handled by Supabase Realtime on the
 * frontend (postgres_changes subscription on the messages table).
 * The POST endpoint just inserts; Realtime takes care of broadcasting.
 *
 * The ghosting check job remains as a periodic HTTP endpoint.
 */
const express        = require('express');
const supabase       = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── GET /api/chat/:matchId ─────────────────────────────────────
router.get('/:matchId', authMiddleware, async (req, res) => {
  // Verify the requesting user belongs to this match
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id')
    .eq('id', req.params.matchId)
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
    .single();

  if (matchError || !match) return res.status(403).json({ error: 'Access denied' });

  // Fetch messages with sender info
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('id, sender_id, content, message_type, media_url, is_read, created_at, users(first_name, profile_photo_url)')
    .eq('match_id', req.params.matchId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (msgError) return res.status(500).json({ error: 'Failed to fetch messages' });

  // Mark incoming messages as read (fire-and-forget)
  supabase
    .from('messages')
    .update({ is_read: true })
    .eq('match_id', req.params.matchId)
    .neq('sender_id', req.user.id)
    .then(() => {});

  // Update last_seen for this user
  const isUser1   = match.user1_id === req.user.id;
  const seenField = isUser1 ? 'user1_last_seen' : 'user2_last_seen';
  supabase.from('matches').update({ [seenField]: new Date().toISOString() })
    .eq('id', req.params.matchId)
    .then(() => {});

  // Flatten the joined users object
  const flat = (messages || []).map(({ users, ...msg }) => ({
    ...msg,
    first_name:        users?.first_name,
    profile_photo_url: users?.profile_photo_url,
  }));

  res.json(flat);
});

// ── POST /api/chat/:matchId ────────────────────────────────────
// REST send (Supabase Realtime broadcasts the INSERT automatically)
router.post('/:matchId', authMiddleware, async (req, res) => {
  const { content, message_type = 'text', media_url } = req.body;

  // Authorisation check
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id')
    .eq('id', req.params.matchId)
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
    .single();

  if (matchError || !match) return res.status(403).json({ error: 'Access denied' });

  // Insert message (Realtime will broadcast this to all subscribers)
  const { data: msg, error: insertError } = await supabase
    .from('messages')
    .insert({
      match_id:     req.params.matchId,
      sender_id:    req.user.id,
      content,
      message_type,
      media_url:    media_url || null,
    })
    .select()
    .single();

  if (insertError) return res.status(500).json({ error: 'Failed to send message' });

  // Update match's last_message_at and reset ghosting clock (fire-and-forget)
  supabase.from('matches')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', req.params.matchId)
    .then(() => {});

  supabase.from('response_tracking')
    .update({ last_responded_at: new Date().toISOString(), ghost_warning_sent: false, penalty_applied: false })
    .eq('match_id', req.params.matchId)
    .eq('user_id', req.user.id)
    .then(() => {});

  res.status(201).json(msg);
});

// ── POST /api/chat/jobs/check-ghosting ────────────────────────
// Periodic job — call from a cron or cloud scheduler.
// Delegates all logic to the run_ghosting_check() DB function.
router.post('/jobs/check-ghosting', async (req, res) => {
  if (req.headers['x-job-secret'] !== process.env.JOB_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data: penalised, error } = await supabase.rpc('run_ghosting_check');
  if (error) {
    console.error('Ghosting check error:', error);
    return res.status(500).json({ error: 'Job failed' });
  }

  res.json({ penalised });
});

module.exports = router;
