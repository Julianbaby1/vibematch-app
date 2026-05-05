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

// Singleton — safe in the browser because Next.js hot-reload recreates modules
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Persist session in localStorage so page refreshes keep the user logged in
    persistSession: true,
    autoRefreshToken: true,
    // Use PKCE flow for extra security
    flowType: 'pkce',
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
