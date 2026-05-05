'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser, saveUser } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Badge from '../../components/Badge';

const LIFE_STAGES = ['single', 'divorced', 'widowed', 'separated', 'other'];

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

export default function ProfilePage() {
  const router      = useRouter();
  const fileInput   = useRef(null);
  const [user, setUser]           = useState(null);
  const [form, setForm]           = useState(null);
  const [interests, setInterests] = useState('');
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast]         = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setUser(cached);

    api.get('/api/auth/me').then((data) => {
      setUser(data);
      saveUser(data);
      setForm({
        first_name: data.first_name || '',
        life_stage: data.life_stage || '',
        bio:        data.bio        || '',
        location:   data.location   || '',
        city:       data.city       || '',
      });
      setInterests((data.interests || []).join(', '));
    }).catch(() => router.replace('/login'));
  }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/users/profile', {
        ...form,
        interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
      });
      const updated = await api.get('/api/auth/me');
      setUser(updated);
      saveUser(updated);
      showToast('Profile updated successfully ✓');
    } catch (err) {
      showToast(err.message || 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo must be under 5 MB', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/upload/photo`, {
        method: 'POST',
        body: fd,
        headers: {
          // No Content-Type — browser sets it with boundary for multipart
          ...(await (async () => {
            const { supabase } = await import('../../lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
          })()),
        },
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || 'Upload failed');
      const updated = await api.get('/api/auth/me');
      setUser(updated);
      saveUser(updated);
      showToast('Photo updated ✓');
    } catch (err) {
      showToast(err.message || 'Photo upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  const age = user?.date_of_birth
    ? Math.floor((Date.now() - new Date(user.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  if (!form) return (
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
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem', maxWidth: 760 }}>
          <div className="page-title">
            <h1>Edit Profile</h1>
            <p>Keep your profile up to date to attract the right connections.</p>
          </div>

          {/* ── Profile preview header ── */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="profile-header">
              {/* Photo + upload */}
              <div className="profile-photo-wrap" style={{ flexShrink: 0 }}>
                <div
                  className="avatar avatar-xl"
                  style={{
                    background: user?.profile_photo_url
                      ? 'var(--surface-2)'
                      : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-lt) 100%)',
                  }}>
                  {user?.profile_photo_url
                    ? <img src={user.profile_photo_url} alt={user.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <span>{user?.first_name?.[0]}</span>}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
                <button
                  className="profile-photo-upload-btn"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  title="Change photo">
                  {uploading ? '…' : '📷'}
                </button>
              </div>

              <div style={{ flex: 1 }}>
                <h2 style={{ marginBottom: '.2rem' }}>
                  {user?.first_name}{age ? `, ${age}` : ''}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', marginBottom: '.65rem' }}>
                  {[user?.city, user?.life_stage].filter(Boolean).join(' · ') || 'Location not set'}
                </p>
                {(user?.badges || []).length > 0 && (
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.85rem' }}>
                    {user.badges.map((b) => <Badge key={b.badge_type} type={b.badge_type} />)}
                  </div>
                )}
                <div className="profile-stats">
                  <div className="stat-block">
                    <div className="stat-value">{user?.visibility_score ?? '—'}</div>
                    <div className="stat-label">Visibility</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value">{user?.response_rate ?? '—'}%</div>
                    <div className="stat-label">Response rate</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value">{user?.login_streak ?? 0}</div>
                    <div className="stat-label">Day streak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Edit form ── */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <form onSubmit={handleSave}>
              <h3 style={{ marginBottom: '1.25rem' }}>Basic information</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">First name</label>
                  <input className="form-input" value={form.first_name} onChange={set('first_name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" placeholder="e.g. Austin, TX" value={form.city} onChange={set('city')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Life stage</label>
                <select className="form-select" value={form.life_stage} onChange={set('life_stage')}>
                  <option value="">Select…</option>
                  {LIFE_STAGES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={form.bio}
                  onChange={set('bio')}
                  placeholder="Share a bit about who you are and what you're looking for…"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Interests</label>
                <input
                  className="form-input"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Hiking, cooking, jazz, travel, yoga…"
                />
                <span className="form-hint">Comma-separated · up to 10</span>
              </div>
              <hr className="divider" />
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* ── Visibility info ── */}
          <div className="card-flat" style={{ borderRadius: 'var(--radius-lg)' }}>
            <h4 style={{ marginBottom: '.5rem' }}>How visibility works</h4>
            <p style={{ fontSize: '.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
              Your visibility score (0–100) determines how often you appear in others&apos; daily profiles.
              Consistent communication raises your score; ghosting a match for over 72 hours reduces it by 5 points.
              Users with a response rate above 90% receive a weekly boost.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
