"use client";

import { useEffect, useState } from "react";

type Profile = {
  name: string;
  interests: string[];
  values: string[];
  communicationStyle: string;
  lookingFor: string;
};

type MatchResponse = {
  summary?: string;
  error?: string;
};

const SAMPLE_PROFILES: { profileA: Profile; profileB: Profile } = {
  profileA: {
    name: "Ava",
    interests: ["Hiking", "Coffee", "Indie films", "Cooking"],
    values: ["Curiosity", "Kindness", "Growth"],
    communicationStyle: "Thoughtful",
    lookingFor: "A long-term connection",
  },
  profileB: {
    name: "Jordan",
    interests: ["Coffee", "Cooking", "Live music", "Travel"],
    values: ["Kindness", "Adventure", "Growth"],
    communicationStyle: "Thoughtful",
    lookingFor: "A long-term connection",
  },
};

export default function MatchPage() {
  const [summary, setSummary] = useState<string>("Generating match insight...");

  useEffect(() => {
    const loadSummary = async () => {
      const response = await fetch("/api/ai-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(SAMPLE_PROFILES),
      });

      const data = (await response.json()) as MatchResponse;
      setSummary(data.summary ?? data.error ?? "We couldn't generate a match summary.");
    };

    void loadSummary();
  }, []);

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-950 px-6 py-10 text-slate-100">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h1 className="text-2xl font-semibold">Why this match?</h1>
        <p className="mt-3 text-sm text-slate-300">{summary}</p>
        <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-slate-400">Profile A</p>
            <p className="mt-2 font-semibold text-slate-100">{SAMPLE_PROFILES.profileA.name}</p>
            <p className="mt-1">Interests: {SAMPLE_PROFILES.profileA.interests.join(", ")}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-slate-400">Profile B</p>
            <p className="mt-2 font-semibold text-slate-100">{SAMPLE_PROFILES.profileB.name}</p>
            <p className="mt-1">Interests: {SAMPLE_PROFILES.profileB.interests.join(", ")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
