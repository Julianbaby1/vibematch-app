"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const DEMO_PROFILES = [
  {
    id: "demo-1",
    name: "Ava",
    age: 27,
    city: "Detroit",
    tagline: "Golden-hour chaser & latte artist.",
    interests: ["Photography", "Hiking", "Matcha"],
    bio: "Seeking someone who loves slow mornings, sunny hikes, and spontaneous concert nights.",
    compatibility: 92,
    photo_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "demo-2",
    name: "Milo",
    age: 30,
    city: "Dearborn",
    tagline: "Chef by trade, playlist curator by night.",
    interests: ["Cooking", "Vinyl", "City walks"],
    bio: "Let’s swap favorite recipes and wander through weekend markets together.",
    compatibility: 88,
    photo_url: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "demo-3",
    name: "Sienna",
    age: 26,
    city: "Detroit",
    tagline: "Yoga flow & beach bonfire vibes.",
    interests: ["Yoga", "Surfing", "Podcasts"],
    bio: "Looking for a grounding connection that can also laugh at midnight memes.",
    compatibility: 95,
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "demo-4",
    name: "Kai",
    age: 29,
    city: "Southfield",
    tagline: "Product designer with a weakness for ramen.",
    interests: ["Design", "Ramen", "Cycling"],
    bio: "Optimist with big dreams. Let’s co-create adventures and new playlists.",
    compatibility: 90,
    photo_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
];

const INITIAL_INDEX = 0;

const normalizeMatchPair = (userId, otherUserId) => {
  const ordered = [userId, otherUserId].sort();
  return { user_one: ordered[0], user_two: ordered[1] };
};

export default function Home() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [profiles, setProfiles] = useState(DEMO_PROFILES);
  const [selectedCity, setSelectedCity] = useState("All cities");
  const [currentIndex, setCurrentIndex] = useState(INITIAL_INDEX);
  const [likes, setLikes] = useState([]);
  const [passes, setPasses] = useState([]);
  const [matches, setMatches] = useState([]);
  const [dragStart, setDragStart] = useState(null);
  const [notice, setNotice] = useState("");

  const cityOptions = useMemo(() => {
    const cities = [...new Set(profiles.map((profile) => profile.city).filter(Boolean))];
    return ["All cities", ...cities];
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const userId = session?.user?.id;
    return profiles.filter((profile) => {
      const matchesCity = selectedCity === "All cities" || profile.city === selectedCity;
      return matchesCity && profile.id !== userId;
    });
  }, [profiles, selectedCity, session]);

  const currentProfile = filteredProfiles[currentIndex];
  const hasMoreProfiles = currentIndex < filteredProfiles.length;

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!isSupabaseConfigured || !session?.user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,age,city,bio,photo_url")
        .order("created_at", { ascending: false });

      if (error) {
        setNotice("Could not load live profiles yet. Showing demo profiles.");
        return;
      }

      if (data?.length) {
        setProfiles(
          data.map((profile) => ({
            ...profile,
            tagline: profile.city ? `Looking nearby in ${profile.city}` : "Looking nearby",
            interests: ["Conversation", "Chemistry", "Good vibes"],
            compatibility: 90,
          }))
        );
      }
    };

    loadProfiles();
  }, [session]);

  useEffect(() => {
    const loadMatches = async () => {
      if (!isSupabaseConfigured || !session?.user?.id) return;

      const userId = session.user.id;
      const { data, error } = await supabase
        .from("matches")
        .select("id,user_one,user_two,created_at")
        .or(`user_one.eq.${userId},user_two.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (!error && data) setMatches(data);
    };

    loadMatches();
  }, [session, likes]);

  const signIn = async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setNotice("Add your Supabase URL and public key to use real login.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    setNotice(error ? error.message : "Check your email for the login link.");
  };

  const resetStackForCity = (city) => {
    setSelectedCity(city);
    setCurrentIndex(INITIAL_INDEX);
    setLikes([]);
    setPasses([]);
  };

  const moveToNextProfile = () => setCurrentIndex((prev) => prev + 1);

  const saveSwipeAndCreateInstantMatch = async (profile, action) => {
    if (!isSupabaseConfigured || !session?.user?.id || profile.id.startsWith("demo-")) return;

    const userId = session.user.id;

    await supabase.from("swipes").upsert({
      swiper_id: userId,
      swiped_id: profile.id,
      action,
    });

    if (action !== "like") return;

    const { data: reciprocalLike } = await supabase
      .from("swipes")
      .select("id")
      .eq("swiper_id", profile.id)
      .eq("swiped_id", userId)
      .eq("action", "like")
      .maybeSingle();

    if (reciprocalLike) {
      const pair = normalizeMatchPair(userId, profile.id);
      const { data: match } = await supabase
        .from("matches")
        .upsert(pair, { onConflict: "user_one,user_two" })
        .select()
        .single();

      if (match) {
        setMatches((prev) => [match, ...prev.filter((item) => item.id !== match.id)]);
        setNotice(`It's a match with ${profile.name}!`);
      }
    }
  };

  const handleLike = async () => {
    if (!currentProfile) return;
    setLikes((prev) => [...prev, currentProfile]);
    await saveSwipeAndCreateInstantMatch(currentProfile, "like");
    moveToNextProfile();
  };

  const handlePass = async () => {
    if (!currentProfile) return;
    setPasses((prev) => [...prev, currentProfile]);
    await saveSwipeAndCreateInstantMatch(currentProfile, "pass");
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
            Pick your city, swipe through nearby profiles, match instantly when the like is mutual,
            and start talking without making it feel like a job interview.
          </p>
          <div className="city-filter">
            {cityOptions.map((city) => (
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
          <div><span className="stat-value">{likes.length}</span><span className="stat-label">Likes</span></div>
          <div><span className="stat-value">{passes.length}</span><span className="stat-label">Passes</span></div>
          <div><span className="stat-value">{matches.length || likes.length}</span><span className="stat-label">Matches</span></div>
        </div>
      </header>

      {!session && (
        <form className="auth-panel" onSubmit={signIn}>
          <strong>Sign in to save your profile, likes, matches, and chats.</strong>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your@email.com"
            required
          />
          <button className="primary" type="submit">Send login link</button>
        </form>
      )}

      {notice && <p className="notice">{notice}</p>}

      <main className="content">
        <section className="card" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
          {hasMoreProfiles && currentProfile ? (
            <>
              <div className="card-image">
                <img src={currentProfile.photo_url} alt={`${currentProfile.name} profile`} />
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
                <p className="about">{currentProfile.bio}</p>
                <div className="chips">
                  {currentProfile.interests.map((interest) => <span key={interest}>{interest}</span>)}
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
            {likes.length === 0 && matches.length === 0 ? (
              <p className="muted">Like a profile to start building your matches.</p>
            ) : (
              <ul>
                {likes.map((profile) => (
                  <li key={profile.id}>
                    <span className="avatar">{profile.name.slice(0, 1)}</span>
                    <div><p>{profile.name}</p><span>{profile.city}</span></div>
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
