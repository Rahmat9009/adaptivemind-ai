import {
  learningDimensionLabels,
  learningDimensions,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
import type { TutorAction } from "@/lib/ai/types";

export interface TeachingProfile {
  dominantDimensions: LearningDimension[];
  primaryDimension: LearningDimension;
  secondaryDimension: LearningDimension;
  profileNote: string;
}

export function getDominantDimensions(scores: LearningScores): LearningDimension[] {
  return [...learningDimensions].sort((first, second) => scores[second] - scores[first]);
}

export function buildTeachingProfile(scores: LearningScores): TeachingProfile {
  const dominantDimensions = getDominantDimensions(scores);
  const [primaryDimension, secondaryDimension] = dominantDimensions;

  return {
    dominantDimensions,
    primaryDimension,
    secondaryDimension,
    profileNote: `Based on the student's current assessment preferences, emphasize ${learningDimensionLabels[primaryDimension]} and ${learningDimensionLabels[secondaryDimension]}.`,
  };
}

export function buildTutorSystemPrompt({
  topic,
  subject,
  level,
  scores,
  action,
}: {
  topic: string;
  subject: string;
  level: string;
  scores: LearningScores;
  action: TutorAction;
}): string {
  const profile = buildTeachingProfile(scores);
  const actionInstruction: Record<TutorAction, string> = {
    initial: "Teach the topic clearly and use the two dominant preferences naturally.",
    simpler: "Reduce complexity, use short sentences, and keep the explanation compact.",
    different: `Explain from a fresh angle, leaning more on ${learningDimensionLabels[profile.dominantDimensions[2]]} and ${learningDimensionLabels[profile.dominantDimensions[3]]} than the dominant pair.`,
    example: "Center the lesson on one concrete, worked real-world example.",
    challenge: "Open with a thought-provoking question and end with a short reasoning challenge. Do not reveal the challenge answer.",
  };

  return `You are AdaptiveMind AI, a careful educational tutor. Create one structured lesson about "${topic}" for a ${level} learner studying ${subject}.

${profile.profileNote}
${actionInstruction[action]}

Do not claim that these preferences are scientific facts about the student's brain. Use calm, direct language. Return only valid JSON with this exact shape:
{
  "title": "string",
  "coreIdea": "string",
  "explanation": "string",
  "example": "string or omitted",
  "analogy": "string or omitted",
  "keyPoints": ["string", "string", "string"],
  "checkQuestion": "string",
  "stylesUsed": ["visual" | "examples" | "analogies" | "stories" | "challenges"]
}`;
}
