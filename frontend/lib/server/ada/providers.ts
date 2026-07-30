import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type {
  ExplainBackEvaluation,
  HintResponse,
  TutorFollowUpResponse,
  TutorLesson,
  TutorLessonAction,
  TutorRequest,
  UnderstandingEvaluation,
  GeneratedQuiz,
} from "@/lib/ai/types";
import {
  GeneratedQuizSchema,
  requestedQuizCount,
} from "@/lib/ai/generated-quiz";
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
  tutorTextLessonSchema,
  understandingEvaluationSchema,
} from "./schemas";
import {
  AdaError,
  MAX_PROVIDER_RESPONSE_BYTES,
  parseRetryAfterMs,
  PROVIDER_TIMEOUT_MS,
  VIDEO_PROVIDER_TIMEOUT_MS,
} from "./safety";
import { inspectProviderJson } from "./validation";
import {
  generateQuizWithRepair,
} from "./quiz-generation";
import type { AdaTelemetry } from "./telemetry";
import {
  createNativeMediaParts,
  type ProviderMedia,
} from "./provider-media";

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

function providerErrorFromStatus(
  status: number,
  retryAfterMs?: number,
): AdaError {
  if (status === 429) {
    return new AdaError({
      code: "PROVIDER_RATE_LIMITED",
      message: "Ada is receiving too many requests right now. Wait briefly, then try again.",
      status: 429,
      retryable: true,
      retryAfterMs,
      upstreamStatus: status,
    });
  }

  if (status === 400) {
    return new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada's live service rejected the request format. Please try again.",
      status: 502,
      retryable: false,
      upstreamStatus: status,
    });
  }

  if (status === 401 || status === 403) {
    return new AdaError({
      code: "PROVIDER_UNAVAILABLE",
      message: "Ada's live service credentials were rejected. Check the server configuration.",
      status: 503,
      retryable: false,
      upstreamStatus: status,
    });
  }

  if (status === 404) {
    return new AdaError({
      code: "PROVIDER_UNAVAILABLE",
      message: "Ada's configured AI model or endpoint is unavailable.",
      status: 503,
      retryable: false,
      upstreamStatus: status,
    });
  }

  return new AdaError({
    code: "PROVIDER_UNAVAILABLE",
    message: "Ada's live service is temporarily unavailable. Your previous lesson is still available.",
    status: 502,
    retryable: RETRYABLE_STATUSES.has(status),
    upstreamStatus: status,
  });
}

function providerErrorFromResponse(response: Response): AdaError {
  return providerErrorFromStatus(response.status, parseRetryAfterMs(response));
}

function providerStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const status = (error as Record<string, unknown>).status;
  return typeof status === "number" ? status : undefined;
}

const SUPPORTED_GEMINI_SCHEMA_KEYS = new Set([
  "$id",
  "$defs",
  "$ref",
  "$anchor",
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
  "propertyOrdering",
]);

function sanitizeGeminiSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeGeminiSchema);
  if (typeof value !== "object" || value === null) return value;
  const record = value as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(record)) {
    if (key === "~standard" || key === "$schema") continue;
    if (key === "const") {
      sanitized.enum = [nested];
      continue;
    }
    if (!SUPPORTED_GEMINI_SCHEMA_KEYS.has(key)) continue;
    if (key === "properties" || key === "$defs") {
      const definitions = nested as Record<string, unknown>;
      sanitized[key] = Object.fromEntries(
        Object.entries(definitions).map(([name, schema]) => [
          name,
          sanitizeGeminiSchema(schema),
        ]),
      );
      continue;
    }
    sanitized[key] = sanitizeGeminiSchema(nested);
  }
  return sanitized;
}

function geminiJsonSchema<T>(schema: z.ZodType<T>): unknown {
  return sanitizeGeminiSchema(z.toJSONSchema(schema, {
    target: "draft-07",
    unrepresentable: "any",
    reused: "inline",
  }));
}

function isNativeGeminiProvider(provider: ProviderConfig): boolean {
  try {
    return new URL(provider.baseUrl).hostname === "generativelanguage.googleapis.com";
  } catch {
    return false;
  }
}

