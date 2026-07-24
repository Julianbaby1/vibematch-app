-- =============================================================
--  VibeMatch — Seed Data
--  Run after schema.sql
-- =============================================================

INSERT INTO public.prompts (question, category) VALUES
  ('What does a perfect weekend look like for you?',                             'lifestyle'),
  ('What is something you learned about yourself in the last 5 years?',          'personal-growth'),
  ('What kind of relationship are you looking for right now?',                   'relationship'),
  ('What is your favorite way to unwind after a stressful day?',                 'lifestyle'),
  ('Describe your ideal travel destination and who you would bring.',            'interests'),
  ('What is a passion project you are working on or dreaming about?',            'ambitions'),
  ('How do you handle conflict in a relationship?',                              'relationship'),
  ('What role does family play in your day-to-day life?',                        'family'),
  ('If you could change one thing about how you spent your 30s, what would it be?', 'reflection')
ON CONFLICT DO NOTHING;

INSERT INTO public.circles (name, description, category) VALUES
  ('Over 40 Travel',        'Share tips, plan meetups, and explore the world together.',        'travel'),
  ('Single Parents Support','A safe space for single parents to connect and support each other.','family'),
  ('Fitness After 40',      'Workouts, nutrition, and motivation for staying active.',           'health'),
  ('Book Club 40+',         'Monthly book discussions and reading recommendations.',             'culture'),
  ('Career Reinvention',    'Navigating career changes and exciting new beginnings.',            'career'),
  ('Mindfulness & Wellness','Meditation, mental health, and self-care practices.',              'wellness'),
  ('Weekend Foodies',       'Restaurant discoveries, home cooking, and food adventures.',       'food')
ON CONFLICT DO NOTHING;

-- =============================================================
--  VIBECHECK QUESTIONNAIRE — 25 questions across 5 categories
--  (already applied to the live database on 2026-07-11)
-- =============================================================
INSERT INTO public.compatibility_questions (category, question, options, is_scale, display_order)
SELECT * FROM (VALUES
  ('values', 'Where do you see yourself in five years?', '["Settled down with a family","Building my career","Traveling and exploring","Living simple and easy","Honestly, still figuring it out"]'::jsonb, false, 1),
  ('values', 'How important is religion or spirituality in your life?', '["It guides everything I do","Important, but personal","Open-minded, not practicing","Not part of my life"]'::jsonb, true, 2),
  ('values', 'Do you want kids (or more kids)?', '["Definitely yes","Probably yes","Not sure yet","Probably not","Definitely not"]'::jsonb, true, 3),
  ('values', 'How do you handle money?', '["Saver — every dollar has a job","Balanced — save some, enjoy some","Spender — money is for living","Depends on the season I''m in"]'::jsonb, false, 4),
  ('values', 'How close are you with your family?', '["Extremely — we talk every day","Close — I see them often","It''s complicated","Not close at all"]'::jsonb, true, 5),
  ('values', 'What matters most to you in a relationship?', '["Loyalty","Honesty","Laughter","Ambition","Peace"]'::jsonb, false, 6),
  ('lifestyle', 'What does a typical weeknight look like for you?', '["Gym or staying active","Couch, food, and a show","Out with friends","Working on my side hustle","Quiet time alone"]'::jsonb, false, 7),
  ('lifestyle', 'How often do you drink?', '["Never","Rarely — special occasions","Socially on weekends","Pretty regularly"]'::jsonb, true, 8),
  ('lifestyle', 'How do you feel about smoking or vaping?', '["Never — and it''s a dealbreaker","Don''t, but don''t mind it","Occasionally","Regularly"]'::jsonb, true, 9),
  ('lifestyle', 'Morning person or night owl?', '["Early bird all the way","Mostly mornings","Mostly nights","Full night owl"]'::jsonb, true, 10),
  ('lifestyle', 'How active are you?', '["Work out almost daily","A few times a week","Active when I can be","Not my thing"]'::jsonb, true, 11),
  ('lifestyle', 'How do you feel about pets?', '["Have pets and love them","Want pets someday","Like them at a distance","No pets, please"]'::jsonb, true, 12),
  ('communication', 'How do you handle disagreements?', '["Talk it out right away","Need time to cool off first","Write my thoughts out","Avoid it until it passes"]'::jsonb, false, 13),
  ('communication', 'What''s your texting style?', '["All-day texter","A few check-ins a day","I''d rather call","Short and to the point"]'::jsonb, false, 14),
  ('communication', 'How do you show love?', '["Quality time","Words — I say it","Acts — I show up and do things","Physical affection","Gifts"]'::jsonb, false, 15),
  ('communication', 'When you''re stressed, you want your partner to...', '["Give me space","Talk me through it","Distract me with something fun","Just be there, quietly"]'::jsonb, false, 16),
  ('communication', 'How open are you about your feelings?', '["Open book","Open once I trust you","Takes me a while","I keep most things inside"]'::jsonb, true, 17),
  ('social', 'Your ideal weekend?', '["Big group plans","Small circle hangout","One-on-one time","Solo recharge"]'::jsonb, true, 18),
  ('social', 'At a party, you''re...', '["The center of it","Floating and mingling","Posted up with my people","Counting minutes till I leave"]'::jsonb, true, 19),
  ('social', 'How social do you want a partner to be?', '["Match my energy everywhere we go","Social, but independent","Homebody like me","Opposite of me — balance me out"]'::jsonb, false, 20),
  ('social', 'How much do your friends'' opinions of who you date matter?', '["A lot — they know me best","I''ll hear them out","They don''t sway me"]'::jsonb, true, 21),
  ('fun', 'Perfect date?', '["Nice dinner out","Something active or outdoors","Chill night in","Live music or an event","Something spontaneous"]'::jsonb, false, 22),
  ('fun', 'Travel style?', '["Plan every detail","Loose plan, open mind","Full wing-it mode","I''d rather stay home"]'::jsonb, true, 23),
  ('fun', 'What''s playing in your car?', '["R&B and soul","Hip-hop","Rock or alternative","Country","A little bit of everything"]'::jsonb, false, 24),
  ('fun', 'Trying new food?', '["I''ll try anything once","Adventurous within reason","I know what I like","Picky and proud"]'::jsonb, true, 25)
) AS v(category, question, options, is_scale, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.compatibility_questions);
