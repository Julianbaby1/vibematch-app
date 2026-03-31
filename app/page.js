"use client";

import { useMemo, useState } from "react";

const PROFILES = [
  {
    id: 1,
    name: "Ava",
    age: 27,
    distance: "2 miles away",
    tagline: "Golden-hour chaser & latte artist.",
    interests: ["Photography", "Hiking", "Matcha"],
    about:
      "Seeking someone who loves slow mornings, sunny hikes, and spontaneous concert nights.",
    compatibility: 92,
    photo:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Milo",
    age: 30,
    distance: "4 miles away",
    tagline: "Chef by trade, playlist curator by night.",
    interests: ["Cooking", "Vinyl", "City walks"],
    about:
      "Let’s swap favorite recipes and wander through weekend markets together.",
    compatibility: 88,
    photo:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Sienna",
    age: 26,
    distance: "1 mile away",
    tagline: "Yoga flow & beach bonfire vibes.",
    interests: ["Yoga", "Surfing", "Podcasts"],
    about:
      "Looking for a grounding connection that can also laugh at midnight memes.",
    compatibility: 95,
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Kai",
    age: 29,
    distance: "3 miles away",
    tagline: "Product designer with a weakness for ramen.",
    interests: ["Design", "Ramen", "Cycling"],
    about:
      "Optimist with big dreams. Let’s co-create adventures and new playlists.",
    compatibility: 90,
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
];

const INITIAL_INDEX = 0;

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(INITIAL_INDEX);
  const [likes, setLikes] = useState([]);
  const [passes, setPasses] = useState([]);

  const currentProfile = PROFILES[currentIndex];
  const hasMoreProfiles = currentIndex < PROFILES.length;

  const matches = useMemo(() => likes.map((profile) => profile.name), [likes]);

  const handleLike = () => {
    if (!currentProfile) {
      return;
    }
    setLikes((prev) => [...prev, currentProfile]);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePass = () => {
    if (!currentProfile) {
      return;
    }
    setPasses((prev) => [...prev, currentProfile]);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleRestart = () => {
    setCurrentIndex(INITIAL_INDEX);
    setLikes([]);
    setPasses([]);
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="pill">Now matching</p>
          <h1>VibeMatch</h1>
          <p className="subtitle">
            Discover people who share your spark. Swipe with intention, chat
            with confidence, and see who vibes back.
          </p>
        </div>
        <div className="stats">
          <div>
            <span className="stat-value">{likes.length}</span>
            <span className="stat-label">Likes</span>
          </div>
          <div>
            <span className="stat-value">{passes.length}</span>
            <span className="stat-label">Passes</span>
          </div>
          <div>
            <span className="stat-value">{matches.length}</span>
            <span className="stat-label">Matches</span>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="card">
          {hasMoreProfiles && currentProfile ? (
            <>
              <div className="card-image">
                <img
                  src={currentProfile.photo}
                  alt={`${currentProfile.name} profile`}
                />
                <div className="compatibility">
                  {currentProfile.compatibility}% vibe match
                </div>
              </div>
              <div className="card-body">
                <div className="card-header">
                  <div>
                    <h2>
                      {currentProfile.name}, {currentProfile.age}
                    </h2>
                    <p className="distance">{currentProfile.distance}</p>
                  </div>
                  <span className="tagline">{currentProfile.tagline}</span>
                </div>
                <p className="about">{currentProfile.about}</p>
                <div className="chips">
                  {currentProfile.interests.map((interest) => (
                    <span key={interest}>{interest}</span>
                  ))}
                </div>
              </div>
              <div className="card-actions">
                <button className="secondary" onClick={handlePass}>
                  Pass
                </button>
                <button className="primary" onClick={handleLike}>
                  Like
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No more profiles nearby</h2>
              <p>
                You reached the end of today’s stack. Restart to revisit, or
                check back later for more matches.
              </p>
              <button className="primary" onClick={handleRestart}>
                Restart stack
              </button>
            </div>
          )}
        </section>

        <section className="match-panel">
          <h3>Today's matches</h3>
          {matches.length === 0 ? (
            <p className="muted">
              Like a profile to start building your matches.
            </p>
          ) : (
            <ul>
              {matches.map((name) => (
                <li key={name}>
                  <span className="avatar">{name.slice(0, 1)}</span>
                  <div>
                    <p>{name}</p>
                    <span>Send a wave 👋</span>
                  </div>
                  <button className="ghost">Message</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
