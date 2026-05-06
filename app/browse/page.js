'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser, saveUser } from '../../lib/api';
import Navbar from '../../components/Navbar';
import MatchCard from '../../components/MatchCard';

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

export default function BrowsePage() {
  const router = useRouter();
  const [user, setUser]               = useState(null);
  const [daily, setDaily]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast]             = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadProfiles = useCallback(async () => {
    try {
      const [me, dailyData] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/matches/daily'),
      ]);
      setUser(me);
      saveUser(me);
      setDaily(dailyData.filter((d) => d.action === 'pending'));
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
    loadProfiles();
  }, [loadProfiles]);

  async function handleAction(targetId, action) {
    setActionLoading(targetId);
    const matchedProfile = daily.find((d) => d.id === targetId);
    try {
      const result = await api.post('/api/matches/action', { target_id: targetId, action });
      setDaily((prev) => prev.filter((d) => d.id !== targetId));
      if (result.matched) {
        showToast(`🎉 It's a match! You and ${matchedProfile?.first_name || 'your connection'} both connected.`);
        await loadProfiles();
      } else if (action === 'connect') {
        showToast(`Connection request sent to ${matchedProfile?.first_name || 'them'}!`);
      }
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
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

  return (
    <>
      <Navbar user={user} />
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="page-title" style={{ margin: 0 }}>
              <h1>Discover</h1>
              <p>Your five curated profiles for today — refreshes every morning.</p>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>
              {daily.length} remaining today
            </span>
          </div>

          {daily.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">🌿</div>
              <h3>You&apos;re all caught up!</h3>
              <p>
                You&apos;ve reviewed all of today&apos;s profiles. Your next five will appear tomorrow morning.
                In the meantime, explore your matches or join an interest circle.
              </p>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <Link href="/matches"  className="btn btn-primary btn-sm">View matches</Link>
                <Link href="/circles"  className="btn btn-ghost btn-sm">Interest circles</Link>
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
      </div>
    </>
  );
}
