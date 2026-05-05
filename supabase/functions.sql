-- =============================================================
--  Second Wind — PostgreSQL Functions
--  Called from Express backend via supabase.rpc()
--  All functions use SECURITY DEFINER so they run as the
--  schema owner and bypass RLS (safe because they are called
--  only from the trusted backend with validated inputs).
-- =============================================================

-- ─── Compatibility score ──────────────────────────────────────
-- Returns 0-100 score based on shared interests + prompt overlap
CREATE OR REPLACE FUNCTION public.compute_compatibility(
  p_user_id   UUID,
  p_target_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interest_count INTEGER;
  v_prompt_count   INTEGER;
  v_score          INTEGER;
BEGIN
  -- Count shared interests (case-insensitive)
  SELECT COUNT(*) INTO v_interest_count
  FROM public.user_interests ui1
  JOIN public.user_interests ui2
    ON LOWER(ui1.interest) = LOWER(ui2.interest)
  WHERE ui1.user_id = p_user_id
    AND ui2.user_id = p_target_id;

  -- Count prompts both users answered
  SELECT COUNT(*) INTO v_prompt_count
  FROM public.user_prompt_responses upr1
  JOIN public.user_prompt_responses upr2
    ON upr1.prompt_id = upr2.prompt_id
  WHERE upr1.user_id = p_user_id
    AND upr2.user_id = p_target_id;

  v_score := LEAST(100, (v_interest_count * 15) + (v_prompt_count * 10));
  RETURN v_score;
END;
$$;

-- ─── Get or build today's daily match queue ───────────────────
-- Returns up to 5 enriched candidate profiles.
-- Idempotent: if the queue already exists for today it returns it.
CREATE OR REPLACE FUNCTION public.get_or_build_daily_queue(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today      DATE := CURRENT_DATE;
  v_existing   JSONB;
  v_candidates UUID[];
  v_cand_id    UUID;
  v_score      INTEGER;
  v_picks      TABLE(id UUID, score INTEGER);
BEGIN
  -- Return existing queue for today if already built
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',               u.id,
      'first_name',       u.first_name,
      'date_of_birth',    u.date_of_birth,
      'life_stage',       u.life_stage,
      'bio',              u.bio,
      'city',             u.city,
      'profile_photo_url',u.profile_photo_url,
      'visibility_score', u.visibility_score,
      'response_rate',    u.response_rate,
      'action',           dmq.action
    )
  )
  INTO v_existing
  FROM public.daily_match_queue dmq
  JOIN public.users u ON u.id = dmq.suggested_user_id
  WHERE dmq.user_id = p_user_id AND dmq.date = v_today;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Build candidates: active, unbanned, not already matched,
  -- not seen in last 7 days, sorted by visibility DESC then random
  SELECT ARRAY(
    SELECT u.id FROM public.users u
    WHERE u.id <> p_user_id
      AND u.is_active = true
      AND u.is_banned = false
      AND u.id NOT IN (
        SELECT CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END
        FROM public.matches m
        WHERE m.user1_id = p_user_id OR m.user2_id = p_user_id
      )
      AND u.id NOT IN (
        SELECT dmq.suggested_user_id
        FROM public.daily_match_queue dmq
        WHERE dmq.user_id = p_user_id
          AND dmq.date >= v_today - INTERVAL '7 days'
      )
    ORDER BY u.visibility_score DESC, RANDOM()
    LIMIT 20
  ) INTO v_candidates;

  -- Score top candidates and insert the best 5 into the queue
  FOR v_cand_id IN SELECT UNNEST(v_candidates[1:5])
  LOOP
    v_score := public.compute_compatibility(p_user_id, v_cand_id);
    INSERT INTO public.daily_match_queue (user_id, suggested_user_id, date)
    VALUES (p_user_id, v_cand_id, v_today)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Return the newly built queue (enriched)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',               u.id,
      'first_name',       u.first_name,
      'date_of_birth',    u.date_of_birth,
      'life_stage',       u.life_stage,
      'bio',              u.bio,
      'city',             u.city,
      'profile_photo_url',u.profile_photo_url,
      'visibility_score', u.visibility_score,
      'response_rate',    u.response_rate,
      'action',           dmq.action,
      'compatibility_score', public.compute_compatibility(p_user_id, u.id)
    )
  )
  INTO v_existing
  FROM public.daily_match_queue dmq
  JOIN public.users u ON u.id = dmq.suggested_user_id
  WHERE dmq.user_id = p_user_id AND dmq.date = v_today;

  RETURN COALESCE(v_existing, '[]'::JSONB);
END;
$$;

