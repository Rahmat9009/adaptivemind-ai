import { z } from "zod";
import type {
  ExplainBackEvaluation,
  HintResponse,
  TutorFollowUpResponse,
  TutorLesson,
  TutorRequest,
  UnderstandingEvaluation,
} from "@/lib/ai/types";
import {
  MAX_PROMPT_SOURCE_CHARACTERS,
  MAX_SOURCE_COUNT,
  MAX_TOTAL_IMAGE_DATA_URL_CHARACTERS,
} from "@/lib/sources";

export const tutorActions = [
  "initial",
  "simpler",
  "different",
  "example",
  "challenge",
  "visualize",
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

const learnerPreferenceItemSchema = z.string().trim().min(1).max(80);
const learnerPreferencesSchema = z.object({
  detailPreference: z.enum(["concise", "moderate", "thorough"]),
  conciseStories: z.boolean(),
  startChallengesEasy: z.boolean(),
  likedDomains: z.array(learnerPreferenceItemSchema).max(20),
  bannedDomains: z.array(learnerPreferenceItemSchema).max(20),
  dislikedPatterns: z.array(learnerPreferenceItemSchema).max(20),
}).strict();

const adaptationContextSchema = z.object({
  recommendedApproach: learningDimensionSchema,
  recommendationReason: z.string().trim().min(1).max(500),
  evidenceCount: z.number().int().min(0).max(10_000),
  confidence: z.number().finite().min(0).max(100),
}).strict();

const sourceTypeSchema = z.enum([
  "pdf",
  "docx",
  "pptx",
  "txt",
  "markdown",
  "image",
  "website",
]);

const sourceSectionSchema = z.object({
  label: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(8_000),
}).strict();

const tutorSourceSchema = z.object({
  id: z.string().trim().min(8).max(100),
  title: z.string().trim().min(1).max(160),
  type: sourceTypeSchema,
  mimeType: z.string().trim().min(1).max(120),
  size: z.number().int().positive().max(10 * 1024 * 1024).optional(),
  url: z.string().url().max(2_048).optional(),
  domain: z.string().trim().min(1).max(255).optional(),
  sections: z.array(sourceSectionSchema).max(40),
  imageDataUrl: z.string()
    .regex(/^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/)
    .max(1_500_000)
    .optional(),
  extractionNote: z.string().trim().min(1).max(300).optional(),
}).strict().superRefine((source, context) => {
  if (source.type === "image" && !source.imageDataUrl) {
    context.addIssue({
      code: "custom",
      path: ["imageDataUrl"],
      message: "An image source needs image data.",
    });
  }
  if (source.type !== "image" && source.imageDataUrl) {
    context.addIssue({
      code: "custom",
      path: ["imageDataUrl"],
      message: "Only image sources may include image data.",
    });
  }
  if (source.type === "website" && (!source.url || !source.domain)) {
    context.addIssue({
      code: "custom",
      path: ["url"],
      message: "A website source needs its original URL and domain.",
    });
  }
});

const sourceGroundingSchema = z.object({
  statements: z.array(z.object({
    statement: z.string().trim().min(1).max(800),
    sourceId: z.string().trim().min(1).max(100),
    reference: z.string().trim().min(1).max(2_048).optional(),
  }).strict()).max(8),
  outsideKnowledgeUsed: z.boolean(),
}).strict();

const visualStepSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/),
  label: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(500),
  x: z.number().finite().min(0).max(100).optional(),
  y: z.number().finite().min(0).max(100).optional(),
  group: z.string().trim().min(1).max(60).optional(),
}).strict();

const visualConnectionSchema = z.object({
  from: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/),
  to: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/),
  label: z.string().trim().min(1).max(80).optional(),
}).strict();

const visualGraphPointSchema = z.object({
  x: z.number().finite().min(-1_000_000).max(1_000_000),
  y: z.number().finite().min(-1_000_000).max(1_000_000),
  label: z.string().trim().min(1).max(80).optional(),
}).strict();

