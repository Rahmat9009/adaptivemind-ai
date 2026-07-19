import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import type { LearningScores } from "@/lib/learning-dna";

export const tutorHandoffStorageKey = "adaptivemind-tutor-handoff";

export interface TutorHandoff {
  message: string;
}

const approachText = {
  visual: "a clear visual breakdown",
  examples: "practical examples",
  analogies: "useful analogies",
  stories: "a concise story-led explanation",
  challenges: "a thoughtful challenge",
} as const;

export function createTutorHandoff(scores: LearningScores): TutorHandoff {
  const profile = buildTeachingProfile(scores);
  return {
    message: `Your profile is ready. Ada will begin with ${approachText[profile.primaryDimension]} and ${approachText[profile.secondaryDimension]}.`,
  };
}

export function isTutorHandoff(value: unknown): value is TutorHandoff {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).message === "string";
}
