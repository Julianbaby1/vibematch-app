"use client";

import { useMemo, useState } from "react";

const PROFILES = [
  {
    id: 1,
    name: "Ava",
    age: 27,
    city: "Detroit",
    distance: "Detroit",
    tagline: "Golden-hour chaser & latte artist.",
    interests: ["Photography", "Hiking", "Matcha"],
    about: "Seeking someone who loves slow mornings, sunny hikes, and spontaneous concert nights.",
    compatibility: 92,
    photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Milo",
    age: 30,
    city: "Dearborn",
    distance: "Dearborn",
    tagline: "Chef by trade, playlist curator by night.",
    interests: ["Cooking", "Vinyl", "City walks"],
    about: "Let’s swap favorite recipes and wander through weekend markets together.",
    compatibility: 88,
    photo: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Sienna",
    age: 26,
    city: "Detroit",
    distance: "Detroit",
    tagline: "Yoga flow & beach bonfire vibes.",
    interests: ["Yoga", "Surfing", "Podcasts"],
    about: "Looking for a grounding connection that can also laugh at midnight memes.",
    compatibility: 95,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Kai",
    age: 29,
    city: "Southfield",
    distance: "Southfield",
    tagline: "Product designer with a weakness for ramen.",
    interests: ["Design", "Ramen", "Cycling"],
    about: "Optimist with big dreams. Let’s co-create adventures and new playlists.",
    compatibility: 90,
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
];

const CITIES = ["All cities", "Detroit", "Dearborn", "Southfield"];
const INITIAL_INDEX = 0;

export default function Home() {
  const [selectedCity, setSelectedCity] = useState("All cities");
  const [currentIndex, setCurrentIndex] = useState(INITIAL_INDEX);
  const [likes, setLikes] = useState([]);
  const [passes, setPasses] = useState([]);
  const [dragStart, setDragStart] = useState(null);

  const filteredProfiles = useMemo(() => {
    if (selectedCity === "All cities") return PROFILES;
    return PROFILES.filter((profile) => profile.city === selectedCity);
  }, [selectedCity]);

  const currentProfile = filteredProfiles[currentIndex];
  const hasMoreProfiles = currentIndex < filteredProfiles.length;
  const matches = useMemo(() => likes.map((profile) => profile.name), [likes]);

  const resetStackForCity = (city) => {
    setSelectedCity(city);
    setCurrentIndex(INITIAL_INDEX);
    setLikes([]);
    setPasses([]);
  };

  const moveToNextProfile = () => setCurrentIndex((prev) => prev + 1);

  const handleLike = () => {
    if (!currentProfile) return;
    setLikes((prev) => [...prev, currentProfile]);
    moveToNextProfile();
  };

  const handlePass = () => {
    if (!currentProfile) return;
    setPasses((prev) => [...prev, currentProfile]);
    moveToNextProfile();
  };

  const handleRestart = () => {
    setCurrentIndex(INITIAL_INDEX);
    setLikes([]);
    setPasses([]);
  };

  const handlePointerDown = (event) => setDragStart(event.clientX);

  const handlePointerUp = (event) => {
    if (dragStart === null) return;
    const difference = event.clientX - dragStart;
    setDragStart(null);

    if (difference > 70) handleLike();
    if (difference < -70) handlePass();
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="pill">Casual dating • City-based • Free for now</p>
          <h1>VibeMatch</h1>
          <p className="subtitle">
            Meet people nearby without making it feel like a job interview. Pick your city,
            swipe through profiles, match, and start a conversation.
          </p>
          <div className="city-filter">
            {CITIES.map((city) => (
              <button
                key={city}
                className={selectedCity === city ? "city active" : "city"}
                onClick={() => resetStackForCity(city)}
              >
                {city}
              </button>
            ))}
          </div>
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
        <section className="card" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
          {hasMoreProfiles && currentProfile ? (
            <>
              <div className="card-image">
                <img src={currentProfile.photo} alt={`${currentProfile.name} profile`} />
                <div className="compatibility">{currentProfile.compatibility}% vibe match</div>
              </div>
              <div className="card-body">
                <div className="card-header">
                  <div>
                    <h2>{currentProfile.name}, {currentProfile.age}</h2>
                    <p className="distance">{currentProfile.city}</p>
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
                <button className="secondary" onClick={handlePass}>Pass</button>
                <button className="primary" onClick={handleLike}>Like</button>
              </div>
              <p className="swipe-hint">Tip: drag left to pass or right to like.</p>
            </>
          ) : (
            <div className="empty-state">
              <h2>No more profiles in {selectedCity}</h2>
              <p>You reached the end of this city stack. Restart or try another city.</p>
              <button className="primary" onClick={handleRestart}>Restart stack</button>
            </div>
          )}
        </section>

        <aside className="side-rail">
          <section className="match-panel">
            <h3>Today's matches</h3>
            {matches.length === 0 ? (
              <p className="muted">Like a profile to start building your matches.</p>
            ) : (
              <ul>
                {matches.map((name) => (
                  <li key={name}>
                    <span className="avatar">{name.slice(0, 1)}</span>
                    <div>
                      <p>{name}</p>
                      <span>Send a wave 👋</span>
                    </div>
                    <a className="ghost link-button" href="/chat">Message</a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ad-slot">
            <p className="stat-label">Future ad space</p>
            <strong>Local date-night sponsor</strong>
            <span>Free today. Ad-ready later.</span>
          </section>
        </aside>
      </main>
    </div>
  );
}
