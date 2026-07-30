import { z } from "zod";

const usableQuizText = z.string().trim().min(1).max(1_000);

const multipleChoiceQuestionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: z.literal("multiple-choice"),
  prompt: usableQuizText,
  options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  correctOptionIndex: z.number().int().nonnegative(),
  explanation: usableQuizText,
}).strict().superRefine((question, context) => {
  if (question.correctOptionIndex >= question.options.length) {
    context.addIssue({
      code: "custom",
      path: ["correctOptionIndex"],
      message: "The correct option index must point to an available option.",
    });
  }

  const normalized = question.options.map((option) => option.toLocaleLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    context.addIssue({
      code: "custom",
      path: ["options"],
      message: "Multiple-choice options must be unique.",
    });
  }
});

const shortAnswerQuestionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: z.literal("short-answer"),
  prompt: usableQuizText,
  modelAnswer: usableQuizText,
  guidance: usableQuizText,
}).strict();

export const GeneratedQuizSchema = z.object({
  title: z.string().trim().min(1).max(160),
  topic: z.string().trim().min(1).max(500),
  questions: z.array(z.discriminatedUnion("type", [
    multipleChoiceQuestionSchema,
    shortAnswerQuestionSchema,
  ])).min(1).max(10),
}).strict().superRefine((quiz, context) => {
  const ids = quiz.questions.map((question) => question.id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: "custom",
      path: ["questions"],
      message: "Question IDs must be unique.",
    });
  }
});

export type GeneratedQuiz = z.infer<typeof GeneratedQuizSchema>;
export type QuizQuestion = GeneratedQuiz["questions"][number];

export function requestedQuizCount(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10 ? parsed : 5;
}

export function validateGeneratedQuiz(
  value: unknown,
  expectedQuestionCount?: number,
):
  | { success: true; data: GeneratedQuiz }
  | { success: false; error: z.ZodError } {
  const parsed = GeneratedQuizSchema.safeParse(value);
  if (!parsed.success || expectedQuestionCount === undefined) return parsed;
  if (parsed.data.questions.length === expectedQuestionCount) return parsed;

  return {
    success: false,
    error: new z.ZodError([{
      code: "custom",
      path: ["questions"],
      message: `Expected ${expectedQuestionCount} questions but received ${parsed.data.questions.length}.`,
    }]),
  };
}
