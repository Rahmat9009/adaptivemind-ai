import { z } from "zod";
import type {
  ExplainBackEvaluation,
  HintResponse,
  TutorFollowUpResponse,
  TutorLesson,
  TutorRequest,
  UnderstandingEvaluation,
} from "@/lib/ai/types";

export const tutorActions = [
  "initial",
  "simpler",
  "different",
  "example",
  "challenge",
  "followup",
  "evaluate",
  "explain-back",
  "retrieval-check",
  "hint",
  "review",
] as const;

export const teachingModes = [
  "adaptive",
  "visual",
  "example",
  "analogy",
  "story",
  "challenge",
] as const;

export const responseSources = [
  "live-primary",
  "live-fallback",
  "local-fallback",
] as const;

const learningDimensionSchema = z.enum([
  "visual",
  "examples",
  "analogies",
  "stories",
  "challenges",
]);

const learningScoresSchema = z.object({
  visual: z.number().finite().min(0).max(100),
  examples: z.number().finite().min(0).max(100),
  analogies: z.number().finite().min(0).max(100),
  stories: z.number().finite().min(0).max(100),
  challenges: z.number().finite().min(0).max(100),
}).strict();

const conversationMessageSchema = z.object({
  id: z.string().trim().min(1).max(80),
  role: z.enum(["student", "tutor"]),
  content: z.string().trim().min(1).max(500),
  createdAt: z.string().trim().min(1).max(40),
}).strict();

const lessonSummarySchema = z.object({
  title: z.string().trim().min(1).max(160),
  coreIdea: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(360),
  stylesUsed: z.array(learningDimensionSchema).max(5),
}).strict();

export const tutorRequestSchema = z.object({
  requestId: z.string().trim().min(8).max(100).optional(),
  topic: z.string().trim().min(2).max(160),
  subject: z.string().trim().max(50).default("General learning"),
  level: z.string().trim().max(50).default("General"),
  scores: learningScoresSchema,
  action: z.enum(tutorActions),
  teachingMode: z.enum(teachingModes),
  previousStyles: z.array(learningDimensionSchema).max(5).optional(),
  previousTeachingMode: z.enum(teachingModes).optional(),
  previousTitle: z.string().trim().max(160).optional(),
  previousExplanation: z.string().trim().max(360).optional(),
  question: z.string().trim().max(500).optional(),
  currentLesson: lessonSummarySchema.optional(),
  conversation: z.array(conversationMessageSchema).max(8).optional(),
  learnerAnswer: z.string().trim().max(1_000).optional(),
  checkQuestion: z.string().trim().max(500).optional(),
  lessonCoreIdea: z.string().trim().max(500).optional(),
  lessonContext: z.string().trim().max(4_000).optional(),
  learnerResponse: z.string().trim().max(1_000).optional(),
  currentHintLevel: z.number().int().min(0).max(3).optional(),
  challengeContext: z.string().trim().max(2_000).optional(),
  reviewSkillId: z.string().trim().max(100).optional(),
}).strict().superRefine((value, context) => {
  const requireText = (
    field: keyof typeof value,
    message: string,
  ) => {
    if (typeof value[field] !== "string" || value[field].trim().length === 0) {
      context.addIssue({
        code: "custom",
        path: [field],
        message,
      });
    }
  };

  if (value.action === "followup") {
    requireText("question", "A follow-up question is required.");
    if (!value.currentLesson) {
      context.addIssue({
        code: "custom",
        path: ["currentLesson"],
        message: "The active lesson is required for a follow-up.",
      });
    }
  }

  if (value.action === "evaluate" || value.action === "retrieval-check") {
    requireText("learnerAnswer", "A learner answer is required.");
    requireText("checkQuestion", "A check question is required.");
    requireText("lessonCoreIdea", "The lesson core idea is required.");
  }

  if (value.action === "explain-back") {
    requireText("learnerResponse", "The learner explanation is required.");
    requireText("lessonContext", "The lesson context is required.");
  }

  if (value.action === "hint") {
    requireText("lessonContext", "The lesson context is required.");
  }

  if (value.action === "review") {
    requireText("reviewSkillId", "A review skill is required.");
  }

  const conversationLength = value.conversation?.reduce(
    (total, message) => total + message.content.length,
    0,
  ) ?? 0;
  if (conversationLength > 2_400) {
    context.addIssue({
      code: "custom",
      path: ["conversation"],
      message: "Conversation context is too large.",
    });
  }
});

