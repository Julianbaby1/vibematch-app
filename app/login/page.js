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
      // 1. Sign in via Supabase Auth — gets us the session token
      const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (authError) {
        throw new Error(
          authError.message === 'Invalid login credentials'
            ? 'Invalid email or password. Please try again.'
            : authError.message
        );
      }

      if (!sessionData?.session) {
        throw new Error('Sign in failed — please try again.');
      }

      // 2. Fetch full enriched profile from Express (also updates login streak & badges)
      const user = await api.get('/api/auth/me');
      saveUser(user);

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
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '.25rem' }} disabled={loading}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center' }}><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</span>
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
