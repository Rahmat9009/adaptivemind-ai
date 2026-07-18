import type { LearningDimension, LearningScores } from "@/lib/learning-dna";

export type TutorAction = "initial" | "simpler" | "different" | "example" | "challenge" | "followup" | "evaluate";

export type TeachingMode =
  | "adaptive"
  | "visual"
  | "example"
  | "analogy"
  | "story"
  | "challenge";

export interface TutorRequest {
  topic: string;
  subject: string;
  level: string;
  scores: LearningScores;
  action: TutorAction;
  teachingMode: TeachingMode;
  previousStyles?: LearningDimension[];
  previousTeachingMode?: TeachingMode;
  previousTitle?: string;
  previousExplanation?: string;
  question?: string;
  currentLesson?: TutorLessonSummary;
  conversation?: TutorConversationMessage[];
  learnerAnswer?: string;
  checkQuestion?: string;
  lessonCoreIdea?: string;
  lessonContext?: string;
}

export type UnderstandingStatus = "correct" | "partial" | "misconception" | "uncertain";
export type UnderstandingNextStep = "continue" | "clarify" | "simplify" | "example" | "retry";

export interface UnderstandingEvaluation {
  status: UnderstandingStatus;
  score: number;
  feedback: string;
  whatWasUnderstood: string[];
  needsReview: string[];
  misconception?: string;
  nextStep: UnderstandingNextStep;
  followUpQuestion?: string;
  stylesUsed: LearningDimension[];
}

export interface UnderstandingEvaluationApiResponse {
  evaluation: UnderstandingEvaluation;
  source: "provider" | "demo";
  teachingMode: TeachingMode;
  action: "evaluate";
}

export interface TutorLessonSummary {
  title: string;
  coreIdea: string;
  explanation: string;
  stylesUsed: LearningDimension[];
}

export interface TutorConversationMessage {
  id: string;
  role: "student" | "tutor";
  content: string;
  createdAt: string;
}

export interface TutorLesson {
  title: string;
  coreIdea: string;
  explanation: string;
  example?: string;
  analogy?: string;
  challenge?: string;
  hint?: string;
  practicePrompt?: string;
  keyPoints: string[];
  checkQuestion: string;
  stylesUsed: LearningDimension[];
}

export interface TutorApiResponse {
  lesson: TutorLesson;
  source: "provider" | "demo";
  teachingMode: TeachingMode;
  action: Exclude<TutorAction, "followup" | "evaluate">;
}

export interface TutorFollowUpResponse {
  answer: string;
  keyPoint?: string;
  example?: string;
  analogy?: string;
  checkQuestion?: string;
  stylesUsed: LearningDimension[];
}

export interface TutorFollowUpApiResponse {
  followUp: TutorFollowUpResponse;
  source: "provider" | "demo";
  teachingMode: TeachingMode;
  action: "followup";
}

export interface TutorConversationTurn {
  student: TutorConversationMessage;
  tutor: TutorConversationMessage;
  response: TutorFollowUpResponse;
}
