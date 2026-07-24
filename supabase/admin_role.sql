-- =============================================================
--  VibeMatch — Admin role assignment
--  Run this in the Supabase SQL editor (Project → SQL Editor)
--  after schema.sql.
--
--  Admin emails are configured privately through the ADMIN_EMAILS
--  hosting environment variable. No personal email or password is
--  stored in this public repository.
--
--  The Express server assigns the role at signup/login using that
--  private environment variable. This SQL keeps the trigger inert
--  so public source never exposes the owner's email address.
-- =============================================================

-- ─── Owner email check ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_owner_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
  SELECT false;
$$;

-- ─── Auto-assign the admin role on signup ─────────────────────
-- The trigger remains safe and inert in the public schema. Admin
-- assignment is handled by the Express app through ADMIN_EMAILS.
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
