import { NextResponse } from "next/server";

type Profile = {
  name: string;
  interests?: string[];
  values?: string[];
  communicationStyle?: string;
  lookingFor?: string;
};

type MatchRequest = {
  profileA: Profile;
  profileB: Profile;
};

const normalizeList = (items: string[] | undefined): string[] =>
  (items ?? [])
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);

const unique = (items: string[]): string[] => Array.from(new Set(items));

const intersect = (a: string[], b: string[]): string[] =>
  a.filter((item) => b.includes(item));

const formatList = (items: string[]): string => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const compatibilityLevel = (sharedInterestCount: number, sharedValueCount: number): string => {
  const score = sharedInterestCount * 2 + sharedValueCount * 2;
  if (score >= 8) return "high";
  if (score >= 4) return "medium";
  return "emerging";
};

const buildSummary = (profileA: Profile, profileB: Profile): string => {
  const interestsA = unique(normalizeList(profileA.interests));
  const interestsB = unique(normalizeList(profileB.interests));
  const valuesA = unique(normalizeList(profileA.values));
  const valuesB = unique(normalizeList(profileB.values));

  const sharedInterests = intersect(interestsA, interestsB);
  const sharedValues = intersect(valuesA, valuesB);
  const level = compatibilityLevel(sharedInterests.length, sharedValues.length);

  const interestLine =
    sharedInterests.length > 0
      ? `You both enjoy ${formatList(sharedInterests)}.`
      : "You have a chance to introduce each other to new interests.";

  const valueLine =
    sharedValues.length > 0
      ? `Shared values like ${formatList(sharedValues)} can make conversations flow naturally.`
      : "Your different values could spark meaningful conversations.";

  const styleLine =
    profileA.communicationStyle &&
    profileB.communicationStyle &&
    normalizeList([profileA.communicationStyle])[0] ===
      normalizeList([profileB.communicationStyle])[0]
      ? `You both prefer a ${profileA.communicationStyle.toLowerCase()} communication style.`
      : "Your communication styles can complement each other with a little curiosity.";

  const lookingForLine =
    profileA.lookingFor && profileB.lookingFor && profileA.lookingFor === profileB.lookingFor
      ? `You're both looking for ${profileA.lookingFor.toLowerCase()} right now.`
      : "You can align expectations by sharing what you're each hoping for.";

  return [
    `${profileA.name} and ${profileB.name} have ${level} compatibility based on shared interests and values.`,
    interestLine,
    valueLine,
    styleLine,
    lookingForLine,
  ].join(" ");
};

export async function POST(request: Request) {
  const payload = (await request.json()) as MatchRequest;

  if (!payload?.profileA || !payload?.profileB) {
    return NextResponse.json(
      { error: "Both profileA and profileB are required." },
      { status: 400 },
    );
  }

  const summary = buildSummary(payload.profileA, payload.profileB);

  return NextResponse.json({ summary });
}
