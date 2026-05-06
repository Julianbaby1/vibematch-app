'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '../../lib/api';
import Navbar from '../../components/Navbar';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #1E3A2F 0%, #2E5442 100%)',
  'linear-gradient(135deg, #7A5C35 0%, #C8874A 100%)',
  'linear-gradient(135deg, #3D2B1F 0%, #7A5C35 100%)',
  'linear-gradient(135deg, #1A4B6B 0%, #2980B9 100%)',
];

function getGradient(name) {
  return AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

export default function MatchesPage() {
  const router = useRouter();
  const [user, setUser]       = useState(null);
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
              <div className="empty-state-icon">🌱</div>
              <h3>No connections yet</h3>
              <p>
                Head to your dashboard to review today&apos;s daily profiles.
                When two people both connect, a match is made!
              </p>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <Link href="/dashboard" className="btn btn-primary btn-sm">View daily profiles</Link>
                <Link href="/browse"    className="btn btn-ghost btn-sm">Browse profiles</Link>
              </div>
            </div>
          ) : (
            <div className="grid-2">
              {matches.map((m) => (
                <div key={m.match_id} className="match-list-card">
                  {/* Avatar */}
                  <div
                    className="avatar avatar-lg"
                    style={{ flexShrink: 0, background: getGradient(m.first_name) }}>
                    {m.profile_photo_url
                      ? <img src={m.profile_photo_url} alt={m.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : <span>{m.first_name?.[0]}</span>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem', marginBottom: '.25rem' }}>
                      <h3 style={{ fontSize: '1.05rem' }}>{m.first_name}</h3>
                      {m.unread_count > 0 && (
                        <span className="badge badge-amber" style={{ flexShrink: 0 }}>
                          {m.unread_count} new
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '.4rem' }}>
                      {[m.city || 'Location not set', m.compatibility_score != null && `${m.compatibility_score}% match`].filter(Boolean).join(' · ')}
                    </p>
                    <p style={{
                      fontSize: '.88rem', color: 'var(--text-muted)', marginBottom: '1rem',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {m.last_message || 'No messages yet — say hello! 👋'}
                    </p>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/chat?id=${m.match_id}`} className="btn btn-primary btn-sm">
                        {m.last_message ? '💬 Continue chat' : '👋 Send first message'}
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
