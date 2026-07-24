import Link from 'next/link';

/**
 * Shared layout for public information / policy pages.
 * Large text, high contrast, mobile-first, single column.
 */
export default function InfoPage({ title, updated, children }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem', lineHeight: 1.7, fontSize: '1.05rem' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', fontWeight: 600 }}>
        ← Back to VibeMatch
      </Link>
      <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.3rem)', fontWeight: 800, marginBottom: '.5rem' }}>{title}</h1>
      {updated && <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Last updated: {updated}</p>}
      {children}
      <hr style={{ margin: '3rem 0 1.5rem', opacity: .3 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>
        Questions? Visit our <Link href="/contact">Contact page</Link> or email{' '}
        <a href="mailto:support@justmytype.help">support@justmytype.help</a>.
      </p>
    </div>
  );
}