export const visualLessonSchema = z.object({
  type: z.enum([
    "process",
    "cycle",
    "timeline",
    "comparison",
    "flowchart",
    "graph",
    "labeled-diagram",
    "step-sequence",
    "cause-effect",
    "simulation",
  ]),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(800),
  steps: z.array(visualStepSchema).max(12).default([]),
  connections: z.array(visualConnectionSchema).max(20).default([]),
  columns: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    items: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
  }).strict()).max(4).default([]),
  series: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    points: z.array(visualGraphPointSchema).min(2).max(30),
  }).strict()).max(4).default([]),
  xAxisLabel: z.string().trim().min(1).max(80).optional(),
  yAxisLabel: z.string().trim().min(1).max(80).optional(),
  captions: z.array(z.string().trim().min(1).max(300)).min(1).max(12),
  predictionCheckpoints: z.array(z.object({
    stepId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/),
    question: z.string().trim().min(1).max(300),
  }).strict()).max(4).default([]),
  simulation: z.object({
    inputLabel: z.string().trim().min(1).max(80),
    outputLabel: z.string().trim().min(1).max(80),
    min: z.number().finite().min(-100_000).max(100_000),
    max: z.number().finite().min(-100_000).max(100_000),
    step: z.number().finite().positive().max(100_000),
    initial: z.number().finite().min(-100_000).max(100_000),
    unit: z.string().trim().min(1).max(20).optional(),
    formula: z.enum(["linear", "inverse", "quadratic"]),
    coefficient: z.number().finite().min(-100_000).max(100_000),
    offset: z.number().finite().min(-100_000).max(100_000),
  }).strict().optional(),
  textAlternative: z.string().trim().min(1).max(4_000),
}).strict().superRefine((visual, context) => {
  const ids = new Set<string>();
  for (const [index, step] of visual.steps.entries()) {
    if (ids.has(step.id)) {
      context.addIssue({
        code: "custom",
        path: ["steps", index, "id"],
        message: "Visual step IDs must be unique.",
      });
    }
    ids.add(step.id);
    if (
      visual.type === "labeled-diagram"
      && (step.x === undefined || step.y === undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["steps", index],
        message: "Labeled diagram steps need bounded x and y positions.",
      });
    }
  }

  for (const [index, connection] of visual.connections.entries()) {
    if (!ids.has(connection.from) || !ids.has(connection.to)) {
      context.addIssue({
        code: "custom",
        path: ["connections", index],
        message: "Visual connections must reference existing step IDs.",
      });
    }
  }
  for (const [index, checkpoint] of visual.predictionCheckpoints.entries()) {
    if (!ids.has(checkpoint.stepId)) {
      context.addIssue({
        code: "custom",
        path: ["predictionCheckpoints", index, "stepId"],
        message: "Prediction checkpoints must reference an existing step.",
      });
    }
  }

  if (visual.type === "comparison" && visual.columns.length < 2) {
    context.addIssue({
      code: "custom",
      path: ["columns"],
      message: "A comparison needs at least two columns.",
    });
  } else if (visual.type === "graph" && visual.series.length < 1) {
    context.addIssue({
      code: "custom",
      path: ["series"],
      message: "A graph needs at least one data series.",
    });
  } else if (visual.type === "simulation") {
    const simulation = visual.simulation;
    if (!simulation) {
      context.addIssue({
        code: "custom",
        path: ["simulation"],
        message: "A simulation needs bounded input and formula data.",
      });
    } else {
      if (
        simulation.min >= simulation.max
        || simulation.initial < simulation.min
        || simulation.initial > simulation.max
      ) {
        context.addIssue({
          code: "custom",
          path: ["simulation"],
          message: "Simulation bounds and initial value are inconsistent.",
        });
      }
      if (
        simulation.formula === "inverse"
        && simulation.min <= 0
        && simulation.max >= 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["simulation", "min"],
          message: "An inverse simulation range cannot cross zero.",
        });
      }
    }
  } else if (visual.steps.length < 2) {
    context.addIssue({
      code: "custom",
      path: ["steps"],
      message: "This visual type needs at least two steps or nodes.",
    });
  }
});

export const tutorRequestSchema = z.object({
  requestId: z.string().trim().min(8).max(100).optional(),
  topic: z.string().trim().min(2).max(500),
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
  learnerConfidence: z.number().finite().min(0).max(100).optional(),
  adaptationContext: adaptationContextSchema.optional(),
  learnerPreferences: learnerPreferencesSchema.optional(),
  sources: z.array(tutorSourceSchema).max(MAX_SOURCE_COUNT).optional(),
  sourceMode: z.enum(["source-only", "source-plus-background"]).optional(),
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

  const sourceCharacters = value.sources?.reduce(
    (total, source) => total + source.sections.reduce(
      (sectionTotal, section) => sectionTotal + section.content.length,
      0,
    ),
    0,
  ) ?? 0;
  if (sourceCharacters > MAX_PROMPT_SOURCE_CHARACTERS) {
    context.addIssue({
      code: "custom",
      path: ["sources"],
      message: "The extracted source context is too large.",
    });
  }

  const imageCharacters = value.sources?.reduce(
    (total, source) => total + (source.imageDataUrl?.length ?? 0),
    0,
  ) ?? 0;
  if (imageCharacters > MAX_TOTAL_IMAGE_DATA_URL_CHARACTERS) {
    context.addIssue({
      code: "custom",
      path: ["sources"],
      message: "The attached images are too large.",
    });
  }

  if (value.sources?.length && !value.sourceMode) {
    context.addIssue({
      code: "custom",
      path: ["sourceMode"],
      message: "Choose how Ada may use attached sources.",
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
  sourceGrounding: sourceGroundingSchema.optional(),
  visual: visualLessonSchema.optional(),
}).strict();

export const tutorFollowUpSchema = z.object({
  answer: compactString,
  keyPoint: shortString.optional(),
  example: compactString.optional(),
  analogy: compactString.optional(),
  checkQuestion: shortString.optional(),
  stylesUsed: z.array(learningDimensionSchema).min(1).max(5),
  sourceGrounding: sourceGroundingSchema.optional(),
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
