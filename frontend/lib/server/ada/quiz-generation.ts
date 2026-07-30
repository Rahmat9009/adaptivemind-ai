import type { GeneratedQuiz, TutorRequest } from "@/lib/ai/types";
import {
  GeneratedQuizSchema,
  requestedQuizCount,
  validateGeneratedQuiz,
} from "@/lib/ai/generated-quiz";
import { AdaError } from "./safety";
import { buildQuizPrompt, buildQuizRepairPrompt } from "./prompts";
import { extractJsonCandidates } from "./validation";

export interface QuizInspection {
  data: GeneratedQuiz | null;
  issues: string[];
}

function normalizeStrings(value: unknown): unknown {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(normalizeStrings);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, normalizeStrings(nested)]),
  );
}

export function normalizeGeneratedQuizCandidate(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }
  const record = value as Record<string, unknown>;
  const candidate = typeof record.quiz === "object" && record.quiz !== null
    ? record.quiz
    : value;
  return normalizeStrings(candidate);
}

export function inspectGeneratedQuiz(
  content: string,
  expectedQuestionCount: number,
): QuizInspection {
  const issues: string[] = [];
  for (const candidate of extractJsonCandidates(content)) {
    try {
      const normalized = normalizeGeneratedQuizCandidate(JSON.parse(candidate));
      const parsed = validateGeneratedQuiz(normalized, expectedQuestionCount);
      if (parsed.success) return { data: parsed.data, issues: [] };
      for (const issue of parsed.error.issues) {
        const path = issue.path.length ? issue.path.join(".") : "response";
        issues.push(`${path}: ${issue.message}`);
      }
    } catch {
      issues.push("response: not valid JSON");
    }
  }
  return { data: null, issues: [...new Set(issues)].slice(0, 12) };
}

const safeDiagnosticKeys = new Set([
  "title",
  "topic",
  "quiz",
  "quizTitle",
  "description",
  "questions",
  "id",
  "type",
  "prompt",
  "question",
  "options",
  "correctOptionIndex",
  "correctAnswer",
  "answer",
  "explanation",
  "modelAnswer",
  "guidance",
]);

function redactValue(value: unknown): unknown {
  if (typeof value === "string") return "[redacted]";
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested], index) => [
    safeDiagnosticKeys.has(key) ? key : `[redacted-key-${index + 1}]`,
    redactValue(nested),
  ]));
}

export function redactProviderOutput(content: string): string {
  for (const candidate of extractJsonCandidates(content)) {
    try {
      return JSON.stringify(redactValue(JSON.parse(candidate))).slice(0, 12_000);
    } catch {
      // Try the next candidate before returning an opaque marker.
    }
  }
  return `[redacted non-JSON response; characters=${content.length}]`;
}

export async function generateQuizWithRepair({
  request,
  complete,
  onInvalid,
  onPromptBuilt,
}: {
  request: TutorRequest;
  complete: (prompt: string, attempt: "initial" | "repair") => Promise<string>;
  onInvalid?: (details: {
    attempt: "initial" | "repair";
    issues: string[];
    redactedOutput: string;
  }) => void;
  onPromptBuilt?: (durationMs: number) => void;
}): Promise<GeneratedQuiz> {
  const expectedQuestionCount = requestedQuizCount(request.question);
  const firstPromptStartedAt = performance.now();
  const firstPrompt = buildQuizPrompt(request);
  onPromptBuilt?.(performance.now() - firstPromptStartedAt);
  const firstContent = await complete(firstPrompt, "initial");
  const first = inspectGeneratedQuiz(firstContent, expectedQuestionCount);
  if (first.data) return first.data;
  onInvalid?.({
    attempt: "initial",
    issues: first.issues,
    redactedOutput: redactProviderOutput(firstContent),
  });

  const repairPromptStartedAt = performance.now();
  const repairPrompt = buildQuizRepairPrompt({
    request,
    malformedOutput: firstContent,
    issues: first.issues,
  });
  onPromptBuilt?.(performance.now() - repairPromptStartedAt);
  const repairedContent = await complete(repairPrompt, "repair");
  const repaired = inspectGeneratedQuiz(repairedContent, expectedQuestionCount);
  if (repaired.data) return repaired.data;
  onInvalid?.({
    attempt: "repair",
    issues: repaired.issues,
    redactedOutput: redactProviderOutput(repairedContent),
  });

  throw new AdaError({
    code: "QUIZ_SCHEMA_INVALID_AFTER_REPAIR",
    message: "Ada couldn’t prepare this quiz correctly. Try generating it again.",
    status: 502,
    retryable: false,
  });
}

export function createDeterministicFallbackQuiz(request: TutorRequest): GeneratedQuiz {
  const count = requestedQuizCount(request.question);
  const coreIdea = request.currentLesson?.coreIdea?.trim()
    || `${request.topic} is the focus of this lesson.`;
  const explanation = request.currentLesson?.explanation?.trim() || coreIdea;
  const lessonTitle = request.currentLesson?.title?.trim() || request.topic;
  const supportedStatements = [
    coreIdea,
    explanation,
    `The lesson is about ${lessonTitle}.`,
  ].map((statement) => statement.slice(0, 300));

  const questions = Array.from({ length: count }, (_, index) => {
    const correct = supportedStatements[index % supportedStatements.length];
    const distractorCandidates = [
      `The lesson says ${request.topic} has no practical or conceptual use.`,
      `The lesson treats ${request.topic} as unrelated to its central idea.`,
      `The lesson concludes that no explanation of ${request.topic} is possible.`,
      "This claim is not supported anywhere in the current lesson.",
    ].map((option) => option.slice(0, 300));
    const distractors = distractorCandidates.filter((option, candidateIndex, options) => {
      const normalized = option.toLocaleLowerCase();
      return normalized !== correct.toLocaleLowerCase()
        && options.findIndex((candidate) => candidate.toLocaleLowerCase() === normalized)
          === candidateIndex;
    }).slice(0, 3);
    const correctOptionIndex = index % 4;
    const options = [...distractors];
    options.splice(correctOptionIndex, 0, correct);
    return {
      id: `fallback-${index + 1}`,
      type: "multiple-choice" as const,
      prompt: index % 2 === 0
        ? `Which statement is supported by the current lesson on ${request.topic}?`
        : `Which option best matches the lesson’s explanation of ${request.topic}?`,
      options,
      correctOptionIndex,
      explanation: `The supported answer comes directly from the current lesson: ${correct}`,
    };
  });

  return GeneratedQuizSchema.parse({
    title: `${lessonTitle.slice(0, 140)} knowledge check`,
    topic: request.topic,
    questions,
  });
}
