import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div>
        <p style={{ fontSize: '5rem', marginBottom: '1rem', lineHeight: 1 }}>🍂</p>
        <h1 style={{ fontSize: '2rem', marginBottom: '.5rem' }}>Page not found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-primary">Go to dashboard</Link>
          <Link href="/"          className="btn btn-ghost">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
