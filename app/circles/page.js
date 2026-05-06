'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '../../lib/api';
import Navbar from '../../components/Navbar';
import CircleCard from '../../components/CircleCard';

export default function CirclesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setUser(cached);
    loadCircles();
  }, []);

  async function loadCircles() {
    try {
      const data = await api.get('/api/circles');
      setCircles(data);
    } catch {
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(circleId, isMember) {
    try {
      await api.post(`/api/circles/${circleId}/${isMember ? 'leave' : 'join'}`, {});
      setCircles((prev) => prev.map((c) =>
        c.id === circleId
          ? { ...c, is_member: !isMember, member_count: c.member_count + (isMember ? -1 : 1) }
          : c
      ));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.post('/api/circles', form);
      setShowCreate(false);
      setForm({ name: '', description: '', category: '' });
      loadCircles();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const myCircles = circles.filter((c) => c.is_member);
  const discover  = circles.filter((c) => !c.is_member);

  if (loading) return (
    <>
      <Navbar user={user} />
      <div className="main-content"><div className="loading-center"><div className="spinner" /></div></div>
    </>
  );

  return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="page-title" style={{ margin: 0 }}>
              <h1>Interest Circles</h1>
              <p>Join communities where conversation happens naturally.</p>
            </div>
            <button className="btn btn-accent" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? '✕ Cancel' : '+ Create circle'}
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.25rem' }}>Start a new circle</h3>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleCreate}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Circle name *</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                      <option value="">Select…</option>
                      {['travel', 'family', 'health', 'culture', 'career', 'wellness', 'food', 'other'].map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={2} value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="What is this circle about?" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create circle'}
                </button>
              </form>
            </div>
          )}

          {/* My circles */}
          {myCircles.length > 0 && (
            <>
              <div className="section-header">
                <h2>My circles</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>{myCircles.length} joined</span>
              </div>
              <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
                {myCircles.map((c) => (
                  <CircleCard key={c.id} circle={c} onJoin={handleJoin} />
                ))}
              </div>
            </>
          )}

          {/* Discover */}
          <div className="section-header">
            <h2>Discover circles</h2>
          </div>
          {discover.length === 0 ? (
            <div className="card empty-state">
              <p>You've joined all available circles. Check back for new ones!</p>
            </div>
          ) : (
            <div className="grid-3">
              {discover.map((c) => (
                <CircleCard key={c.id} circle={c} onJoin={handleJoin} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
