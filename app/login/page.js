'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { api, saveUser } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1 — Supabase Auth (email + password)
      const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (authError) {
        console.error('[login] Supabase auth error:', authError.message, authError.status);
        if (authError.message === 'Invalid login credentials') {
          throw new Error('Incorrect email or password. Please try again.');
        }
        if (authError.message === 'Email not confirmed') {
          throw new Error('Please confirm your email address first. Check your inbox for a verification link.');
        }
        throw new Error(authError.message || 'Sign in failed. Please try again.');
      }

      if (!sessionData?.session) {
        console.error('[login] Supabase returned no session:', sessionData);
        throw new Error('Sign in failed — no session returned. Please try again.');
      }

      console.log('[login] Supabase auth succeeded, fetching profile...');

      // Step 2 — Fetch enriched profile from Express (also updates login streak & badges)
      let user;
      try {
        user = await api.get('/api/auth/me');
      } catch (apiErr) {
        console.error('[login] /api/auth/me failed:', apiErr.message);
        // If the API call fails but Supabase auth worked, give a specific error
        if (apiErr.message?.includes('fetch') || apiErr.message?.includes('network') || apiErr.message?.includes('CORS')) {
          throw new Error(
            'Could not reach the API server. Make sure NEXT_PUBLIC_API_URL is set correctly in your hosting dashboard.'
          );
        }
        if (apiErr.message?.includes('User not found') || apiErr.message?.includes('database schema')) {
          throw new Error(
            'Your account was found but the user profile is missing. ' +
            'Please ensure the database schema (supabase/schema.sql and supabase/functions.sql) has been applied in Supabase.'
          );
        }
        throw new Error(apiErr.message || 'Could not load your profile. Please try again.');
      }

      saveUser(user);
      console.log('[login] Login complete, redirecting to dashboard...');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '.88rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem', marginBottom: '1.75rem' }}>
          ← Back to home
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.3rem' }}>✦</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Second Wind</span>
        </div>
        <h1 style={{ marginBottom: '.3rem' }}>Welcome back</h1>
        <p className="subtitle">Sign in to continue your journey.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="current-password"
              placeholder="Your password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: '.25rem' }}
            disabled={loading}
          >
            {loading
              ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center' }}>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Signing in…
                </span>
              )
              : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          New to Second Wind? <Link href="/register">Create your profile</Link>
        </p>
      </div>
    </div>
  );
}
