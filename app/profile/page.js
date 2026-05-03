'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser, saveUser } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Badge from '../../components/Badge';

const LIFE_STAGES = ['single', 'divorced', 'widowed', 'separated', 'other'];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [interests, setInterests] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setUser(cached);

    api.get('/api/auth/me').then((data) => {
      setUser(data);
      saveUser(data);
      setForm({
        first_name: data.first_name || '',
        life_stage:  data.life_stage || '',
        bio:         data.bio || '',
        location:    data.location || '',
        city:        data.city || '',
      });
      setInterests((data.interests || []).join(', '));
    }).catch(() => router.replace('/login'));
  }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/api/users/profile', {
        ...form,
        interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
      });
      setSuccess('Profile updated successfully.');
      const updated = await api.get('/api/auth/me');
      setUser(updated);
      saveUser(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) return (
    <>
      <Navbar user={user} />
      <div className="main-content"><div className="loading-center"><div className="spinner" /></div></div>
    </>
  );

  const age = user?.date_of_birth
    ? Math.floor((Date.now() - new Date(user.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem', maxWidth: 760 }}>
          <div className="page-title">
            <h1>Edit Profile</h1>
            <p>Keep your profile up to date to attract the right connections.</p>
          </div>

          {/* ── Profile header preview ── */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="profile-header">
              <div className="avatar avatar-xl" style={{ background: 'var(--surface-2)', fontSize: '2.5rem', flexShrink: 0 }}>
                {user?.profile_photo_url
                  ? <img src={user.profile_photo_url} alt={user.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <span>{user?.first_name?.[0]}</span>}
              </div>
              <div>
                <h2>{user?.first_name}{age ? `, ${age}` : ''}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '.5rem' }}>
                  {user?.city || 'Location not set'} · {user?.life_stage || 'Life stage not set'}
                </p>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {(user?.badges || []).map((b) => <Badge key={b.badge_type} type={b.badge_type} />)}
                </div>
                <div className="profile-stats">
                  <div className="stat-block">
                    <div className="stat-value">{user?.visibility_score}</div>
                    <div className="stat-label">Visibility</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value">{user?.response_rate}%</div>
                    <div className="stat-label">Response rate</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value">{user?.login_streak}</div>
                    <div className="stat-label">Day streak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Edit form ── */}
          <div className="card">
            {error   && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSave}>
              <h3 style={{ marginBottom: '1.25rem' }}>Basic info</h3>
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
                <textarea className="form-textarea" rows={4} value={form.bio} onChange={set('bio')}
                  placeholder="Share a bit about who you are and what you're looking for…" />
              </div>
              <div className="form-group">
                <label className="form-label">Interests</label>
                <input className="form-input" value={interests} onChange={(e) => setInterests(e.target.value)}
                  placeholder="Hiking, cooking, jazz, travel…" />
                <span className="form-hint">Comma-separated · up to 10</span>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="Full location (optional)" value={form.location} onChange={set('location')} />
              </div>

              <hr className="divider" />
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* ── Visibility info ── */}
          <div className="card" style={{ marginTop: '1.25rem', background: 'var(--surface-2)', boxShadow: 'none' }}>
            <h4 style={{ marginBottom: '.5rem' }}>How visibility works</h4>
            <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Your visibility score (0–100) determines how often you appear in others' daily profiles.
              Consistent communication raises your score. Ghosting a match for over 72 hours reduces it by 5 points.
              Users with a response rate above 90% receive a small boost each week.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
