'use client';

/**
 * Express API client.
 *
 * Tokens now come from the Supabase session (access_token) rather
 * than a manually stored localStorage entry. The Supabase client
 * manages token refresh automatically.
 *
 * getUser() / saveUser() still cache the enriched profile (interests,
 * badges, etc.) returned by GET /api/auth/me, which is separate from
 * the lightweight auth user returned by Supabase Auth.
 */
import { supabase } from './supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Warn in the browser if still pointing at localhost (catches missing env var in production)
if (typeof window !== 'undefined' && API_BASE.includes('localhost')) {
  console.warn(
    '[API] NEXT_PUBLIC_API_URL is not set — using http://localhost:3001. ' +
    'All API calls will fail in production. ' +
    'Add NEXT_PUBLIC_API_URL in your Vercel / hosting dashboard.'
  );
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiFetch(path, options = {}) {
  const token = await getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  get:    (path)       => apiFetch(path),
  post:   (path, body) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body) => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)       => apiFetch(path, { method: 'DELETE' }),
};

// ── Enriched profile cache (localStorage) ─────────────────────
// The Supabase session only contains the auth user (id, email).
// We cache the full profile (interests, badges, etc.) separately.

export function saveUser(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sw_user', JSON.stringify(user));
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  try   { return JSON.parse(localStorage.getItem('sw_user')); }
  catch { return null; }
}

export function clearUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sw_user');
}
