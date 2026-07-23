import "server-only";

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
  buildEvaluationSystemPrompt,
  buildExplainBackPrompt,
  buildFollowUpSystemPrompt,
  buildHintPrompt,
  buildTutorSystemPrompt,
} from "./prompts";
import {
  explainBackEvaluationSchema,
  hintResponseSchema,
  tutorFollowUpSchema,
  tutorLessonSchema,
  understandingEvaluationSchema,
} from "./schemas";
import {
  AdaError,
  MAX_PROVIDER_RESPONSE_BYTES,
  parseRetryAfterMs,
  PROVIDER_TIMEOUT_MS,
} from "./safety";
import { parseProviderJson } from "./validation";

export type ProviderRole = "primary" | "fallback";

export interface ProviderConfig {
  role: ProviderRole;
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ProviderEnvelope {
  choices?: Array<{ message?: { content?: unknown } }>;
}

export interface ProviderResult<T> {
  data: T;
  role: ProviderRole;
}

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_NETWORK_ATTEMPTS = 2;
const MAX_RETRY_DELAY_MS = 2_000;

function getProviderConfig(role: ProviderRole): ProviderConfig | null {
  const prefix = role === "primary" ? "AI" : "AI_FALLBACK";
  const apiKey = process.env[`${prefix}_API_KEY`]?.trim();
  const baseUrl = process.env[`${prefix}_BASE_URL`]?.trim();
  const model = process.env[`${prefix}_MODEL`]?.trim();
  if (!apiKey || !baseUrl || !model) return null;
  return { role, apiKey, baseUrl, model };
}

export function getConfiguredProviders(): ProviderConfig[] {
  return ([
    getProviderConfig("primary"),
    getProviderConfig("fallback"),
  ] satisfies Array<ProviderConfig | null>).filter(
    (provider): provider is ProviderConfig => provider !== null,
  );
}

function abortError(): DOMException {
  return new DOMException("The request was aborted.", "AbortError");
}

async function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw abortError();
  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(abortError());
    }, { once: true });
  });
}

function retryDelay(attempt: number): number {
  const exponential = 300 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 150);
  return Math.min(MAX_RETRY_DELAY_MS, exponential + jitter);
}

function providerErrorFromResponse(response: Response): AdaError {
  if (response.status === 429) {
    return new AdaError({
      code: "PROVIDER_RATE_LIMITED",
      message: "Ada is receiving too many requests right now. Wait briefly, then try again.",
      status: 429,
      retryable: true,
      retryAfterMs: parseRetryAfterMs(response),
      upstreamStatus: response.status,
    });
  }

  if (response.status === 400) {
    return new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada's live service rejected the request format. Please try again.",
      status: 502,
      retryable: false,
      upstreamStatus: response.status,
    });
  }

  if (response.status === 401 || response.status === 403) {
    return new AdaError({
      code: "PROVIDER_UNAVAILABLE",
      message: "Ada's live service credentials were rejected. Check the server configuration.",
      status: 503,
      retryable: false,
      upstreamStatus: response.status,
    });
  }

  if (response.status === 404) {
    return new AdaError({
      code: "PROVIDER_UNAVAILABLE",
      message: "Ada's configured AI model or endpoint is unavailable.",
      status: 503,
      retryable: false,
      upstreamStatus: response.status,
    });
  }

  return new AdaError({
    code: "PROVIDER_UNAVAILABLE",
    message: "Ada's live service is temporarily unavailable. Your previous lesson is still available.",
    status: 502,
    retryable: RETRYABLE_STATUSES.has(response.status),
    upstreamStatus: response.status,
  });
}

