'use client';

const CATEGORY_ICONS = {
  travel: '✈️', family: '👨‍👩‍👧', health: '💪', culture: '📚',
  career: '💼', wellness: '🧘', food: '🍽️', other: '✦',
};

export default function CircleCard({ circle, onJoin }) {
  const icon = CATEGORY_ICONS[circle.category] || '✦';

  return (
    <div className="circle-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
        <span style={{ fontSize: '1.75rem' }}>{icon}</span>
        {circle.is_member && (
          <span className="badge badge-green" style={{ fontSize: '.72rem' }}>Joined</span>
        )}
      </div>

      <div className="circle-category">{circle.category || 'Community'}</div>
      <h3 style={{ marginBottom: '.4rem' }}>{circle.name}</h3>

      {circle.description && (
        <p style={{ fontSize: '.88rem', color: 'var(--text-muted)', marginBottom: '.85rem', lineHeight: 1.5 }}>
          {circle.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.83rem', color: 'var(--text-muted)' }}>
          {circle.member_count} member{circle.member_count !== 1 ? 's' : ''}
        </span>
        <button
          className={`btn btn-sm ${circle.is_member ? 'btn-ghost' : 'btn-primary'}`}
          onClick={() => onJoin(circle.id, circle.is_member)}>
          {circle.is_member ? 'Leave' : 'Join'}
        </button>
      </div>
    </div>
  );
}
