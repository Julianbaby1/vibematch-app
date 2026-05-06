-- =============================================================
--  Second Wind — Seed Data
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
