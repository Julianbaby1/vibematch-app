-- =============================================================
--  Second Wind — Supabase Schema
--  Run this in the Supabase SQL editor (Project → SQL Editor)
--  Extensions, tables, RLS, policies, indexes.
-- =============================================================

-- ─── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
--  TABLES
-- =============================================================

-- ─── Users profile (mirrors auth.users via same UUID) ─────────
-- NOTE: password storage is handled entirely by Supabase Auth.
--       This table stores application-level profile data only.
CREATE TABLE IF NOT EXISTS public.users (
  -- id must match auth.users.id — Supabase Auth is the source of truth
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT UNIQUE NOT NULL,
  first_name        TEXT NOT NULL,
  date_of_birth     DATE NOT NULL,
  -- single | divorced | widowed | separated | other
  life_stage        TEXT,
  bio               TEXT,
  location          TEXT,
  city              TEXT,
  profile_photo_url TEXT,
  voice_intro_url   TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_banned         BOOLEAN NOT NULL DEFAULT false,
  is_admin          BOOLEAN NOT NULL DEFAULT false,
  -- 0–100; lowered by ghosting, raised by responsiveness
  visibility_score  INTEGER NOT NULL DEFAULT 100
                    CHECK (visibility_score BETWEEN 0 AND 100),
  response_rate     NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  login_streak      INTEGER NOT NULL DEFAULT 0,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Interests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_interests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  interest   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Conversation prompts ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prompts (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question  TEXT NOT NULL,
  category  TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.user_prompt_responses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prompt_id  UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  response   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, prompt_id)
);

-- ─── Daily match queue (max 5 suggestions/day) ────────────────
CREATE TABLE IF NOT EXISTS public.daily_match_queue (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  suggested_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  -- pending | connect | pass
  action            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, suggested_user_id, date)
);

-- ─── Matches (confirmed mutual connections) ───────────────────
CREATE TABLE IF NOT EXISTS public.matches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  compatibility_score INTEGER,
  last_message_at     TIMESTAMPTZ,
  user1_last_seen     TIMESTAMPTZ,
  user2_last_seen     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user1_id, user2_id)
);

-- ─── Messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT,
  -- text | voice | image
  message_type TEXT NOT NULL DEFAULT 'text',
  media_url    TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Accountability / Ghosting tracking ───────────────────────
CREATE TABLE IF NOT EXISTS public.response_tracking (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id           UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_responded_at  TIMESTAMPTZ,
  ghost_warning_sent BOOLEAN NOT NULL DEFAULT false,
  penalty_applied    BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (match_id, user_id)
);

-- ─── Interest circles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.circles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  creator_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.circle_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- member | moderator
  role      TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.circle_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id  UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  location      TEXT,
  city          TEXT,
  event_date    TIMESTAMPTZ NOT NULL,
  max_attendees INTEGER,
  category      TEXT,
  is_online     BOOLEAN NOT NULL DEFAULT false,
  rsvp_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- going | maybe | not_going
  status    TEXT NOT NULL DEFAULT 'going',
  rsvped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- ─── Reports ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason           TEXT,
  details          TEXT,
  -- pending | reviewed | resolved
  status           TEXT NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Badges ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- consistent_communicator | community_pillar | event_organizer | streak_7 | streak_30
  badge_type TEXT NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_type)
);

-- =============================================================
--  INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_messages_match_id     ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_user1         ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2         ON public.matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_daily_queue_user_date ON public.daily_match_queue(user_id, date);
CREATE INDEX IF NOT EXISTS idx_circle_members_user   ON public.circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_city_date      ON public.events(city, event_date);
CREATE INDEX IF NOT EXISTS idx_users_visibility
  ON public.users(visibility_score DESC)
  WHERE is_active = true AND is_banned = false;

-- =============================================================
--  SUPABASE REALTIME
--  Enable change events for chat tables so frontend can
--  subscribe without polling.
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_messages;

-- Full row data on updates (needed for UPDATE/DELETE events)
ALTER TABLE public.messages       REPLICA IDENTITY FULL;
ALTER TABLE public.circle_messages REPLICA IDENTITY FULL;

