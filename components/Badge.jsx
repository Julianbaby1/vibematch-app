'use client';

const BADGE_CONFIG = {
  consistent_communicator: { label: 'Consistent Communicator', icon: '💬', color: 'badge-green'  },
  community_pillar:        { label: 'Community Pillar',        icon: '🌿', color: 'badge-blue'   },
  event_organizer:         { label: 'Event Organizer',         icon: '📅', color: 'badge-purple' },
  streak_7:                { label: '7-Day Streak',            icon: '🔥', color: 'badge-amber'  },
  streak_30:               { label: '30-Day Streak',           icon: '⚡', color: 'badge-amber'  },
};

export default function Badge({ type }) {
  const config = BADGE_CONFIG[type] || { label: type, icon: '✦', color: 'badge-blue' };

  return (
    <span className={`badge ${config.color}`} title={config.label}>
      {config.icon} {config.label}
    </span>
  );
}