async function fetchNativeGeminiCompletion<T>({
  provider,
  prompt,
  schema,
  temperature,
  maxOutputTokens,
  timeoutMs,
  media,
  signal,
}: {
  provider: ProviderConfig;
  prompt: string;
  schema: z.ZodType<T>;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  media: ProviderMedia;
  signal: AbortSignal;
}): Promise<string> {
  const client = new GoogleGenAI({
    apiKey: provider.apiKey,
    apiVersion: "v1beta",
    httpOptions: {
      timeout: timeoutMs,
      retryOptions: { attempts: 1 },
    },
  });
  const mediaParts = createNativeMediaParts(media);
  const response = await client.models.generateContent({
    model: provider.model,
    contents: [{
      role: "user",
      parts: [
        ...mediaParts,
        { text: prompt },
      ],
    }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: geminiJsonSchema(schema),
      temperature,
      maxOutputTokens,
      abortSignal: signal,
      httpOptions: {
        timeout: timeoutMs,
        retryOptions: { attempts: 1 },
      },
    },
  });
  const content = response.text;
  if (typeof content !== "string" || !content.trim()) {
    throw new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada received an incomplete response. Please try again.",
      status: 502,
      retryable: false,
    });
  }
  return content;
}

async function fetchOpenAiCompatibleCompletion({
  provider,
  prompt,
  schema,
  temperature,
  maxOutputTokens,
  media,
  signal,
}: {
  provider: ProviderConfig;
  prompt: string;
  schema: z.ZodType<unknown>;
  temperature: number;
  maxOutputTokens: number;
  media: ProviderMedia;
  signal: AbortSignal;
}): Promise<string> {
  if (media.youtubeUrls.length) {
    throw new AdaError({
      code: "PROVIDER_UNAVAILABLE",
      message: "Ada could not process this video right now. Try another public video or upload your notes.",
      status: 502,
      retryable: false,
    });
  }
  const response = await fetch(
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
            content: media.imageDataUrls.length
              ? [
                  {
                    type: "text",
                    text: "Complete the requested Ada action using the attached educational images where relevant, and return only the required JSON object.",
                  },
                  ...media.imageDataUrls.map((url) => ({
                    type: "image_url",
                    image_url: { url },
                  })),
                ]
              : "Complete the requested Ada action and return only the required JSON object.",
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ada_response",
            strict: true,
            schema: geminiJsonSchema(schema),
          },
        },
        temperature,
        max_tokens: maxOutputTokens,
        ...(isNativeGeminiProvider(provider) ? { reasoning_effort: "low" } : {}),
      }),
      cache: "no-store",
      signal,
    },
  );
  if (!response.ok) throw providerErrorFromResponse(response);

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PROVIDER_RESPONSE_BYTES) {
    throw new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada received an unexpectedly large response. Please try a narrower topic.",
      status: 502,
      retryable: false,
    });
  }
  const responseText = await response.text();
  if (responseText.length > MAX_PROVIDER_RESPONSE_BYTES) {
    throw new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada received an unexpectedly large response. Please try a narrower topic.",
      status: 502,
      retryable: false,
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
      retryable: false,
    });
  }
  const content = envelope.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada received an incomplete response. Please try again.",
      status: 502,
      retryable: false,
    });
  }
  return content;
}

