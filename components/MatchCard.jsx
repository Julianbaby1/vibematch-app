'use client';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #1E3A2F 0%, #2E5442 100%)',
  'linear-gradient(135deg, #7A5C35 0%, #C8874A 100%)',
  'linear-gradient(135deg, #3D2B1F 0%, #7A5C35 100%)',
  'linear-gradient(135deg, #1A4B6B 0%, #2980B9 100%)',
  'linear-gradient(135deg, #4A235A 0%, #8E44AD 100%)',
];

function getGradient(name) {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

export default function MatchCard({ profile, onConnect, onPass, loading }) {
  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const interests = Array.isArray(profile.interests)       ? profile.interests       : [];
  const prompts   = Array.isArray(profile.prompt_responses) ? profile.prompt_responses.filter(Boolean) : [];
  const gradient  = getGradient(profile.first_name);

  return (
    <div className="match-card">
      {/* ── Photo section ── */}
      <div className="match-card-photo">
        {profile.profile_photo_url ? (
          <img
            src={profile.profile_photo_url}
            alt={profile.first_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="match-card-photo-placeholder">{profile.first_name?.[0]}</span>
          </div>
        )}

        {/* Gradient name overlay */}
        <div className="match-card-photo-overlay">
          <div className="match-card-name-overlay">
            {profile.first_name}{age ? `, ${age}` : ''}
            {profile.compatibility_score != null && (
              <span className="compat-badge">{profile.compatibility_score}% match</span>
            )}
          </div>
          {(profile.city || profile.life_stage) && (
            <div className="match-card-meta-overlay">
              {[profile.city, profile.life_stage && capitalize(profile.life_stage)].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="match-card-body">
        {/* Bio snippet */}
        {profile.bio && (
          <p className="match-card-bio">{profile.bio}</p>
        )}

        {/* Interest tags */}
        {interests.length > 0 && (
          <div className="match-card-interests">
            {interests.slice(0, 4).map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
            {interests.length > 4 && (
              <span className="tag" style={{ color: 'var(--text-light)' }}>+{interests.length - 4}</span>
            )}
          </div>
        )}

        {/* Prompt previews — conversation-first UX */}
        {prompts.slice(0, 2).map((p, i) => (
          <div key={i} className="prompt-preview">
            <div className="prompt-question">{p.question}</div>
            <div className="prompt-answer">{p.response}</div>
          </div>
        ))}

        {/* Action buttons */}
        <div className="match-card-actions">
          <button
            className="btn btn-ghost"
            onClick={onPass}
            disabled={loading}
            style={{ borderRadius: '999px' }}>
            ✕ Pass
          </button>
          <button
            className="btn btn-primary"
            onClick={onConnect}
            disabled={loading}
            style={{ borderRadius: '999px' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Connecting…
              </span>
            ) : '✓ Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
