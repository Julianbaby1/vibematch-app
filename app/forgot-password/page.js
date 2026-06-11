'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (resetError) throw new Error(resetError.message);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: '.88rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem', marginBottom: '1.75rem' }}>
          ← Back to sign in
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.3rem' }}>✦</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Second Wind</span>
        </div>
        <h1 style={{ marginBottom: '.3rem' }}>Reset your password</h1>
        <p className="subtitle">Enter your email and we&apos;ll send you a reset link.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        {sent ? (
          <div className="alert alert-success" role="status">
            <span>✅</span> If an account exists for {email}, a password reset link is on its way. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '.25rem' }} disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