async function fetchCompletion(
  provider: ProviderConfig,
  prompt: string,
  schema: z.ZodType<unknown>,
  temperature: number,
  maxOutputTokens: number,
  signal?: AbortSignal,
  media: ProviderMedia = { imageDataUrls: [], youtubeUrls: [] },
  telemetry?: AdaTelemetry,
  repairAttempt = false,
): Promise<string> {
  let lastError: AdaError | null = null;
  const timeoutMs = media.youtubeUrls.length
    ? VIDEO_PROVIDER_TIMEOUT_MS
    : PROVIDER_TIMEOUT_MS;
  const maxAttempts = media.youtubeUrls.length ? 1 : MAX_NETWORK_ATTEMPTS;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) throw abortError();
    const timeoutController = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const onAbort = () => timeoutController.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const isRetry = repairAttempt || attempt > 0;
    telemetry?.providerCall({ retry: isRetry });
    const providerStartedAt = performance.now();

    try {
      const fetchPromise = isNativeGeminiProvider(provider) && media.youtubeUrls.length
        ? fetchNativeGeminiCompletion({
            provider,
            prompt,
            schema,
            temperature,
            maxOutputTokens,
            timeoutMs,
            media,
            signal: timeoutController.signal,
          })
        : fetchOpenAiCompatibleCompletion({
            provider,
            prompt,
            schema,
            temperature,
            maxOutputTokens,
            media,
            signal: timeoutController.signal,
          });
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new AdaError({
            code: "PROVIDER_TIMEOUT",
            message: media.youtubeUrls.length
              ? "Video processing timed out."
              : "Ada took too long to respond. Your previous lesson is still available.",
            status: 504,
            retryable: true,
          }));
          timeoutController.abort();
        }, timeoutMs);
      });
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      if (signal?.aborted) throw abortError();
      lastError = error instanceof AdaError
        ? error
        : providerStatus(error) !== undefined
          ? providerErrorFromStatus(providerStatus(error) as number)
          : new AdaError({
              code: "PROVIDER_UNAVAILABLE",
              message: "Ada's live service could not be reached. Please try again.",
              status: 502,
              retryable: true,
            });
      const retryAfterMs = lastError.retryAfterMs;
      const hasUsableRateLimitDelay = lastError.code !== "PROVIDER_RATE_LIMITED"
        || retryAfterMs !== undefined;
      const canRetry = attempt + 1 < maxAttempts
        && lastError.retryable
        && hasUsableRateLimitDelay
        && (retryAfterMs === undefined || retryAfterMs <= MAX_RETRY_DELAY_MS);
      if (!canRetry) throw lastError;
      const delayStartedAt = performance.now();
      await delay(retryAfterMs ?? retryDelay(attempt), signal);
      telemetry?.add("retry", performance.now() - delayStartedAt);
    } finally {
      const duration = performance.now() - providerStartedAt;
      telemetry?.add("provider", duration);
      if (isRetry) telemetry?.add("retry", duration);
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
  maxOutputTokens: number,
  signal?: AbortSignal,
  media: ProviderMedia = { imageDataUrls: [], youtubeUrls: [] },
  telemetry?: AdaTelemetry,
): Promise<T> {
  const content = await fetchCompletion(
    provider,
    prompt,
    schema as z.ZodType<unknown>,
    temperature,
    maxOutputTokens,
    signal,
    media,
    telemetry,
  );
  const parseStartedAt = performance.now();
  const inspection = inspectProviderJson(content, schema);
  telemetry?.add("parse", performance.now() - parseStartedAt);
  if (inspection.data) return inspection.data;

  throw new AdaError({
    code: "PROVIDER_RESPONSE_INVALID",
    message: "Ada received an invalid structured response. Please try again.",
    status: 502,
    retryable: false,
  });
}

function sourceMedia(request: TutorRequest): ProviderMedia {
  return {
    imageDataUrls: request.sources?.flatMap((source) =>
      source.imageDataUrl ? [source.imageDataUrl] : [],
    ) ?? [],
    youtubeUrls: request.sources?.flatMap((source) =>
      source.type === "youtube" && source.url ? [source.url] : [],
    ) ?? [],
  };
}

function buildTimedPrompt(
  telemetry: AdaTelemetry | undefined,
  factory: () => string,
): string {
  const startedAt = performance.now();
  const prompt = factory();
  telemetry?.add("prompt", performance.now() - startedAt);
  return prompt;
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
      retryable: false,
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
      retryable: false,
    });
  }

  return response;
}

export async function generateProviderLesson(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
  telemetry?: AdaTelemetry,
): Promise<TutorLesson> {
  if (![
    "initial",
    "simpler",
    "different",
    "example",
    "challenge",
    "visualize",
  ].includes(request.action)) {
    throw new AdaError({
      code: "INVALID_REQUEST",
      message: "That Ada action cannot generate a lesson.",
      status: 400,
    });
  }

  const prompt = buildTimedPrompt(telemetry, () => buildTutorSystemPrompt({
      ...request,
      action: request.action as TutorLessonAction,
    }));
  const needsVisual = request.action === "visualize" || request.teachingMode === "visual";
  const lessonSchema: z.ZodType<TutorLesson> = needsVisual
    ? tutorLessonSchema
    : tutorTextLessonSchema;
  const lesson = await generateStructured(
    provider,
    prompt,
    lessonSchema,
    0.6,
    needsVisual ? 4_096 : 2_048,
    signal,
    sourceMedia(request),
    telemetry,
  );
  if (
    (request.action === "visualize" || request.teachingMode === "visual")
    && !lesson.visual
  ) {
    throw new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada's response did not include the requested structured visual.",
      status: 502,
      retryable: false,
    });
  }
  return validateSourceGrounding(lesson, request);
}

