/**
 * Backend Supabase admin client.
 *
 * Initialised with the SERVICE_ROLE_KEY which grants full database access
 * and bypasses Row Level Security. Only ever use this on the server.
 *
 * Never expose SERVICE_ROLE_KEY to the browser.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  const missing = [
    !SUPABASE_URL     && 'SUPABASE_URL',
    !SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean).join(', ');
  throw new Error(
    `Missing server environment variable(s): ${missing}\n` +
    'Set these in Railway / your hosting dashboard, NOT in .env (production).'
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    // Never persist session on server — each request is stateless
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = supabase;
