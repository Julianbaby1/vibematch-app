"use client";

import { useEffect, useState } from "react";
import { Profile, upsertProfile } from "../../../lib/matchmaking";

const emptyProfile: Omit<Profile, "id"> = {
  age: null,
  interests: [],
  preferences: "",
  location: "",
  min_age: null,
  max_age: null,
};

const normalizeInterests = (raw: string) =>
  raw
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean);

export default function ProfilePage() {
  const [profileId, setProfileId] = useState<string>("");
  const [formState, setFormState] = useState({
    age: "",
    interests: "",
    preferences: "",
    location: "",
    min_age: "",
    max_age: "",
  });
  const [status, setStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedId = window.localStorage.getItem("profileId");
    if (storedId) {
      setProfileId(storedId);
    } else {
      const newId = crypto.randomUUID();
      window.localStorage.setItem("profileId", newId);
      setProfileId(newId);
    }
  }, []);

  const updateField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");

    try {
      const profile: Profile = {
        ...emptyProfile,
        id: profileId,
        age: formState.age ? Number(formState.age) : null,
        interests: normalizeInterests(formState.interests),
        preferences: formState.preferences || null,
        location: formState.location || null,
        min_age: formState.min_age ? Number(formState.min_age) : null,
        max_age: formState.max_age ? Number(formState.max_age) : null,
      };

      await upsertProfile(profile);
      setStatus("Profile saved. Head to the match screen to start swiping.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save profile.";
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Your Profile</h1>
      <p style={{ marginBottom: "2rem" }}>
        Share a bit about yourself so we can find great matches.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.5rem" }}>
          Age
          <input
            type="number"
            min={18}
            max={99}
            value={formState.age}
            onChange={(event) => updateField("age", event.target.value)}
          />
        </label>
        <label style={{ display: "grid", gap: "0.5rem" }}>
          Interests (comma separated)
          <input
            type="text"
            value={formState.interests}
            onChange={(event) => updateField("interests", event.target.value)}
            placeholder="Hiking, sci-fi, cooking"
          />
        </label>
        <label style={{ display: "grid", gap: "0.5rem" }}>
          Preferences
          <textarea
            rows={4}
            value={formState.preferences}
            onChange={(event) => updateField("preferences", event.target.value)}
            placeholder="What are you looking for?"
          />
        </label>
        <label style={{ display: "grid", gap: "0.5rem" }}>
          Location
          <input
            type="text"
            value={formState.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="City or neighborhood"
          />
        </label>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            Preferred min age
            <input
              type="number"
              min={18}
              max={99}
              value={formState.min_age}
              onChange={(event) => updateField("min_age", event.target.value)}
            />
          </label>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            Preferred max age
            <input
              type="number"
              min={18}
              max={99}
              value={formState.max_age}
              onChange={(event) => updateField("max_age", event.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={isSaving || !profileId}>
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>
      {status ? (
        <p style={{ marginTop: "1.5rem", color: "#1f2937" }}>{status}</p>
      ) : null}
    </main>
  );
}
