'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [ready, setReady]       = useState(false);
  const [expired, setExpired]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    // The reset email link signs the user into a recovery session;
    // the Supabase client picks it up from the URL automatically.
    let timer;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        // Give the client a few seconds to exchange the recovery code from
        // the URL before declaring the link invalid/expired
        timer = setTimeout(() => setExpired(true), 4000);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Could not update password. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.3rem' }}>✦</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>VibeMatch</span>
        </div>
        <h1 style={{ marginBottom: '.3rem' }}>Choose a new password</h1>
        <p className="subtitle">Enter and confirm your new password below.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        {!ready && expired ? (
          <p style={{ color: 'var(--text-muted)' }}>
            This reset link is invalid or has expired —{' '}
            <Link href="/forgot-password">request a new one</Link>.
          </p>
        ) : !ready ? (
          <p style={{ color: 'var(--text-muted)' }}>
            Verifying your reset link…
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                autoFocus
                placeholder="At least 8 characters"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm">Confirm new password</label>
              <input
                id="confirm"
                type="password"
                className="form-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repeat your new password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '.25rem' }} disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
