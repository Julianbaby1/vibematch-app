-- =============================================================
--  Second Wind — Admin role assignment
--  Run this in the Supabase SQL editor (Project → SQL Editor)
--  after schema.sql.
--
--  The app owner's email is granted the admin role automatically.
--  No passwords are stored here — the owner signs up through the
--  normal Supabase Auth flow (signup / login / password reset).
--  Keep the email list in sync with ADMIN_EMAILS on the Express
--  server (server/config/admin.js).
-- =============================================================

-- ─── Owner email check ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_owner_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
  SELECT lower(p_email) IN ('julian_wheeler@icloud.com');
$$;

-- ─── Promote any existing account with the owner email ────────
UPDATE public.users SET is_admin = true WHERE public.is_owner_email(email);

-- ─── Auto-assign the admin role on signup ─────────────────────
-- Belt-and-braces: the Express register route also sets is_admin,
-- but this trigger guarantees it regardless of how the profile
-- row is created.
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_owner_email(NEW.email) THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_admin_role ON public.users;
CREATE TRIGGER trg_assign_admin_role
  BEFORE INSERT OR UPDATE OF email ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();
