'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearUser } from '../lib/api';
import { supabase } from '../lib/supabase';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/matches',   label: 'Matches' },
  { href: '/chat',      label: 'Messages' },
  { href: '/circles',   label: 'Circles' },
  { href: '/events',    label: 'Events' },
];

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Home',     icon: '🏠' },
  { href: '/browse',    label: 'Discover', icon: '🔍' },
  { href: '/matches',   label: 'Matches',  icon: '💚' },
  { href: '/chat',      label: 'Chat',     icon: '💬' },
  { href: '/profile',   label: 'Profile',  icon: '👤' },
];

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // best-effort — always clear local state
    }
    clearUser();
    router.push('/');
  }

  return (
    <>
      {/* ── Desktop / tablet navbar ── */}
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="navbar-logo">
            <span className="navbar-logo-mark">✦</span>
            Second Wind
          </Link>

          {/* Nav links — logged in only */}
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
                <Link
                  href="/admin"
                  className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}>
                  Admin
                </Link>
              )}
            </div>
          )}

          {/* Right side */}
          <div className="navbar-user">
            {user ? (
              <>
                <Link
                  href="/profile"
                  style={{ display: 'flex', alignItems: 'center', gap: '.45rem', textDecoration: 'none', color: 'var(--text)' }}>
                  <div
                    className="avatar"
                    style={{ width: 32, height: 32, fontSize: '.85rem' }}>
                    {user.profile_photo_url
                      ? <img src={user.profile_photo_url} alt={user.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : <span>{user.first_name?.[0]}</span>}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{user.first_name}</span>
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

      {/* ── Mobile bottom navigation (only when logged in) ── */}
      {user && (
        <nav className="mobile-nav">
          <div className="mobile-nav-inner">
            {MOBILE_NAV.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`mobile-nav-item ${pathname?.startsWith(href) ? 'active' : ''}`}>
                <span className="mobile-nav-icon">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
