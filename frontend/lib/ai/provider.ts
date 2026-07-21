import type { TutorFollowUpResponse, TutorLesson, TutorRequest, UnderstandingEvaluation, ExplainBackEvaluation, HintResponse } from "./types";
import {
  buildEvaluationSystemPrompt,
  buildExplainBackPrompt,
  buildFollowUpSystemPrompt,
  buildHintPrompt,
  buildTutorSystemPrompt,
} from "@/lib/adaptive-prompt";
import { learningDimensions, type LearningDimension } from "@/lib/learning-dna";

interface ProviderResponse {
  choices?: Array<{ message?: { content?: unknown } }>;
}

function isLearningDimension(value: unknown): value is LearningDimension {
  return typeof value === "string" && learningDimensions.includes(value as LearningDimension);
}

export function parseTutorLesson(value: unknown): TutorLesson | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.title !== "string" ||
    typeof record.coreIdea !== "string" ||
    typeof record.explanation !== "string" ||
    !Array.isArray(record.keyPoints) ||
    !record.keyPoints.every((point) => typeof point === "string") ||
    typeof record.checkQuestion !== "string" ||
    !Array.isArray(record.stylesUsed) ||
    !record.stylesUsed.every(isLearningDimension)
  ) {
    return null;
  }

  return {
    title: record.title,
    coreIdea: record.coreIdea,
    explanation: record.explanation,
    example: typeof record.example === "string" ? record.example : undefined,
    analogy: typeof record.analogy === "string" ? record.analogy : undefined,
    challenge: typeof record.challenge === "string" ? record.challenge : undefined,
    hint: typeof record.hint === "string" ? record.hint : undefined,
    practicePrompt: typeof record.practicePrompt === "string" ? record.practicePrompt : undefined,
    keyPoints: record.keyPoints,
    checkQuestion: record.checkQuestion,
    stylesUsed: record.stylesUsed,
  };
}

export function parseTutorFollowUp(value: unknown): TutorFollowUpResponse | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.answer !== "string" ||
    !Array.isArray(record.stylesUsed) ||
    !record.stylesUsed.every(isLearningDimension)
  ) {
    return null;
  }

  return {
    answer: record.answer,
    keyPoint: typeof record.keyPoint === "string" ? record.keyPoint : undefined,
    example: typeof record.example === "string" ? record.example : undefined,
    analogy: typeof record.analogy === "string" ? record.analogy : undefined,
    checkQuestion: typeof record.checkQuestion === "string" ? record.checkQuestion : undefined,
    stylesUsed: record.stylesUsed,
  };
}

export function parseUnderstandingEvaluation(value: unknown): UnderstandingEvaluation | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const validStatus = record.status === "correct" || record.status === "partial" || record.status === "misconception" || record.status === "uncertain";
  const validNext = record.nextStep === "continue" || record.nextStep === "clarify" || record.nextStep === "simplify" || record.nextStep === "example" || record.nextStep === "retry";
  if (!validStatus || !validNext || typeof record.score !== "number" || !Number.isInteger(record.score) || record.score < 0 || record.score > 100 || typeof record.feedback !== "string" || !Array.isArray(record.whatWasUnderstood) || !record.whatWasUnderstood.every((item) => typeof item === "string") || !Array.isArray(record.needsReview) || !record.needsReview.every((item) => typeof item === "string") || !Array.isArray(record.stylesUsed) || !record.stylesUsed.every(isLearningDimension)) return null;

  const validAIConfidence = record.evaluationConfidence === "high" || record.evaluationConfidence === "moderate" || record.evaluationConfidence === "uncertain" || record.evaluationConfidence === "verification-recommended";

  return {
    status: record.status as UnderstandingEvaluation["status"],
    score: record.score,
    feedback: record.feedback,
    whatWasUnderstood: record.whatWasUnderstood.slice(0, 4),
    needsReview: record.needsReview.slice(0, 4),
    misconception: typeof record.misconception === "string" ? record.misconception : undefined,
    nextStep: record.nextStep as UnderstandingEvaluation["nextStep"],
    followUpQuestion: typeof record.followUpQuestion === "string" ? record.followUpQuestion : undefined,
    stylesUsed: record.stylesUsed,
    evaluationConfidence: validAIConfidence ? record.evaluationConfidence as UnderstandingEvaluation["evaluationConfidence"] : undefined,
    evidenceFromAnswer: typeof record.evidenceFromAnswer === "string" ? record.evidenceFromAnswer : undefined,
    confidenceInsight: typeof record.confidenceInsight === "string" ? record.confidenceInsight : undefined,
  };
}

function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? content;
  return JSON.parse(candidate);
}

