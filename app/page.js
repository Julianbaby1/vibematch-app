import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="landing-hero">
        <div style={{ width: '100%' }}>
          <div className="landing-hero-content">
            <p className="landing-eyebrow">✦ For Adults 35 &amp; Older</p>
            <h1 className="landing-title">
              Dating That Matches<br />
              <span className="highlight">Your Real Life</span>
            </h1>
            <p className="landing-sub">
              VibeMatch is dating that matches your real life, not just your
              photos. Meaningful conversation, genuine chemistry, and a fresh
              start. No swiping. No games. Just real people.
            </p>
            <div className="landing-cta">
              <Link href="/register" className="btn btn-primary btn-xl">
                Create your profile — free
              </Link>
              <Link href="/login" className="btn btn-ghost btn-lg" style={{ borderRadius: '999px' }}>
                Sign in
              </Link>
            </div>
            <div className="landing-social-proof">
              <span className="social-proof-item">
                <span>✓</span> <strong>35+</strong> age verified
              </span>
              <span className="social-proof-item">
                <span>✓</span> <strong>Conversation-first</strong> matching
              </span>
              <span className="social-proof-item">
                <span>✓</span> <strong>No ghosting</strong> policy
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">💬</div>
          <h3>Conversation first</h3>
          <p>
            Answer three personal prompts. Potential matches see who you truly
            are before ever connecting — no profile-photo guessing games.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🤝</div>
          <h3>5 curated daily profiles</h3>
          <p>
            No endless scrolling. Each day you receive five thoughtfully
            selected people. Connect or Pass — simple and intentional.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🌿</div>
          <h3>Accountability built in</h3>
          <p>
            Consistent communicators are boosted in search. Ghosting reduces
            your visibility. We reward people who show up.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏘️</div>
          <h3>Interest Circles</h3>
          <p>
            Join communities like Over-40 Travel, Single Parents, or Book
            Lovers. Meet people naturally through shared interests.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <h3>Local events</h3>
          <p>
            RSVP to real-world events near you. Take conversations offline at
            meetups designed for adults ready to connect.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Safe &amp; verified</h3>
          <p>
            Age-verified membership, transparent reporting, and an active
            moderation team. Your safety is our priority.
          </p>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="landing-steps">
        <p className="landing-eyebrow" style={{ display: 'inline-flex', marginBottom: '1rem' }}>How it works</p>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '.75rem' }}>
          Three steps to your next great connection
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto' }}>
          We&apos;ve removed the noise so you can focus on what matters.
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Build your story</h3>
            <p>
              Create a profile that goes beyond photos. Answer three honest
              prompts and let your personality lead.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Meet today&apos;s five</h3>
            <p>
              Each morning, five curated profiles arrive — scored by shared
              interests, location, and conversation style.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Connect &amp; talk</h3>
            <p>
              When both of you connect, a real-time conversation opens.
              No matches sitting idle — talk or the connection cools.
            </p>
          </div>
        </div>
      </div>

      {/* ── CTA section ── */}
      <div className="landing-cta-section">
        <h2>Ready to find your vibe?</h2>
        <p>Join adults 35+ who are done settling and ready for something real.</p>
        <Link href="/register" className="btn btn-white btn-xl">
          Get started — it&apos;s free
        </Link>
      </div>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p>VibeMatch © 2026 · JustMyType.help · Exclusively for adults 35+ · Built with intention</p>
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '.75rem', flexWrap: 'wrap' }}>
          <Link href="/login" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>Sign in</Link>
          <Link href="/register" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>Create account</Link>
          <Link href="/about" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>About</Link>
          <Link href="/safety" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>Safety Center</Link>
          <Link href="/community-guidelines" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>Community Guidelines</Link>
          <Link href="/privacy" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>Terms of Service</Link>
          <Link href="/child-safety" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>Child Safety Standards</Link>
          <Link href="/delete-account" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>Delete Your Account</Link>
          <Link href="/contact" style={{ color: 'var(--text-light)', fontSize: '.85rem' }}>Contact</Link>
        </div>
      </footer>
    </>
  );
}
