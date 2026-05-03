'use client';

export default function MatchCard({ profile, onConnect, onPass, loading }) {
  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const prompts   = Array.isArray(profile.prompt_responses) ? profile.prompt_responses.filter(Boolean) : [];

  return (
    <div className="match-card">
      {/* Photo / avatar */}
      <div className="match-card-photo">
        {profile.profile_photo_url
          ? <img src={profile.profile_photo_url} alt={profile.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span>{profile.first_name?.[0]}</span>}
      </div>

      <div className="match-card-body">
        {/* Name + meta */}
        <div className="match-card-name">
          {profile.first_name}{age ? `, ${age}` : ''}
        </div>
        <div className="match-card-meta">
          {[profile.city, profile.life_stage && capitalize(profile.life_stage)].filter(Boolean).join(' · ')}
          {profile.compatibility_score != null && ` · ${profile.compatibility_score}% match`}
        </div>

        {/* Bio snippet */}
        {profile.bio && <div className="match-card-bio">{profile.bio}</div>}

        {/* Interests */}
        {interests.length > 0 && (
          <div className="match-card-interests">
            {interests.slice(0, 5).map((i) => (
              <span key={i} className="tag">{i}</span>
            ))}
          </div>
        )}

        {/* Prompt preview — the core of conversation-first matching */}
        {prompts.slice(0, 2).map((p, i) => (
          <div key={i} className="prompt-preview">
            <div className="prompt-question">{p.question}</div>
            <div className="prompt-answer">{p.response}</div>
          </div>
        ))}

        {/* Actions */}
        <div className="match-card-actions" style={{ marginTop: '1rem' }}>
          <button
            className="btn btn-ghost"
            onClick={onPass}
            disabled={loading}>
            Pass
          </button>
          <button
            className="btn btn-primary"
            onClick={onConnect}
            disabled={loading}>
            {loading ? '…' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
