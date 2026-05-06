'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '../../lib/api';
import Navbar from '../../components/Navbar';
import EventCard from '../../components/EventCard';

const CATEGORIES = ['travel', 'food', 'wellness', 'culture', 'outdoor', 'social', 'other'];

export default function EventsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', location: '', city: '',
    event_date: '', max_attendees: '', category: '', is_online: false,
  });

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setUser(cached);
    loadEvents();
  }, []);

  async function loadEvents(city, cat) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (cat)  params.set('category', cat);
      const data = await api.get(`/api/events?${params}`);
      setEvents(data);
    } catch {
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  function applyFilter() {
    loadEvents(cityFilter, catFilter);
  }

  async function handleRsvp(eventId, status) {
    try {
      await api.post(`/api/events/${eventId}/rsvp`, { status });
      setEvents((prev) => prev.map((e) =>
        e.id === eventId
          ? { ...e, has_rsvped: true, rsvp_status: status, rsvp_count: e.rsvp_count + (e.has_rsvped ? 0 : (status === 'going' ? 1 : 0)) }
          : e
      ));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post('/api/events', form);
      setShowCreate(false);
      setForm({ title: '', description: '', location: '', city: '', event_date: '', max_attendees: '', category: '', is_online: false });
      loadEvents(cityFilter, catFilter);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="page-title" style={{ margin: 0 }}>
              <h1>Local Events</h1>
              <p>Meet people in real life at events designed for adults 39+.</p>
            </div>
            <button className="btn btn-accent" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? '✕ Cancel' : '+ Create event'}
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.25rem' }}>Create a new event</h3>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleCreate}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Event title *</label>
                    <input className="form-input" value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date & time *</label>
                    <input type="datetime-local" className="form-input" value={form.event_date}
                      onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" placeholder="e.g. Austin, TX" value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                      <option value="">Select…</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location / venue</label>
                    <input className="form-input" value={form.location}
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max attendees</label>
                    <input type="number" className="form-input" min={2} value={form.max_attendees}
                      onChange={(e) => setForm((p) => ({ ...p, max_attendees: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={2} value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Tell people what to expect…" />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '.75rem' }}>
                  <input type="checkbox" id="is_online" checked={form.is_online}
                    onChange={(e) => setForm((p) => ({ ...p, is_online: e.target.checked }))} />
                  <label htmlFor="is_online" className="form-label" style={{ margin: 0 }}>Online event</label>
                </div>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create event'}
                </button>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
                <label className="form-label">City</label>
                <input className="form-input" placeholder="Filter by city" value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
                <label className="form-label">Category</label>
                <select className="form-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={applyFilter} style={{ marginBottom: '.05rem' }}>
                Filter
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : events.length === 0 ? (
            <div className="card empty-state">
              <p style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📅</p>
              <h3>No upcoming events found</h3>
              <p>Try adjusting your filters, or be the first to create one!</p>
            </div>
          ) : (
            <div className="grid-2">
              {events.map((evt) => (
                <EventCard key={evt.id} event={evt} currentUserId={user?.id} onRsvp={handleRsvp} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