const AI_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs = AI_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function createProviderLesson(request: TutorRequest): Promise<TutorLesson | null> {
  if (request.action === "followup" || request.action === "evaluate" || request.action === "explain-back" || request.action === "retrieval-check" || request.action === "hint" || request.action === "review") return null;
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) return null;

  const response = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildTutorSystemPrompt({ ...request, action: request.action as Exclude<TutorRequest["action"], "followup" | "evaluate" | "explain-back" | "retrieval-check" | "hint" | "review"> }) },
        { role: "user", content: `Teach me: ${request.topic}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    throw new Error("The lesson provider could not complete this request.");
  }

  const providerResponse = await response.json() as ProviderResponse;
  const content = providerResponse.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("The lesson provider returned an unexpected response.");
  }

  try {
    return parseTutorLesson(extractJson(content));
  } catch {
    throw new Error("The lesson provider returned malformed lesson data.");
  }
}

export async function createProviderFollowUp(request: TutorRequest): Promise<TutorFollowUpResponse | null> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) return null;

  const response = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: buildFollowUpSystemPrompt(request) }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    }),
  });

  if (!response.ok) throw new Error("The lesson provider could not answer this follow-up.");
  const providerResponse = await response.json() as ProviderResponse;
  const content = providerResponse.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("The lesson provider returned an unexpected follow-up response.");

  try {
    return parseTutorFollowUp(extractJson(content));
  } catch {
    throw new Error("The lesson provider returned malformed follow-up data.");
  }
}

export async function createProviderEvaluation(request: TutorRequest): Promise<UnderstandingEvaluation | null> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) return null;

  const response = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: buildEvaluationSystemPrompt(request) }], response_format: { type: "json_object" }, temperature: 0.2 }),
  });

  if (!response.ok) throw new Error("The lesson provider could not evaluate this answer.");
  const providerResponse = await response.json() as ProviderResponse;
  const content = providerResponse.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("The lesson provider returned an unexpected evaluation.");

  try {
    return parseUnderstandingEvaluation(extractJson(content));
  } catch {
    throw new Error("The lesson provider returned malformed evaluation data.");
  }
}

// ──────────────────────────────────────
// Explain Back provider
// ──────────────────────────────────────

export function parseExplainBackEvaluation(value: unknown): ExplainBackEvaluation | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.isComplete !== "boolean" || typeof record.score !== "number") return null;
  if (!Array.isArray(record.understood) || !record.understood.every((item: unknown) => typeof item === "string")) return null;
  if (!Array.isArray(record.missing) || !record.missing.every((item: unknown) => typeof item === "string")) return null;
  if (!Array.isArray(record.stylesUsed) || !record.stylesUsed.every(isLearningDimension)) return null;

  const validAIConfidence = record.aiConfidence === "high" || record.aiConfidence === "moderate" || record.aiConfidence === "uncertain" || record.aiConfidence === "verification-recommended";

  return {
    isComplete: record.isComplete,
    understood: record.understood,
    missing: record.missing,
    misconception: typeof record.misconception === "string" ? record.misconception : undefined,
    followUpQuestion: typeof record.followUpQuestion === "string" ? record.followUpQuestion : undefined,
    score: record.score,
    stylesUsed: record.stylesUsed,
    aiConfidence: validAIConfidence ? record.aiConfidence as ExplainBackEvaluation["aiConfidence"] : "moderate",
  };
}

export async function createProviderExplainBack(request: {
  topic: string;
  subject: string;
  level: string;
  scores: import("@/lib/learning-dna").LearningScores;
  teachingMode: import("./types").TeachingMode;
  learnerResponse: string;
  lessonContext: string;
}): Promise<ExplainBackEvaluation | null> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) return null;

  const response = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: buildExplainBackPrompt(request) }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error("The lesson provider could not evaluate this explanation.");
  const providerResponse = await response.json() as ProviderResponse;
  const content = providerResponse.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("The lesson provider returned an unexpected response.");

  try {
    return parseExplainBackEvaluation(extractJson(content));
  } catch {
    throw new Error("The lesson provider returned malformed explain-back data.");
  }
}

// ──────────────────────────────────────
// Hint generation provider
// ──────────────────────────────────────

export function parseHintResponse(value: unknown): HintResponse | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.hints) || record.hints.length !== 4 || !record.hints.every((h: unknown) => typeof h === "string")) return null;
  if (!Array.isArray(record.stylesUsed) || !record.stylesUsed.every(isLearningDimension)) return null;

  return {
    hints: record.hints as [string, string, string, string],
    stylesUsed: record.stylesUsed,
  };
}

export async function createProviderHint(request: {
  topic: string;
  subject: string;
  level: string;
  scores: import("@/lib/learning-dna").LearningScores;
  teachingMode: import("./types").TeachingMode;
  currentLevel: number;
  lessonContext: string;
  challengeContext?: string;
}): Promise<HintResponse | null> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) return null;

  const response = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: buildHintPrompt(request) }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });

  if (!response.ok) throw new Error("The lesson provider could not generate a hint.");
  const providerResponse = await response.json() as ProviderResponse;
  const content = providerResponse.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("The lesson provider returned an unexpected response.");

  try {
    return parseHintResponse(extractJson(content));
  } catch {
    throw new Error("The lesson provider returned malformed hint data.");
  }
}
