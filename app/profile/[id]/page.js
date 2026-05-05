'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import Badge from '../../../components/Badge';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #1E3A2F 0%, #2E5442 100%)',
  'linear-gradient(135deg, #7A5C35 0%, #C8874A 100%)',
  'linear-gradient(135deg, #3D2B1F 0%, #7A5C35 100%)',
  'linear-gradient(135deg, #1A4B6B 0%, #2980B9 100%)',
];

function getGradient(name) {
  return AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

export default function UserProfilePage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params?.id;

  const [viewer, setViewer]   = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    setViewer(cached);

    if (!id) { setError('Invalid profile link'); setLoading(false); return; }

    api.get(`/api/users/${id}`)
      .then(setProfile)
      .catch((err) => setError(err.message || 'Profile not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <>
      <Navbar user={viewer} />
      <div className="main-content"><div className="loading-center"><div className="spinner" /></div></div>
    </>
  );

  if (error || !profile) return (
    <>
      <Navbar user={viewer} />
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '4rem', textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</p>
          <h2>{error || 'Profile not found'}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>
            This profile may have been removed or is unavailable.
          </p>
          <Link href="/matches" className="btn btn-primary">Back to matches</Link>
        </div>
      </div>
    </>
  );

  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const prompts   = Array.isArray(profile.prompt_responses) ? profile.prompt_responses.filter(Boolean) : [];

  return (
    <>
      <Navbar user={viewer} />
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem', maxWidth: 720 }}>

          {/* Back */}
          <Link href="/matches" style={{ color: 'var(--text-muted)', fontSize: '.9rem', display: 'inline-flex', alignItems: 'center', gap: '.35rem', marginBottom: '1.5rem' }}>
            ← Back to matches
          </Link>

          {/* Profile header */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            {/* Photo */}
            <div style={{
              width: '100%',
              height: 280,
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              marginBottom: '1.5rem',
              background: getGradient(profile.first_name),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {profile.profile_photo_url
                ? <img src={profile.profile_photo_url} alt={profile.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '6rem', color: 'rgba(255,255,255,0.7)' }}>{profile.first_name?.[0]}</span>
              }
            </div>

            {/* Name + meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '.2rem' }}>
                  {profile.first_name}{age ? `, ${age}` : ''}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '.95rem' }}>
                  {[profile.city, profile.life_stage && profile.life_stage.charAt(0).toUpperCase() + profile.life_stage.slice(1)].filter(Boolean).join(' · ')}
                </p>
              </div>
              {profile.compatibility_score != null && (
                <span className="badge badge-primary" style={{ fontSize: '.9rem', padding: '.4rem .9rem' }}>
                  {profile.compatibility_score}% match
                </span>
              )}
            </div>

            {/* Badges */}
            {(profile.badges || []).length > 0 && (
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {profile.badges.map((b) => <Badge key={b.badge_type} type={b.badge_type} />)}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1rem' }}>
                {profile.bio}
              </p>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.5rem' }}>
                {interests.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Prompt responses */}
          {prompts.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>In their own words</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {prompts.map((p, i) => (
                  <div key={i} className="prompt-preview">
                    <div className="prompt-question">{p.question}</div>
                    <div className="prompt-answer">{p.response}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <Link href="/matches" className="btn btn-primary">
              💬 Send a message
            </Link>
            <Link href="/matches" className="btn btn-ghost">
              ← Back to matches
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