const compactString = z.string().trim().min(1).max(4_000);
const shortString = z.string().trim().min(1).max(800);

export const tutorLessonSchema = z.object({
  title: z.string().trim().min(1).max(160),
  coreIdea: compactString,
  explanation: compactString,
  clarificationQuestion: shortString.optional(),
  example: compactString.optional(),
  analogy: compactString.optional(),
  challenge: compactString.optional(),
  hint: shortString.optional(),
  practicePrompt: shortString.optional(),
  keyPoints: z.array(shortString).min(1).max(6),
  checkQuestion: shortString,
  stylesUsed: z.array(learningDimensionSchema).min(1).max(5),
}).strict();

export const tutorFollowUpSchema = z.object({
  answer: compactString,
  keyPoint: shortString.optional(),
  example: compactString.optional(),
  analogy: compactString.optional(),
  checkQuestion: shortString.optional(),
  stylesUsed: z.array(learningDimensionSchema).min(1).max(5),
}).strict();

const aiConfidenceSchema = z.enum([
  "high",
  "moderate",
  "uncertain",
  "verification-recommended",
]);

export const understandingEvaluationSchema = z.object({
  status: z.enum(["correct", "partial", "misconception", "uncertain"]),
  score: z.number().finite().int().min(0).max(100),
  feedback: shortString,
  whatWasUnderstood: z.array(shortString).max(4),
  needsReview: z.array(shortString).max(4),
  misconception: shortString.optional(),
  nextStep: z.enum(["continue", "clarify", "simplify", "example", "retry"]),
  followUpQuestion: shortString.optional(),
  stylesUsed: z.array(learningDimensionSchema).max(5),
  evaluationConfidence: aiConfidenceSchema.optional(),
  evidenceFromAnswer: shortString.optional(),
  confidenceInsight: shortString.optional(),
}).strict().superRefine((value, context) => {
  const inconsistent = (
    (value.status === "correct" && value.score < 70)
    || (value.status === "partial" && (value.score < 30 || value.score > 89))
    || (value.status === "misconception" && value.score > 69)
    || (value.status === "uncertain" && value.score > 60)
  );
  if (inconsistent) {
    context.addIssue({
      code: "custom",
      path: ["score"],
      message: "The 0-100 score must be consistent with the evaluation status.",
    });
  }
});

export const explainBackEvaluationSchema = z.object({
  isComplete: z.boolean(),
  understood: z.array(shortString).max(6),
  missing: z.array(shortString).max(6),
  misconception: shortString.optional(),
  followUpQuestion: shortString.optional(),
  score: z.number().finite().min(0).max(100),
  stylesUsed: z.array(learningDimensionSchema).max(5),
  aiConfidence: aiConfidenceSchema,
}).strict().superRefine((value, context) => {
  if (value.isComplete && value.score < 70) {
    context.addIssue({
      code: "custom",
      path: ["score"],
      message: "A complete explanation needs a score of at least 70 out of 100.",
    });
  }
});

export const hintResponseSchema = z.object({
  hints: z.tuple([shortString, shortString, shortString, compactString]),
  stylesUsed: z.array(learningDimensionSchema).max(5),
}).strict();

export function parseTutorRequest(value: unknown):
  | { success: true; data: TutorRequest & { requestId?: string } }
  | { success: false; message: string } {
  const parsed = tutorRequestSchema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid tutor request.",
    };
  }

  return {
    success: true,
    data: {
      ...parsed.data,
      subject: parsed.data.subject || "General learning",
      level: parsed.data.level || "General",
    } as TutorRequest & { requestId?: string },
  };
}

export function parseTutorLesson(value: unknown): TutorLesson | null {
  const parsed = tutorLessonSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseTutorFollowUp(value: unknown): TutorFollowUpResponse | null {
  const parsed = tutorFollowUpSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseUnderstandingEvaluation(value: unknown): UnderstandingEvaluation | null {
  const parsed = understandingEvaluationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseExplainBackEvaluation(value: unknown): ExplainBackEvaluation | null {
  const parsed = explainBackEvaluationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseHintResponse(value: unknown): HintResponse | null {
  const parsed = hintResponseSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export type AdaResponseSource = (typeof responseSources)[number];
