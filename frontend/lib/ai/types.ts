import type { LearningDimension, LearningScores } from "@/lib/learning-dna";

export type TutorAction = "initial" | "simpler" | "different" | "example" | "challenge";

export interface TutorRequest {
  topic: string;
  subject: string;
  level: string;
  scores: LearningScores;
  action: TutorAction;
}

export interface TutorLesson {
  title: string;
  coreIdea: string;
  explanation: string;
  example?: string;
  analogy?: string;
  keyPoints: string[];
  checkQuestion: string;
  stylesUsed: LearningDimension[];
}

export interface TutorApiResponse {
  lesson: TutorLesson;
  source: "provider" | "demo";
}
