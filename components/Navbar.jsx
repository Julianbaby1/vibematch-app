'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '../lib/api';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/matches',   label: 'Matches' },
  { href: '/chat',      label: 'Messages' },
  { href: '/circles',   label: 'Circles' },
  { href: '/events',    label: 'Events' },
];

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router   = useRouter();

  function handleLogout() {
    clearToken();
    router.push('/');
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href={user ? '/dashboard' : '/'} className="navbar-logo">
          ✦ Second Wind
        </Link>

        {/* Nav links — only when logged in */}
        {user && (
          <div className="navbar-nav">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${pathname?.startsWith(href) ? 'active' : ''}`}>
                {label}
              </Link>
            ))}
            {user.is_admin && (
              <Link href="/admin" className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}>
                Admin
              </Link>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="navbar-user">
          {user ? (
            <>
              <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none', color: 'var(--text)' }}>
                <div className="avatar" style={{ width: 32, height: 32, fontSize: '.85rem', background: 'var(--surface-2)' }}>
                  {user.profile_photo_url
                    ? <img src={user.profile_photo_url} alt={user.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <span>{user.first_name?.[0]}</span>}
                </div>
                <span style={{ fontWeight: 600, fontSize: '.92rem' }}>{user.first_name}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login"    className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Join free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