-- ─── Process Connect / Pass action ────────────────────────────
-- Returns {matched: bool, match_id: uuid | null}
CREATE OR REPLACE FUNCTION public.process_match_action(
  p_user_id   UUID,
  p_target_id UUID,
  p_action    TEXT  -- 'connect' | 'pass'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today    DATE := CURRENT_DATE;
  v_match_id UUID;
  v_u1       UUID;
  v_u2       UUID;
  v_score    INTEGER;
BEGIN
  -- Record the action in the queue
  UPDATE public.daily_match_queue
  SET action = p_action
  WHERE user_id = p_user_id
    AND suggested_user_id = p_target_id
    AND date = v_today;

  IF p_action <> 'connect' THEN
    RETURN jsonb_build_object('matched', false);
  END IF;

  -- Check if the target already connected with this user
  IF NOT EXISTS (
    SELECT 1 FROM public.daily_match_queue
    WHERE user_id = p_target_id
      AND suggested_user_id = p_user_id
      AND action = 'connect'
  ) THEN
    RETURN jsonb_build_object('matched', false, 'message', 'Connection request sent');
  END IF;

  -- Mutual — create the match (normalise user order)
  SELECT LEAST(p_user_id, p_target_id),
         GREATEST(p_user_id, p_target_id)
  INTO v_u1, v_u2;

  v_score := public.compute_compatibility(p_user_id, p_target_id);

  INSERT INTO public.matches (user1_id, user2_id, compatibility_score)
  VALUES (v_u1, v_u2, v_score)
  ON CONFLICT (user1_id, user2_id)
  DO UPDATE SET compatibility_score = EXCLUDED.compatibility_score
  RETURNING id INTO v_match_id;

  -- Seed ghost-tracking rows for both participants
  INSERT INTO public.response_tracking (match_id, user_id, last_responded_at)
  VALUES (v_match_id, p_user_id, NOW()),
         (v_match_id, p_target_id, NOW())
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('matched', true, 'match_id', v_match_id);
END;
$$;

-- ─── Ghosting penalty job ─────────────────────────────────────
-- Called periodically (e.g. daily cron hitting /api/chat/jobs/check-ghosting).
-- Penalises users silent for >72 h; boosts consistent responders.
-- Returns count of penalised users.
CREATE OR REPLACE FUNCTION public.run_ghosting_check()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_threshold  TIMESTAMPTZ := NOW() - INTERVAL '72 hours';
  v_penalised  INTEGER;
BEGIN
  -- Apply −5 visibility to ghosts
  WITH ghosts AS (
    SELECT rt.user_id
    FROM public.response_tracking rt
    WHERE rt.last_responded_at < v_threshold
      AND rt.penalty_applied = false
  )
  UPDATE public.users
  SET visibility_score = GREATEST(0, visibility_score - 5)
  WHERE id IN (SELECT user_id FROM ghosts);

  GET DIAGNOSTICS v_penalised = ROW_COUNT;

  -- Mark penalty as applied
  UPDATE public.response_tracking
  SET penalty_applied = true
  WHERE last_responded_at < v_threshold
    AND penalty_applied = false;

  -- +2 boost for high-responders (response_rate > 90)
  UPDATE public.users
  SET visibility_score = LEAST(100, visibility_score + 2)
  WHERE response_rate > 90 AND visibility_score < 100;

  RETURN v_penalised;
END;
$$;

-- ─── Get matches list with last message + unread count ────────
CREATE OR REPLACE FUNCTION public.get_matches_for_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'match_id',           m.id,
      'compatibility_score',m.compatibility_score,
      'last_message_at',    m.last_message_at,
      'created_at',         m.created_at,
      'id',                 u.id,
      'first_name',         u.first_name,
      'profile_photo_url',  u.profile_photo_url,
      'city',               u.city,
      'response_rate',      u.response_rate,
      'last_message', (
        SELECT content FROM public.messages
        WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1
      ),
      'unread_count', (
        SELECT COUNT(*)::INT FROM public.messages
        WHERE match_id = m.id
          AND sender_id <> p_user_id
          AND is_read = false
      )
    )
    ORDER BY COALESCE(m.last_message_at, m.created_at) DESC
  )
  INTO v_result
  FROM public.matches m
  JOIN public.users u
    ON u.id = CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END
  WHERE (m.user1_id = p_user_id OR m.user2_id = p_user_id)
    AND u.is_banned = false;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ─── Get full user profile with interests, prompts, badges ────
CREATE OR REPLACE FUNCTION public.get_full_user_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id',               u.id,
    'email',            u.email,
    'first_name',       u.first_name,
    'date_of_birth',    u.date_of_birth,
    'life_stage',       u.life_stage,
    'bio',              u.bio,
    'location',         u.location,
    'city',             u.city,
    'profile_photo_url',u.profile_photo_url,
    'voice_intro_url',  u.voice_intro_url,
    'visibility_score', u.visibility_score,
    'response_rate',    u.response_rate,
    'login_streak',     u.login_streak,
    'is_admin',         u.is_admin,
    'created_at',       u.created_at,
    'interests', (
      SELECT COALESCE(jsonb_agg(ui.interest), '[]'::JSONB)
      FROM public.user_interests ui WHERE ui.user_id = u.id
    ),
    'prompt_responses', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'question', p.question,
        'response', upr.response
      )), '[]'::JSONB)
      FROM public.user_prompt_responses upr
      JOIN public.prompts p ON p.id = upr.prompt_id
      WHERE upr.user_id = u.id
    ),
    'badges', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'badge_type', ub.badge_type,
        'earned_at',  ub.earned_at
      )), '[]'::JSONB)
      FROM public.user_badges ub WHERE ub.user_id = u.id
    )
  )
  INTO v_result
  FROM public.users u
  WHERE u.id = p_user_id;

  RETURN v_result;
END;
$$;
