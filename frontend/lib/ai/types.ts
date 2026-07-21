import type { LearningDimension, LearningScores } from "@/lib/learning-dna";

// ──────────────────────────────────────
// Core actions
// ──────────────────────────────────────

export type TutorAction =
  | "initial"
  | "simpler"
  | "different"
  | "example"
  | "challenge"
  | "followup"
  | "evaluate"
  | "explain-back"
  | "retrieval-check"
  | "hint"
  | "review";

export type TeachingMode =
  | "adaptive"
  | "visual"
  | "example"
  | "analogy"
  | "story"
  | "challenge";

// ──────────────────────────────────────
// AI Uncertainty
// ──────────────────────────────────────

export type AIConfidence = "high" | "moderate" | "uncertain" | "verification-recommended";

// ──────────────────────────────────────
// New structured lesson response
// ──────────────────────────────────────

export interface LessonObjective {
  what: string;
  prerequisites?: string[];
  estimatedMinutes: number;
}

export interface PrerequisiteCheck {
  question: string;
  passed: boolean | null;
  gap?: string;
}

export interface ExplanationBlock {
  content: string;
  approach: LearningDimension;
  type: "direct" | "analogy" | "story" | "example" | "visual";
  aiConfidence: AIConfidence;
}

export interface WorkedExampleStep {
  step: number;
  instruction: string;
  detail: string;
  isInteractive?: boolean;
}

export interface WorkedExample {
  problem: string;
  steps: WorkedExampleStep[];
  fadingLevel: "full" | "partial" | "independent";
  commonMistake?: string;
}

export interface RetrievalCheck {
  type: "recall" | "application" | "transfer" | "misconception-correction" | "explain-back";
  skill: string;
  question: string;
  sentenceStarter?: string;
  expectedConcepts: string[];
}

export interface HintLadderData {
  nudge: string;
  direction: string;
  scaffold: string;
  fullSolution: string;
}

export interface TutorLessonV2 {
  topic: string;
  objective: LessonObjective;
  prerequisiteCheck?: PrerequisiteCheck | null;
  selectedApproaches: LearningDimension[];
  selectionReason: string;
  aiConfidence: AIConfidence;
  explanation: ExplanationBlock | null;
  workedExample?: WorkedExample | null;
  analogy?: string | null;
  story?: string | null;
  challenge?: {
    scenario: string;
    hintLadder: HintLadderData;
    checkQuestion: string;
  } | null;
  misconceptions: string[];
  retrievalCheck: RetrievalCheck | null;
  suggestedNextActions: string[];
  stylesUsed: LearningDimension[];
}

// ──────────────────────────────────────
// Legacy types (preserved for backward compat)
// ──────────────────────────────────────

export type UnderstandingStatus =
  | "correct"
  | "partial"
  | "misconception"
  | "uncertain";

export type UnderstandingNextStep =
  | "continue"
  | "clarify"
  | "simplify"
  | "example"
  | "retry";

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
  /** New: AI uncertainty on this evaluation */
  evaluationConfidence?: AIConfidence;
  /** New: evidence from the learner's answer */
  evidenceFromAnswer?: string;
  /** New: whether learner was over/underconfident */
  confidenceInsight?: string;
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
  action: Exclude<TutorAction, "followup" | "evaluate" | "explain-back" | "retrieval-check" | "hint" | "review">;
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

// ──────────────────────────────────────
// Explain Back types
// ──────────────────────────────────────

export interface ExplainBackRequest {
  topic: string;
  subject: string;
  level: string;
  scores: LearningScores;
  teachingMode: TeachingMode;
  learnerResponse: string;
  lessonContext: string;
}

export interface ExplainBackEvaluation {
  isComplete: boolean;
  understood: string[];
  missing: string[];
  misconception?: string;
  followUpQuestion?: string;
  score: number;
  stylesUsed: LearningDimension[];
  aiConfidence: AIConfidence;
}

export interface ExplainBackApiResponse {
  evaluation: ExplainBackEvaluation;
  source: "provider" | "demo";
  teachingMode: TeachingMode;
  action: "explain-back";
}

// ──────────────────────────────────────
// Hint generation types
// ──────────────────────────────────────

export interface HintRequest {
  topic: string;
  subject: string;
  level: string;
  scores: LearningScores;
  teachingMode: TeachingMode;
  currentLevel: number;
  lessonContext: string;
  challengeContext?: string;
}

export interface HintResponse {
  hints: [string, string, string, string]; // nudge, direction, scaffold, full
  stylesUsed: LearningDimension[];
}

// ──────────────────────────────────────
// TutorRequest (extended)
// ──────────────────────────────────────

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
  /** For explain-back */
  learnerResponse?: string;
  /** For hint generation */
  currentHintLevel?: number;
  /** For review */
  reviewSkillId?: string;
}
