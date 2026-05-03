'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '../../lib/api';
import Navbar from '../../components/Navbar';

export default function MatchesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setUser(cached);

    api.get('/api/matches')
      .then(setMatches)
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, []);

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
          <div className="page-title">
            <h1>Your Connections</h1>
            <p>{matches.length} mutual connection{matches.length !== 1 ? 's' : ''}</p>
          </div>

          {matches.length === 0 ? (
            <div className="card empty-state">
              <p style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🌱</p>
              <h3>No connections yet</h3>
              <p>Head to your dashboard to review today's daily profiles and start connecting.</p>
              <Link href="/dashboard" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                View daily profiles
              </Link>
            </div>
          ) : (
            <div className="grid-2">
              {matches.map((m) => (
                <div key={m.match_id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div className="avatar avatar-lg" style={{ flexShrink: 0 }}>
                    {m.profile_photo_url
                      ? <img src={m.profile_photo_url} alt={m.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : <span>{m.first_name?.[0]}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem', marginBottom: '.25rem' }}>
                      <h3>{m.first_name}</h3>
                      {m.unread_count > 0 && (
                        <span className="badge badge-amber">{m.unread_count} new</span>
                      )}
                    </div>
                    <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
                      {m.city || 'Location not set'} · {m.compatibility_score}% match
                    </p>
                    <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: '.85rem',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.last_message || 'No messages yet — say hello!'}
                    </p>
                    <div style={{ display: 'flex', gap: '.6rem' }}>
                      <Link href={`/chat?id=${m.match_id}`} className="btn btn-primary btn-sm">
                        {m.last_message ? 'Continue chat' : 'Send first message'}
                      </Link>
                      <Link href={`/profile/${m.id}`} className="btn btn-ghost btn-sm">
                        View profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