-- =============================================================
--  STORAGE BUCKETS
--  Create these in the Supabase dashboard OR via the API.
--  Listed here for documentation:
--    profile-photos  — public, 5 MB limit, images only
--    voice-intros    — public, 10 MB limit, audio only
--    voice-messages  — private, 10 MB limit, audio only
-- =============================================================

-- =============================================================
--  ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prompt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_match_queue     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_tracking     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges           ENABLE ROW LEVEL SECURITY;

-- ─── users ────────────────────────────────────────────────────
-- Anyone authenticated can read active, non-banned profiles
CREATE POLICY "users_select_public" ON public.users
  FOR SELECT TO authenticated
  USING (is_active = true AND is_banned = false);

-- A user can always read their own row (even if banned)
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- A user can only update their own row; they cannot flip is_admin/is_banned
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND is_admin = (SELECT is_admin FROM public.users WHERE id = auth.uid())
    AND is_banned = (SELECT is_banned FROM public.users WHERE id = auth.uid())
  );

-- Service role (backend) handles INSERT; no direct client inserts
-- (profile is created by the backend after Supabase Auth createUser)

-- ─── user_interests ───────────────────────────────────────────
CREATE POLICY "interests_select_authenticated" ON public.user_interests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "interests_insert_own" ON public.user_interests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "interests_delete_own" ON public.user_interests
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ─── prompts ──────────────────────────────────────────────────
CREATE POLICY "prompts_select_authenticated" ON public.prompts
  FOR SELECT TO authenticated USING (is_active = true);

-- ─── user_prompt_responses ────────────────────────────────────
CREATE POLICY "responses_select_authenticated" ON public.user_prompt_responses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "responses_insert_own" ON public.user_prompt_responses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "responses_update_own" ON public.user_prompt_responses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── daily_match_queue ────────────────────────────────────────
CREATE POLICY "queue_select_own" ON public.daily_match_queue
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "queue_insert_own" ON public.daily_match_queue
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "queue_update_own" ON public.daily_match_queue
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ─── matches ──────────────────────────────────────────────────
-- Users can only see matches they participate in
CREATE POLICY "matches_select_participant" ON public.matches
  FOR SELECT TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ─── messages ─────────────────────────────────────────────────
-- The most security-critical policy: only match participants can read messages
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Only a participant can insert into a match they belong to
CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- ─── response_tracking ────────────────────────────────────────
-- Only the backend (service role) writes this — no direct client access
CREATE POLICY "response_tracking_none" ON public.response_tracking
  FOR ALL TO authenticated USING (false);

-- ─── circles ──────────────────────────────────────────────────
CREATE POLICY "circles_select_authenticated" ON public.circles
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "circles_insert_authenticated" ON public.circles
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

-- ─── circle_members ───────────────────────────────────────────
CREATE POLICY "circle_members_select_authenticated" ON public.circle_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "circle_members_insert_own" ON public.circle_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "circle_members_delete_own" ON public.circle_members
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ─── circle_messages ──────────────────────────────────────────
-- Only circle members can read messages
CREATE POLICY "circle_messages_select_member" ON public.circle_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = circle_messages.circle_id
        AND cm.user_id = auth.uid()
    )
  );

-- Only circle members can post
CREATE POLICY "circle_messages_insert_member" ON public.circle_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid()
    )
  );

-- ─── events ───────────────────────────────────────────────────
CREATE POLICY "events_select_authenticated" ON public.events
  FOR SELECT TO authenticated USING (event_date >= NOW());

CREATE POLICY "events_insert_own" ON public.events
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

CREATE POLICY "events_update_own" ON public.events
  FOR UPDATE TO authenticated USING (creator_id = auth.uid());

-- ─── event_rsvps ──────────────────────────────────────────────
CREATE POLICY "rsvps_select_authenticated" ON public.event_rsvps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rsvps_insert_own" ON public.event_rsvps
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "rsvps_update_own" ON public.event_rsvps
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "rsvps_delete_own" ON public.event_rsvps
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ─── reports ──────────────────────────────────────────────────
CREATE POLICY "reports_insert_authenticated" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

-- Users can only see their own reports (admins handled via service role)
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());

-- ─── user_badges ──────────────────────────────────────────────
CREATE POLICY "badges_select_authenticated" ON public.user_badges
  FOR SELECT TO authenticated USING (true);