async function fetchCompletion(
  provider: ProviderConfig,
  prompt: string,
  temperature: number,
  signal?: AbortSignal,
  imageDataUrls: string[] = [],
): Promise<string> {
  let lastError: AdaError | null = null;

  for (let attempt = 0; attempt < MAX_NETWORK_ATTEMPTS; attempt += 1) {
    if (signal?.aborted) throw abortError();
    const timeoutController = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const onAbort = () => timeoutController.abort();
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      const fetchPromise = fetch(
          `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${provider.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: provider.model,
              messages: [
                { role: "system", content: prompt },
                {
                  role: "user",
                  content: imageDataUrls.length
                    ? [
                        {
                          type: "text",
                          text: "Complete the requested Ada action using the attached educational images where relevant, and return only the required JSON object.",
                        },
                        ...imageDataUrls.map((url) => ({
                          type: "image_url",
                          image_url: { url },
                        })),
                      ]
                    : "Complete the requested Ada action and return only the required JSON object.",
                },
              ],
              response_format: { type: "json_object" },
              temperature,
            }),
            cache: "no-store",
            signal: timeoutController.signal,
          },
      );
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new AdaError({
            code: "PROVIDER_TIMEOUT",
            message: "Ada took too long to respond. Your previous lesson is still available.",
            status: 504,
            retryable: true,
          }));
          timeoutController.abort();
        }, PROVIDER_TIMEOUT_MS);
      });
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const providerError = providerErrorFromResponse(response);
        lastError = providerError;
        const retryAfterMs = providerError.retryAfterMs;
        const canRetry = attempt + 1 < MAX_NETWORK_ATTEMPTS
          && providerError.retryable
          && (retryAfterMs === undefined || retryAfterMs <= MAX_RETRY_DELAY_MS);
        if (!canRetry) throw providerError;
        await delay(retryAfterMs ?? retryDelay(attempt), signal);
        continue;
      }

      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > MAX_PROVIDER_RESPONSE_BYTES) {
        throw new AdaError({
          code: "PROVIDER_RESPONSE_INVALID",
          message: "Ada received an unexpectedly large response. Please try a narrower topic.",
          status: 502,
          retryable: true,
        });
      }

      const responseText = await response.text();
      if (responseText.length > MAX_PROVIDER_RESPONSE_BYTES) {
        throw new AdaError({
          code: "PROVIDER_RESPONSE_INVALID",
          message: "Ada received an unexpectedly large response. Please try a narrower topic.",
          status: 502,
          retryable: true,
        });
      }

      let envelope: ProviderEnvelope;
      try {
        envelope = JSON.parse(responseText) as ProviderEnvelope;
      } catch {
        throw new AdaError({
          code: "PROVIDER_RESPONSE_INVALID",
          message: "Ada received an unreadable response. Please try again.",
          status: 502,
          retryable: true,
        });
      }

      const content = envelope.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new AdaError({
          code: "PROVIDER_RESPONSE_INVALID",
          message: "Ada received an incomplete response. Please try again.",
          status: 502,
          retryable: true,
        });
      }
      return content;
    } catch (error) {
      if (signal?.aborted) throw abortError();
      if (error instanceof AdaError) throw error;
      lastError = new AdaError({
        code: "PROVIDER_UNAVAILABLE",
        message: "Ada's live service could not be reached. Please try again.",
        status: 502,
        retryable: true,
      });
      if (attempt + 1 >= MAX_NETWORK_ATTEMPTS) throw lastError;
      await delay(retryDelay(attempt), signal);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  throw lastError ?? new AdaError({
    code: "PROVIDER_UNAVAILABLE",
    message: "Ada's live service could not complete this request.",
    status: 502,
    retryable: true,
  });
}

async function generateStructured<T>(
  provider: ProviderConfig,
  prompt: string,
  schema: z.ZodType<T>,
  temperature: number,
  signal?: AbortSignal,
  imageDataUrls: string[] = [],
): Promise<T> {
  const content = await fetchCompletion(
    provider,
    prompt,
    temperature,
    signal,
    imageDataUrls,
  );
  const parsed = parseProviderJson(content, schema);
  if (parsed) return parsed;

  const repairPrompt = `${prompt}

Your previous response did not match the required JSON schema. Return only one valid JSON object matching the exact requested shape. Do not add markdown or commentary.`;
  const repairedContent = await fetchCompletion(
    provider,
    repairPrompt,
    Math.min(temperature, 0.2),
    signal,
    imageDataUrls,
  );
  const repaired = parseProviderJson(repairedContent, schema);
  if (repaired) return repaired;

  throw new AdaError({
    code: "PROVIDER_RESPONSE_INVALID",
    message: "Ada received malformed lesson data twice. Please try again.",
    status: 502,
    retryable: true,
  });
}

function sourceImages(request: TutorRequest): string[] {
  return request.sources?.flatMap((source) =>
    source.imageDataUrl ? [source.imageDataUrl] : [],
  ) ?? [];
}

function validateSourceGrounding<
  T extends TutorLesson | TutorFollowUpResponse,
>(response: T, request: TutorRequest): T {
  const sources = request.sources ?? [];
  if (!sources.length) return response;
  if (!response.sourceGrounding) {
    throw new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada's response did not identify how it used the attached source.",
      status: 502,
      retryable: true,
    });
  }

  const allowed = new Map(
    sources.map((source) => [
      source.id,
      new Set([
        ...source.sections.map((section) => section.label),
        ...(source.url ? [source.url] : []),
      ]),
    ]),
  );
  const hasInvalidStatement = response.sourceGrounding.statements.some(
    (statement) => {
      const references = allowed.get(statement.sourceId);
      return !references
        || !statement.reference
        || !references.has(statement.reference);
    },
  );
  if (
    hasInvalidStatement
    || (
      request.sourceMode === "source-only"
      && response.sourceGrounding.outsideKnowledgeUsed
    )
  ) {
    throw new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada's source citations did not match the attached material.",
      status: 502,
      retryable: true,
    });
  }

  return response;
}

export async function generateProviderLesson(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
): Promise<TutorLesson> {
  if (!["initial", "simpler", "different", "example", "challenge"].includes(request.action)) {
    throw new AdaError({
      code: "INVALID_REQUEST",
      message: "That Ada action cannot generate a lesson.",
      status: 400,
    });
  }

  const prompt = buildTutorSystemPrompt({
    ...request,
    action: request.action as "initial" | "simpler" | "different" | "example" | "challenge",
  });
  const lesson = await generateStructured(
    provider,
    prompt,
    tutorLessonSchema,
    0.6,
    signal,
    sourceImages(request),
  );
  return validateSourceGrounding(lesson, request);
}

export async function generateProviderFollowUp(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
): Promise<TutorFollowUpResponse> {
  const followUp = await generateStructured(
    provider,
    buildFollowUpSystemPrompt(request),
    tutorFollowUpSchema,
    0.5,
    signal,
    sourceImages(request),
  );
  return validateSourceGrounding(followUp, request);
}

export async function generateProviderEvaluation(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
): Promise<UnderstandingEvaluation> {
  return generateStructured(
    provider,
    buildEvaluationSystemPrompt(request),
    understandingEvaluationSchema,
    0.2,
    signal,
  );
}

export async function generateProviderExplainBack(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
): Promise<ExplainBackEvaluation> {
  return generateStructured(
    provider,
    buildExplainBackPrompt({
      topic: request.topic,
      subject: request.subject,
      level: request.level,
      scores: request.scores,
      teachingMode: request.teachingMode,
      learnerResponse: request.learnerResponse ?? "",
      lessonContext: request.lessonContext ?? "",
      adaptationContext: request.adaptationContext,
      learnerPreferences: request.learnerPreferences,
    }),
    explainBackEvaluationSchema,
    0.2,
    signal,
  );
}

export async function generateProviderHint(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
): Promise<HintResponse> {
  return generateStructured(
    provider,
    buildHintPrompt({
      topic: request.topic,
      subject: request.subject,
      level: request.level,
      scores: request.scores,
      teachingMode: request.teachingMode,
      currentLevel: request.currentHintLevel ?? 0,
      lessonContext: request.lessonContext ?? "",
      challengeContext: request.challengeContext,
      adaptationContext: request.adaptationContext,
      learnerPreferences: request.learnerPreferences,
    }),
    hintResponseSchema,
    0.4,
    signal,
  );
}
