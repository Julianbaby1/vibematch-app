/**
 * Owner / admin configuration.
 *
 * The app owner's email is granted the admin role automatically at
 * registration (and promoted at login if the account already exists).
 *
 * Set a comma-separated ADMIN_EMAILS environment variable in the
 * hosting dashboard. No owner email is stored in this public repo.
 *
 * No passwords live here — admin accounts authenticate through the
 * normal Supabase Auth signup / login / password-reset flow.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

module.exports = { ADMIN_EMAILS, isAdminEmail };
