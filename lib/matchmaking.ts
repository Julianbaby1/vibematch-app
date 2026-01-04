import { getSupabaseClient } from "./supabaseClient";

export type Profile = {
  id: string;
  age: number | null;
  interests: string[] | null;
  preferences: string | null;
  location: string | null;
  min_age: number | null;
  max_age: number | null;
};

export type ScoredProfile = Profile & {
  score: number;
};

export type MatchDecision = "like" | "pass";

const parseInterests = (interests: string[] | null) =>
  interests?.map((interest) => interest.toLowerCase().trim()) ?? [];

export const scoreProfile = (viewer: Profile, candidate: Profile) => {
  const viewerInterests = parseInterests(viewer.interests);
  const candidateInterests = parseInterests(candidate.interests);
  const sharedInterests = viewerInterests.filter((interest) =>
    candidateInterests.includes(interest)
  );

  const interestScore = sharedInterests.length * 5;
  const locationScore =
    viewer.location && candidate.location && viewer.location === candidate.location
      ? 10
      : 0;

  const ageRangeScore =
    viewer.min_age !== null &&
    viewer.max_age !== null &&
    candidate.age !== null &&
    candidate.age >= viewer.min_age &&
    candidate.age <= viewer.max_age
      ? 8
      : 0;

  return interestScore + locationScore + ageRangeScore;
};

export const upsertProfile = async (profile: Profile) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
};

export const getCandidateProfiles = async (
  viewerId: string
): Promise<ScoredProfile[]> => {
  const supabase = getSupabaseClient();
  const { data: viewer, error: viewerError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", viewerId)
    .single();

  if (viewerError) {
    throw new Error(viewerError.message);
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", viewerId);

  if (candidatesError) {
    throw new Error(candidatesError.message);
  }

  return (candidates ?? []).map((candidate) => ({
    ...(candidate as Profile),
    score: scoreProfile(viewer as Profile, candidate as Profile),
  }));
};

export const recordMatchDecision = async (params: {
  viewerId: string;
  candidateId: string;
  decision: MatchDecision;
  score: number;
}) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({
      viewer_id: params.viewerId,
      candidate_id: params.candidateId,
      decision: params.decision,
      score: params.score,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
