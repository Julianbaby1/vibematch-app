-- Second Wind Dating App — PostgreSQL Schema
-- Run: psql -U postgres -d second_wind -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  first_name        VARCHAR(100) NOT NULL,
  date_of_birth     DATE NOT NULL,
  -- life stage: single | divorced | widowed | separated | other
  life_stage        VARCHAR(50),
  bio               TEXT,
  location          VARCHAR(255),
  city              VARCHAR(100),
  profile_photo_url VARCHAR(500),
  voice_intro_url   VARCHAR(500),
  is_active         BOOLEAN DEFAULT true,
  is_banned         BOOLEAN DEFAULT false,
  is_admin          BOOLEAN DEFAULT false,
  -- 0–100; lowered by ghosting, raised by responsiveness
  visibility_score  INTEGER DEFAULT 100 CHECK (visibility_score BETWEEN 0 AND 100),
  response_rate     DECIMAL(5,2) DEFAULT 100.00,
  login_streak      INTEGER DEFAULT 0,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  INTERESTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_interests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  interest   VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  CONVERSATION PROMPTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT NOT NULL,
  category   VARCHAR(50),
  is_active  BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_prompt_responses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt_id  UUID REFERENCES prompts(id) ON DELETE CASCADE,
  response   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- ─────────────────────────────────────────
--  DAILY MATCH QUEUE  (max 5 suggestions/day)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_match_queue (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  suggested_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date              DATE DEFAULT CURRENT_DATE,
  -- action: pending | connect | pass
  action            VARCHAR(10) DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, suggested_user_id, date)
);

-- ─────────────────────────────────────────
--  MATCHES  (confirmed mutual connections)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score INTEGER,
  last_message_at     TIMESTAMPTZ,
  user1_last_seen     TIMESTAMPTZ,
  user2_last_seen     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- ─────────────────────────────────────────
--  MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT,
  -- type: text | voice | image
  message_type VARCHAR(20) DEFAULT 'text',
  media_url    VARCHAR(500),
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  ACCOUNTABILITY / GHOSTING TRACKING
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS response_tracking (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id            UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  last_responded_at   TIMESTAMPTZ,
  ghost_warning_sent  BOOLEAN DEFAULT false,
  penalty_applied     BOOLEAN DEFAULT false,
  UNIQUE(match_id, user_id)
);

-- ─────────────────────────────────────────
--  INTEREST CIRCLES  (community groups)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS circles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  category     VARCHAR(100),
  creator_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS circle_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id  UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  -- role: member | moderator
  role       VARCHAR(20) DEFAULT 'member',
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS circle_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id  UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  EVENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  location      VARCHAR(500),
  city          VARCHAR(100),
  event_date    TIMESTAMPTZ NOT NULL,
  max_attendees INTEGER,
  category      VARCHAR(100),
  is_online     BOOLEAN DEFAULT false,
  rsvp_count    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  -- status: going | maybe | not_going
  status    VARCHAR(20) DEFAULT 'going',
  rsvped_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ─────────────────────────────────────────
--  REPORTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason           VARCHAR(100),
  details          TEXT,
  -- status: pending | reviewed | resolved
  status           VARCHAR(20) DEFAULT 'pending',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  BADGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  -- badge_type: consistent_communicator | community_pillar | event_organizer | streak_7 | streak_30
  badge_type VARCHAR(50),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- ─────────────────────────────────────────
--  INDEXES  (performance)
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_match_id       ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at     ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_user1           ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2           ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_daily_queue_user_date   ON daily_match_queue(user_id, date);
CREATE INDEX IF NOT EXISTS idx_circle_members_user     ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_city_date        ON events(city, event_date);
CREATE INDEX IF NOT EXISTS idx_users_visibility        ON users(visibility_score DESC) WHERE is_active = true AND is_banned = false;

-- ─────────────────────────────────────────
--  SEED DATA
-- ─────────────────────────────────────────

INSERT INTO prompts (question, category) VALUES
  ('What does a perfect weekend look like for you?',                            'lifestyle'),
  ('What is something you learned about yourself in the last 5 years?',         'personal-growth'),
  ('What kind of relationship are you looking for right now?',                  'relationship'),
  ('What is your favorite way to unwind after a stressful day?',                'lifestyle'),
  ('Describe your ideal travel destination and who you would bring.',           'interests'),
  ('What is a passion project you are working on or dreaming about?',           'ambitions'),
  ('How do you handle conflict in a relationship?',                             'relationship'),
  ('What role does family play in your day-to-day life?',                      'family'),
  ('If you could change one thing about how you spent your 30s, what would it be?', 'reflection')
ON CONFLICT DO NOTHING;

INSERT INTO circles (name, description, category) VALUES
  ('Over 40 Travel',        'Share tips, plan meetups, and explore the world together.',       'travel'),
  ('Single Parents Support','A safe space for single parents to connect and support each other.', 'family'),
  ('Fitness After 40',      'Workouts, nutrition, and motivation for staying active.',          'health'),
  ('Book Club 40+',         'Monthly book discussions and reading recommendations.',            'culture'),
  ('Career Reinvention',    'Navigating career changes and exciting new beginnings.',           'career'),
  ('Mindfulness & Wellness','Meditation, mental health, and self-care practices.',             'wellness'),
  ('Weekend Foodies',       'Restaurant discoveries, home cooking, and food adventures.',      'food')
ON CONFLICT DO NOTHING;