export async function generateProviderFollowUp(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
  telemetry?: AdaTelemetry,
): Promise<TutorFollowUpResponse> {
  const followUp = await generateStructured(
    provider,
    buildTimedPrompt(telemetry, () => buildFollowUpSystemPrompt(request)),
    tutorFollowUpSchema,
    0.5,
    1_536,
    signal,
    sourceMedia(request),
    telemetry,
  );
  return validateSourceGrounding(followUp, request);
}

export async function generateProviderEvaluation(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
  telemetry?: AdaTelemetry,
): Promise<UnderstandingEvaluation> {
  return generateStructured(
    provider,
    buildTimedPrompt(telemetry, () => buildEvaluationSystemPrompt(request)),
    understandingEvaluationSchema,
    0.2,
    1_024,
    signal,
    undefined,
    telemetry,
  );
}

export async function generateProviderExplainBack(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
  telemetry?: AdaTelemetry,
): Promise<ExplainBackEvaluation> {
  return generateStructured(
    provider,
    buildTimedPrompt(telemetry, () => buildExplainBackPrompt({
      topic: request.topic,
      subject: request.subject,
      level: request.level,
      scores: request.scores,
      teachingMode: request.teachingMode,
      learnerResponse: request.learnerResponse ?? "",
      lessonContext: request.lessonContext ?? "",
      adaptationContext: request.adaptationContext,
      learnerPreferences: request.learnerPreferences,
    })),
    explainBackEvaluationSchema,
    0.2,
    1_024,
    signal,
    undefined,
    telemetry,
  );
}

export async function generateProviderHint(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
  telemetry?: AdaTelemetry,
): Promise<HintResponse> {
  return generateStructured(
    provider,
    buildTimedPrompt(telemetry, () => buildHintPrompt({
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
    })),
    hintResponseSchema,
    0.4,
    1_024,
    signal,
    undefined,
    telemetry,
  );
}

export async function generateProviderQuiz(
  provider: ProviderConfig,
  request: TutorRequest,
  signal?: AbortSignal,
  telemetry?: AdaTelemetry,
): Promise<GeneratedQuiz> {
  return generateQuizWithRepair({
    request,
    complete: async (prompt, attempt) => {
      return fetchCompletion(
        provider,
        prompt,
        GeneratedQuizSchema as z.ZodType<unknown>,
        attempt === "initial" ? 0.4 : 0.2,
        Math.min(4_096, 768 + requestedQuizCount(request.question) * 420),
        signal,
        sourceMedia(request),
        telemetry,
        attempt === "repair",
      );
    },
    onPromptBuilt: (durationMs) => telemetry?.add("prompt", durationMs),
    onInvalid: ({ attempt, issues, redactedOutput }) => {
      if (process.env.NODE_ENV !== "development") return;
      console.warn(JSON.stringify({
        event: "quiz_schema_invalid",
        code: attempt === "repair"
          ? "QUIZ_SCHEMA_INVALID_AFTER_REPAIR"
          : "QUIZ_SCHEMA_INVALID",
        providerRole: provider.role,
        attempt,
        issues,
        redactedOutput,
      }));
    },
  });
}

const youtubeAnalysisSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(1_200),
  moments: z.array(z.object({
    timestamp: z.string().trim().regex(/^\d{2,}:\d{2}$/),
    description: z.string().trim().min(1).max(300),
  }).strict()).max(8),
}).strict();

export type YouTubeAnalysis = z.infer<typeof youtubeAnalysisSchema>;

export async function analyzePublicYouTubeVideo(
  provider: ProviderConfig,
  canonicalUrl: string,
  signal?: AbortSignal,
): Promise<YouTubeAnalysis> {
  const content = await fetchCompletion(
    provider,
    `Analyze this public educational YouTube video. Return its safely displayable title, a concise factual overview, and up to eight salient moments only when their timestamps are directly supported by the video. Do not produce a transcript, quotations, personal data, or invented timestamps.`,
    youtubeAnalysisSchema as z.ZodType<unknown>,
    0.2,
    1_024,
    signal,
    { imageDataUrls: [], youtubeUrls: [canonicalUrl] },
  );
  const parsed = inspectProviderJson(content, youtubeAnalysisSchema);
  if (parsed.data) return parsed.data;
  throw new AdaError({
    code: "PROVIDER_RESPONSE_INVALID",
    message: "Ada could not process this video right now. Try another public video or upload your notes.",
    status: 502,
    retryable: false,
  });
}
