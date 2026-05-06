'use client';

/**
 * Frontend Supabase browser client.
 *
 * Initialised with the ANON key — safe to expose publicly.
 * The anon key is subject to Row Level Security policies.
 * Used for:
 *   - Supabase Auth (sign in / sign up / session management)
 *   - Supabase Realtime subscriptions (live chat)
 *   - Supabase Presence (online status)
 *
 * All business-logic API calls still go through Express (lib/api.js).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://placeholder.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Warn in the browser when env vars are missing (catches misconfigured deployments)
if (typeof window !== 'undefined' && SUPABASE_URL === 'https://placeholder.supabase.co') {
  console.error(
    '[Supabase] NEXT_PUBLIC_SUPABASE_URL is not set. ' +
    'Authentication will not work. ' +
    'Add this variable in your Vercel / hosting dashboard.'
  );
}
if (typeof window !== 'undefined' && SUPABASE_ANON === 'placeholder-key') {
  console.error(
    '[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
    'Authentication will not work. ' +
    'Add this variable in your Vercel / hosting dashboard.'
  );
}

// Singleton — safe in the browser because Next.js hot-reload recreates modules
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Persist session in localStorage so page refreshes keep the user logged in
    persistSession: true,
    autoRefreshToken: true,
    // pkce is best for SPAs; for email+password-only apps 'implicit' also works.
    // If you're NOT using magic links / OAuth, both are fine.
    flowType: 'pkce',
    // detectSessionInUrl: true ensures email confirmation links (from Supabase)
    // are handled correctly when the user lands back on the site.
    detectSessionInUrl: true,
    // storageKey: use a unique key so multiple apps on the same domain don't collide
    storageKey: 'sw_supabase_session',
  },
});

/** Return the current user's access token (for Express Authorization header) */
export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Return the cached auth user object (lightweight, no profile data) */
export async function getAuthUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
