const express        = require('express');
const supabase       = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── GET /api/events ───────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  const { city, category } = req.query;

  let query = supabase
    .from('events')
    .select('*, creator:creator_id(first_name)')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(50);

  if (city)     query = query.ilike('city', city);
  if (category) query = query.eq('category', category);

  const { data: events, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to fetch events' });

  // Determine RSVP status for each event
  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('event_id, status')
    .eq('user_id', req.user.id);

  const rsvpMap = Object.fromEntries((rsvps || []).map((r) => [r.event_id, r.status]));

  const enriched = (events || []).map(({ creator, ...evt }) => ({
    ...evt,
    creator_name: creator?.first_name,
    has_rsvped:   !!rsvpMap[evt.id],
    rsvp_status:  rsvpMap[evt.id] || null,
  }));

  res.json(enriched);
});

// ── POST /api/events ──────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, location, city, event_date, max_attendees, category, is_online } = req.body;
  if (!title || !event_date) return res.status(400).json({ error: 'Title and event date are required' });

  const { data, error } = await supabase
    .from('events')
    .insert({
      creator_id: req.user.id,
      title,
      description: description || null,
      location:    location    || null,
      city:        city        || null,
      event_date,
      max_attendees: max_attendees ? parseInt(max_attendees, 10) : null,
      category:    category    || null,
      is_online:   !!is_online,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create event' });

  // Award event_organizer badge (ignore conflict if already earned)
  await supabase.from('user_badges')
    .upsert({ user_id: req.user.id, badge_type: 'event_organizer' }, { onConflict: 'user_id,badge_type', ignoreDuplicates: true });

  res.status(201).json(data);
});

// ── POST /api/events/:id/rsvp ─────────────────────────────────
router.post('/:id/rsvp', authMiddleware, async (req, res) => {
  const { status = 'going' } = req.body;
  if (!['going', 'maybe', 'not_going'].includes(status)) {
    return res.status(400).json({ error: 'Invalid RSVP status' });
  }

  // Check capacity
  if (status === 'going') {
    const { data: evt } = await supabase
      .from('events')
      .select('max_attendees, rsvp_count')
      .eq('id', req.params.id)
      .single();

    if (!evt) return res.status(404).json({ error: 'Event not found' });
    if (evt.max_attendees && evt.rsvp_count >= evt.max_attendees) {
      return res.status(409).json({ error: 'Event is at capacity' });
    }
  }

  // Fetch existing RSVP
  const { data: existing } = await supabase
    .from('event_rsvps')
    .select('id, status')
    .eq('event_id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (existing) {
    const wasGoing = existing.status === 'going';
    const nowGoing = status === 'going';
    await supabase.from('event_rsvps')
      .update({ status })
      .eq('event_id', req.params.id)
      .eq('user_id', req.user.id);

    if (wasGoing && !nowGoing) {
      await supabase.from('events').update({ rsvp_count: supabase.raw('rsvp_count - 1') }).eq('id', req.params.id);
    } else if (!wasGoing && nowGoing) {
      await supabase.from('events').update({ rsvp_count: supabase.raw('rsvp_count + 1') }).eq('id', req.params.id);
    }
  } else {
    await supabase.from('event_rsvps').insert({ event_id: req.params.id, user_id: req.user.id, status });
    if (status === 'going') {
      await supabase.rpc('increment_rsvp_count', { p_event_id: req.params.id });
    }
  }

  res.json({ message: 'RSVP updated', status });
});

// ── GET /api/events/:id/attendees ─────────────────────────────
router.get('/:id/attendees', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('event_rsvps')
    .select('status, users(id, first_name, profile_photo_url, city)')
    .eq('event_id', req.params.id)
    .eq('status', 'going')
    .order('rsvped_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'Failed to fetch attendees' });

  const flat = (data || []).map(({ users, status }) => ({ ...users, status }));
  res.json(flat);
});

module.exports = router;
