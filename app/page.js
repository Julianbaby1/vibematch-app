import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="landing-hero">
        <div style={{ width: '100%' }}>
          <div className="landing-hero-content">
            <p className="landing-logo">✦ Second Wind</p>
            <h1 className="landing-title">
              Dating for the <span>rest of your life</span>
            </h1>
            <p className="landing-sub">
              A thoughtful platform for adults 39 and older who are ready for real
              conversations, meaningful connections, and a fresh start.
            </p>
            <div className="landing-cta">
              <Link href="/register" className="btn btn-primary btn-lg">
                Create your profile
              </Link>
              <Link href="/login" className="btn btn-outline btn-lg">
                Sign in
              </Link>
            </div>
          </div>

          {/* ── Feature cards ── */}
          <div className="landing-features">
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Conversation first</h3>
              <p>
                Answer three prompts before matching. See a preview of who someone
                truly is before you connect.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>No swiping</h3>
              <p>
                Five curated daily profiles. Choose to Connect or Pass — no
                endless scrolling, no fatigue.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>Accountability built in</h3>
              <p>
                Our system rewards consistent communicators and gently nudges
                those who go quiet.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏘️</div>
              <h3>Interest Circles</h3>
              <p>
                Join communities — Over 40 Travel, Single Parents, Book Club —
                and meet people naturally.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Local Events</h3>
              <p>
                Browse and RSVP to events in your area designed for adults
                ready to connect in real life.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Safe & respectful</h3>
              <p>
                Verified age requirement, a transparent report system, and a
                team that moderates actively.
              </p>
            </div>
          </div>

          {/* ── Footer strip ── */}
          <p style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-light)', fontSize: '.9rem' }}>
            For adults 39+ · Built with intention · Second Wind © 2025
          </p>
        </div>
      </section>
    </>
  );
}
