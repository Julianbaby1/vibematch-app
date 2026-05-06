'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser, saveUser } from '../../lib/api';
import Navbar from '../../components/Navbar';
import MatchCard from '../../components/MatchCard';
import Badge from '../../components/Badge';

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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]               = useState(null);
  const [daily, setDaily]             = useState([]);
  const [matches, setMatches]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast]             = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadData = useCallback(async () => {
    try {
      const [me, dailyData, matchData] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/matches/daily'),
        api.get('/api/matches'),
      ]);
      setUser(me);
      saveUser(me);
      setDaily(dailyData.filter((d) => d.action === 'pending'));
      setMatches(matchData.slice(0, 5));
    } catch {
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setUser(cached);
    loadData();
  }, [loadData]);

  async function handleAction(targetId, action) {
    setActionLoading(targetId);
    const matchedProfile = daily.find((d) => d.id === targetId);
    try {
      const result = await api.post('/api/matches/action', { target_id: targetId, action });
      setDaily((prev) => prev.filter((d) => d.id !== targetId));
      if (result.matched) {
        showToast(`🎉 It's a match! You and ${matchedProfile?.first_name || 'your connection'} both connected.`);
        await loadData();
      } else if (action === 'connect') {
        showToast(`Connection request sent to ${matchedProfile?.first_name || 'them'}!`);
      }
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setActionLoading('');
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="loading-center"><div className="spinner" /></div>
      </div>
    </>
  );

  return (
    <>
      <Navbar user={user} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

          {/* ── Welcome bar ── */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ marginBottom: '.2rem' }}>
                Good {greeting()}, {user?.first_name} 👋
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '.95rem' }}>{today}</p>
            </div>
            {user?.badges?.length > 0 && (
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {user.badges.map((b) => <Badge key={b.badge_type} type={b.badge_type} />)}
              </div>
            )}
          </div>

          <div className="dashboard-grid">
            {/* ── Left: Daily profiles ── */}
            <div>
              <div className="section-header">
                <h2>Today&apos;s profiles</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>
                  {daily.length} of 5 remaining · refreshes daily
                </span>
              </div>

              {daily.length === 0 ? (
                <div className="card empty-state">
                  <div className="empty-state-icon">🌿</div>
                  <h3>All caught up for today</h3>
                  <p>
                    Your five daily profiles refresh tomorrow morning.
                    In the meantime, check your matches or explore a circle.
                  </p>
                  <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/matches"  className="btn btn-primary btn-sm">View matches</Link>
                    <Link href="/circles"  className="btn btn-ghost btn-sm">Explore circles</Link>
                    <Link href="/events"   className="btn btn-ghost btn-sm">Local events</Link>
                  </div>
                </div>
              ) : (
                <div className="daily-matches-grid">
                  {daily.map((profile) => (
                    <MatchCard
                      key={profile.id}
                      profile={profile}
                      onConnect={() => handleAction(profile.id, 'connect')}
                      onPass={()    => handleAction(profile.id, 'pass')}
                      loading={actionLoading === profile.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Sidebar ── */}
            <aside>
              {/* Stats */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Your stats</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="stat-block">
                    <div className="stat-value">{user?.login_streak || 0}</div>
                    <div className="stat-label">Day streak 🔥</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value">{user?.response_rate ?? 100}%</div>
                    <div className="stat-label">Response rate</div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-value">{user?.visibility_score ?? 100}</div>
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
                    <h3 style={{ fontSize: '1rem' }}>Recent matches</h3>
                    <Link href="/matches" style={{ fontSize: '.83rem', color: 'var(--accent)', fontWeight: 600 }}>
                      View all
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                    {matches.map((m) => (
                      <Link
                        key={m.match_id}
                        href={`/chat?id=${m.match_id}`}
                        className="chat-match-item"
                        style={{ borderRadius: 'var(--radius)', textDecoration: 'none', color: 'inherit' }}>
                        <div
                          className="avatar avatar-sm"
                          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-lt) 100%)' }}>
                          {m.profile_photo_url
                            ? <img src={m.profile_photo_url} alt={m.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : m.first_name?.[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="chat-match-name">{m.first_name}</div>
                          <div className="chat-match-preview">{m.last_message || 'Say hello! 👋'}</div>
                        </div>
                        {m.unread_count > 0 && <span className="unread-dot" />}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Explore</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {[
                    { href: '/browse',  label: '🔍  Discover profiles',   },
                    { href: '/circles', label: '🏘️  Interest Circles'      },
                    { href: '/events',  label: '📅  Local Events'          },
                    { href: '/profile', label: '✏️  Edit Profile'          },
                    { href: '/settings',label: '⚙️  Settings'             },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', borderRadius: 'var(--radius)', fontWeight: 500 }}>
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
