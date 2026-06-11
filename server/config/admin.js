/**
 * Owner / admin configuration.
 *
 * The app owner's email is granted the admin role automatically at
 * registration (and promoted at login if the account already exists).
 *
 * Override with a comma-separated ADMIN_EMAILS env var if needed.
 * No passwords live here — admin accounts authenticate through the
 * normal Supabase Auth signup / login / password-reset flow.
 */
const DEFAULT_ADMIN_EMAILS = ['julian_wheeler@icloud.com'];

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(','))
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

module.exports = { ADMIN_EMAILS, isAdminEmail };
