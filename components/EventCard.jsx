'use client';

export default function EventCard({ event, currentUserId, onRsvp }) {
  const date = new Date(event.event_date);
  const day  = date.toLocaleDateString('en-US', { day: 'numeric' });
  const mon  = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const isOwn = event.creator_id === currentUserId;

  return (
    <div className="event-card">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {/* Date badge */}
        <div className="event-date-badge">
          <span>{mon}</span>
          <span className="day">{day}</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
            <h3 style={{ lineHeight: 1.3 }}>{event.title}</h3>
            {event.is_online && <span className="badge badge-blue">Online</span>}
          </div>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
            {time} · {event.city || 'Location TBD'}{event.location ? ` · ${event.location}` : ''}
          </p>
        </div>
      </div>

      {event.description && (
        <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: '.85rem', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.description}
        </p>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', fontSize: '.83rem', color: 'var(--text-muted)' }}>
          <span>👤 {event.rsvp_count} going{event.max_attendees ? ` / ${event.max_attendees}` : ''}</span>
          {event.category && <span className="tag">{event.category}</span>}
          <span>by {event.creator_name}</span>
        </div>

        {!isOwn && (
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {event.has_rsvped ? (
              <>
                <span className={`badge ${event.rsvp_status === 'going' ? 'badge-green' : 'badge-amber'}`}>
                  {event.rsvp_status === 'going' ? '✓ Going' : 'Maybe'}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => onRsvp(event.id, 'not_going')}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => onRsvp(event.id, 'going')}>
                  RSVP — Going
                </button>
                <button className="btn btn-ghost btn-sm"  onClick={() => onRsvp(event.id, 'maybe')}>
                  Maybe
                </button>
              </>
            )}
          </div>
        )}
        {isOwn && <span className="badge badge-blue">Your event</span>}
      </div>
    </div>
  );
}
