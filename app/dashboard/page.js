'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser, clearToken } from '../../lib/api';
import Navbar from '../../components/Navbar';
import MatchCard from '../../components/MatchCard';
import Badge from '../../components/Badge';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [daily, setDaily] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setUser(cached);
    loadData();
  }, []);

  async function loadData() {
    try {
      const [me, dailyData, matchData] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/matches/daily'),
        api.get('/api/matches'),
      ]);
      setUser(me);
      setDaily(dailyData.filter((d) => d.action === 'pending'));
      setMatches(matchData.slice(0, 5));
    } catch {
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(targetId, action) {
    setActionLoading(targetId);
    try {
      const result = await api.post('/api/matches/action', { target_id: targetId, action });
      setDaily((prev) => prev.filter((d) => d.id !== targetId));
      if (result.matched) {
        await loadData();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading('');
    }
  }

  if (loading) return (
    <>
      <Navbar user={user} />
      <div className="main-content"><div className="loading-center"><div className="spinner" /></div></div>
    </>
  );

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

          {/* ── Welcome header ── */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1>Good {greeting()}, {user?.first_name} 👋</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '.25rem' }}>{today}</p>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {user?.badges?.map((b) => <Badge key={b.badge_type} type={b.badge_type} />)}
            </div>
          </div>

          <div className="dashboard-grid">
            {/* ── Left: Daily matches ── */}
            <div>
              <div className="section-header">
                <h2>Today's profiles</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>
                  {daily.length} remaining · refreshes daily
                </span>
              </div>

              {daily.length === 0 ? (
                <div className="card empty-state">
                  <p style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🌿</p>
                  <h3>You're all caught up for today</h3>
                  <p>Your daily profiles will refresh tomorrow. In the meantime, check your matches or explore Interest Circles.</p>
                  <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <Link href="/matches" className="btn btn-outline btn-sm">View matches</Link>
                    <Link href="/circles" className="btn btn-ghost btn-sm">Explore circles</Link>
                  </div>
                </div>
              ) : (
                <div className="daily-matches-grid">
                  {daily.map((profile) => (
                    <MatchCard
                      key={profile.id}
                      profile={profile}
                      onConnect={() => handleAction(profile.id, 'connect')}
                      onPass={() => handleAction(profile.id, 'pass')}
                      loading={actionLoading === profile.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Sidebar ── */}
            <aside>
              {/* Stats card */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ marginBottom: '1.25rem' }}>Your stats</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="stat-block">
                    <div className="stat-value">{user?.login_streak || 0}</div>
                    <div className="stat-label">Day streak 🔥</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value">{user?.response_rate || 100}%</div>
                    <div className="stat-label">Response rate</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value">{user?.visibility_score || 100}</div>
                    <div className="stat-label">Visibility</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value">{matches.length}</div>
                    <div className="stat-label">Connections</div>
                  </div>
                </div>
              </div>

              {/* Recent matches */}
              {matches.length > 0 && (
                <div className="card" style={{ marginBottom: '1.25rem' }}>
                  <div className="section-header">
                    <h3>Recent matches</h3>
                    <Link href="/matches" style={{ fontSize: '.85rem' }}>View all</Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {matches.map((m) => (
                      <Link key={m.match_id} href={`/chat?id=${m.match_id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem', borderRadius: 'var(--radius)', textDecoration: 'none', color: 'inherit' }}
                        className="chat-match-item">
                        <div className="avatar avatar-sm" style={{ background: 'var(--surface-2)' }}>
                          {m.profile_photo_url
                            ? <img src={m.profile_photo_url} alt={m.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : m.first_name?.[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="chat-match-name">{m.first_name}</div>
                          <div className="chat-match-preview">{m.last_message || 'Say hello!'}</div>
                        </div>
                        {m.unread_count > 0 && <span className="unread-dot" />}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Explore</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {[
                    { href: '/circles', label: '🏘️  Interest Circles' },
                    { href: '/events',  label: '📅  Local Events' },
                    { href: '/profile', label: '✏️  Edit Profile' },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
