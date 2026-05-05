/**
 * Auth routes — Supabase Auth backend.
 *
 * Register:  Express validates age → Supabase Admin creates auth user →
 *            Express creates public.users profile → frontend signs in.
 *
 * Login:     Supabase Auth signs in → Express updates streak/badges →
 *            Returns { access_token, refresh_token, user }.
 *
 * /me:       Returns full profile (interests, badges, prompts) via RPC.
 */
const express       = require('express');
const supabase      = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function ageFromDob(dob) {
  return Math.floor(
    (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
}

// ── POST /api/auth/register ────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, first_name, date_of_birth, life_stage, bio, location, city } = req.body;

  if (!email || !password || !first_name || !date_of_birth) {
    return res.status(400).json({ error: 'Email, password, name, and date of birth are required' });
  }
  if (ageFromDob(date_of_birth) < 39) {
    return res.status(400).json({ error: 'Second Wind is for users aged 39 and older' });
  }

  // 1. Create the Supabase Auth user (admin bypasses email confirmation in dev)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true, // set false in production to require email verification
  });

  if (authError) {
    const msg = authError.message.includes('already registered')
      ? 'An account with this email already exists'
      : authError.message;
    return res.status(409).json({ error: msg });
  }

  const authUserId = authData.user.id;

  // 2. Create the public profile row with the same UUID
  const { error: profileError } = await supabase.from('users').insert({
    id:            authUserId,
    email:         email.toLowerCase(),
    first_name,
    date_of_birth,
    life_stage:    life_stage || null,
    bio:           bio || null,
    location:      location || null,
    city:          city || null,
  });

  if (profileError) {
    // Roll back the auth user to keep things consistent
    await supabase.auth.admin.deleteUser(authUserId).catch(() => {});
    console.error('Profile insert error:', profileError);
    return res.status(500).json({ error: 'Failed to create profile' });
  }

  // 3. Sign the user in immediately to get a session token
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (signInError) {
    // Registration succeeded but we couldn't auto sign in — let the frontend do it
    return res.status(201).json({ message: 'Account created. Please sign in.' });
  }

  res.status(201).json({
    access_token:  sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    user: {
      id:            authUserId,
      email:         email.toLowerCase(),
      first_name,
      date_of_birth,
      life_stage,
      is_admin: false,
    },
  });
});

// ── POST /api/auth/login ───────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // 1. Sign in via Supabase Auth
  const { data: sessionData, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (error) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const userId = sessionData.user.id;

  // 2. Check ban status
  const { data: profile } = await supabase
    .from('users')
    .select('is_banned, login_streak, last_login_at')
    .eq('id', userId)
    .single();

  if (profile?.is_banned) {
    return res.status(403).json({ error: 'Account suspended' });
  }

  // 3. Update login streak
  const today     = new Date().toDateString();
  const lastLogin = profile?.last_login_at ? new Date(profile.last_login_at).toDateString() : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let newStreak = lastLogin === yesterday ? (profile.login_streak || 0) + 1 : 1;
  if (lastLogin === today) newStreak = profile.login_streak; // already logged in today

  await supabase.from('users').update({
    last_login_at: new Date().toISOString(),
    login_streak: newStreak,
  }).eq('id', userId);

  // 4. Award streak badges
  const badgesToCheck = [];
  if (newStreak >= 7)  badgesToCheck.push('streak_7');
  if (newStreak >= 30) badgesToCheck.push('streak_30');

  for (const badge of badgesToCheck) {
    await supabase.from('user_badges')
      .upsert({ user_id: userId, badge_type: badge }, { onConflict: 'user_id,badge_type', ignoreDuplicates: true });
  }

  res.json({
    access_token:  sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    user: {
      ...sessionData.user,
      login_streak: newStreak,
    },
  });
});

// ── POST /api/auth/refresh ─────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error) return res.status(401).json({ error: 'Could not refresh session' });

  res.json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

// ── GET /api/auth/me ───────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.rpc('get_full_user_profile', {
    p_user_id: req.user.id,
  });

  if (error || !data) {
    console.error('Me error:', error);
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(data);
});

// ── POST /api/auth/logout ──────────────────────────────────────
router.post('/logout', authMiddleware, async (req, res) => {
  // Supabase session invalidation happens client-side via supabase.auth.signOut().
  // We just acknowledge the request here.
  res.json({ message: 'Signed out' });
});

module.exports = router;
