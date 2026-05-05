'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser, clearUser } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar';

function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>{message}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router  = useRouter();
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw]   = useState(false);
  const [showDanger, setShowDanger]   = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    api.get('/api/auth/me')
      .then((data) => { setUser(data); setLoading(false); })
      .catch(() => router.replace('/login'));
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      setNewPassword('');
      showToast('Password changed successfully ✓');
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setChangingPw(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut().catch(() => {});
    clearUser();
    router.push('/');
  }

  if (loading) return (
    <>
      <Navbar user={user} />
      <div className="main-content"><div className="loading-center"><div className="spinner" /></div></div>
    </>
  );

  return (
    <>
      <Navbar user={user} />
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem', maxWidth: 680 }}>
          <div className="page-title">
            <h1>Settings</h1>
            <p>Manage your account and preferences.</p>
          </div>

          {/* Account info */}
          <div className="settings-section">
            <p className="settings-section-title">Account</p>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Email address</div>
                <div className="settings-row-desc">{user?.email}</div>
              </div>
              <span className="badge badge-primary">Verified</span>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Display name</div>
                <div className="settings-row-desc">{user?.first_name}</div>
              </div>
              <Link href="/profile" className="btn btn-ghost btn-sm">Edit profile</Link>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Member since</div>
                <div className="settings-row-desc">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="settings-section">
            <p className="settings-section-title">Security</p>
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Change password</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">New password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={changingPw}>
                  {changingPw ? 'Changing…' : 'Change password'}
                </button>
              </form>
            </div>
          </div>

          {/* About / stats */}
          <div className="settings-section">
            <p className="settings-section-title">Your stats</p>
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', textAlign: 'center' }}>
                <div className="stat-block">
                  <div className="stat-value">{user?.login_streak ?? 0}</div>
                  <div className="stat-label">Day streak</div>
                </div>
                <div className="stat-block">
                  <div className="stat-value">{user?.response_rate ?? 100}%</div>
                  <div className="stat-label">Response rate</div>
                </div>
                <div className="stat-block">
                  <div className="stat-value">{user?.visibility_score ?? 100}</div>
                  <div className="stat-label">Visibility</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <div className="settings-section">
            <p className="settings-section-title">Session</p>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Sign out</div>
                <div className="settings-row-desc">Sign out of your account on this device.</div>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Sign out</button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="settings-section">
            <p className="settings-section-title">Danger zone</p>
            <div className="card" style={{ border: '1px solid #F5C6C6' }}>
              {!showDanger ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div className="settings-row-label">Delete account</div>
                    <div className="settings-row-desc" style={{ marginTop: '.1rem' }}>
                      Permanently delete your profile and all data. This cannot be undone.
                    </div>
                  </div>
                  <button onClick={() => setShowDanger(true)} className="btn btn-danger btn-sm">
                    Delete account
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--error)', fontWeight: 600, marginBottom: '.75rem' }}>
                    ⚠️ This will permanently delete your account and all data.
                  </p>
                  <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Please contact us at support@secondwind.app to request account deletion.
                    We&apos;ll process your request within 48 hours.
                  </p>
                  <button onClick={() => setShowDanger(false)} className="btn btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
