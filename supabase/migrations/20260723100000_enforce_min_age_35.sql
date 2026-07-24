-- VibeMatch is exclusively for adults 35 and older.
-- Applied to production project rdtbokzvbgeeknlpnpyk on 2026-07-23 (table was empty).
-- Enforces the age gate at the database level so no client or API bug can
-- create an underage account.

alter table public.users
  alter column date_of_birth set not null;

alter table public.users
  add constraint users_min_age_35_check
  check (date_of_birth <= (current_date - interval '35 years'));

comment on constraint users_min_age_35_check on public.users is
  'VibeMatch age gate: members must be 35 or older. Do not remove.';
