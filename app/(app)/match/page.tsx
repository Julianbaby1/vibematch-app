"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MatchDecision,
  ScoredProfile,
  getCandidateProfiles,
  recordMatchDecision,
} from "../../../lib/matchmaking";

const formatInterests = (interests: string[] | null) =>
  interests?.length ? interests.join(", ") : "No interests listed";

export default function MatchPage() {
  const [viewerId, setViewerId] = useState<string>("");
  const [candidates, setCandidates] = useState<ScoredProfile[]>([]);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedId = window.localStorage.getItem("profileId");
    if (storedId) {
      setViewerId(storedId);
    }
  }, []);

  useEffect(() => {
    if (!viewerId) {
      return;
    }

    const loadCandidates = async () => {
      setIsLoading(true);
      setStatus("");

      try {
        const results = await getCandidateProfiles(viewerId);
        setCandidates(results);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load candidate profiles.";
        setStatus(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, [viewerId]);

  const currentCandidate = useMemo(() => candidates[0], [candidates]);

  const handleDecision = async (decision: MatchDecision) => {
    if (!currentCandidate || !viewerId) {
      return;
    }

    setStatus("");

    try {
      await recordMatchDecision({
        viewerId,
        candidateId: currentCandidate.id,
        decision,
        score: currentCandidate.score,
      });

      setCandidates((prev) => prev.slice(1));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save match decision.";
      setStatus(message);
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Matches</h1>
      <p style={{ marginBottom: "2rem" }}>
        Swipe through profiles to see who matches your vibe.
      </p>
      {!viewerId ? (
        <p>
          Create your profile first so we can personalize your matches.
        </p>
      ) : null}
      {isLoading ? <p>Loading candidates...</p> : null}
      {status ? (
        <p style={{ marginTop: "1rem", color: "#1f2937" }}>{status}</p>
      ) : null}
      {currentCandidate ? (
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "1.5rem",
            display: "grid",
            gap: "0.75rem",
            marginTop: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem" }}>Candidate match</h2>
          <p>
            <strong>Age:</strong> {currentCandidate.age ?? "Not shared"}
          </p>
          <p>
            <strong>Location:</strong> {currentCandidate.location ?? "Not shared"}
          </p>
          <p>
            <strong>Interests:</strong> {formatInterests(currentCandidate.interests)}
          </p>
          <p>
            <strong>Preferences:</strong> {currentCandidate.preferences ?? "Not shared"}
          </p>
          <p>
            <strong>Compatibility score:</strong> {currentCandidate.score}
          </p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="button" onClick={() => handleDecision("pass")}>
              Pass
            </button>
            <button type="button" onClick={() => handleDecision("like")}>
              Like
            </button>
          </div>
        </section>
      ) : viewerId && !isLoading ? (
        <p style={{ marginTop: "1.5rem" }}>No more matches right now.</p>
      ) : null}
    </main>
  );
}
