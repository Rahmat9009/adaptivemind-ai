import type { TutorFollowUpResponse, TutorLesson, TutorRequest } from "./types";
import { buildFollowUpSystemPrompt, buildTutorSystemPrompt } from "@/lib/adaptive-prompt";
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

function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? content;
  return JSON.parse(candidate);
}

export async function createProviderLesson(request: TutorRequest): Promise<TutorLesson | null> {
  if (request.action === "followup") return null;
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) return null;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildTutorSystemPrompt({ ...request, action: request.action as Exclude<TutorRequest["action"], "followup"> }) },
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

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
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
