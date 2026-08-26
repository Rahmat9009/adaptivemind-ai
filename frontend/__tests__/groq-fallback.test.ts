/**
 * Groq emergency fallback routing.
 *
 * Mocks the HTTP provider boundary (global fetch). No real API calls are
 * made and no real keys are used.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TutorRequest } from "@/lib/ai/types";

const GEMINI_HOST = "generativelanguage.googleapis.com";
const GROQ_HOST = "api.groq.com";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

/** Calls recorded per provider host, in order. */
let calls: string[] = [];

function hostOf(input: unknown): string {
  const url = typeof input === "string" ? input : String(input);
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A minimal lesson that satisfies the authoritative Zod lesson schema. */
function lessonPayload() {
  return {
    title: "Binary search",
    coreIdea: "Binary search halves a sorted range on every comparison.",
    explanation:
      "Binary search inspects the middle element of a sorted range and discards the half that cannot contain the target, repeating until the range is empty.",
    keyPoints: ["Requires sorted input", "Halves the range each step"],
    checkQuestion: "Why must the input be sorted?",
    stylesUsed: ["examples"],
  };
}

function quizPayload() {
  return {
    title: "Binary search check",
    topic: "Binary search",
    questions: [
      {
        id: "q1",
        type: "multiple-choice",
        prompt: "What must be true of the input?",
        options: ["It is sorted", "It is reversed", "It is empty"],
        correctOptionIndex: 0,
        explanation: "Binary search relies on ordering to discard a half.",
      },
    ],
  };
}

/** Wrap a payload in the OpenAI chat-completions envelope. */
function completion(payload: unknown): Response {
  return jsonResponse({
    choices: [{ message: { content: JSON.stringify(payload) } }],
  });
}

function lessonRequest(overrides: Partial<TutorRequest> = {}): TutorRequest {
  return {
    topic: "Binary search",
    subject: "Computer science",
    level: "High school",
    scores: {
      visual: 50,
      examples: 70,
      analogies: 50,
      stories: 40,
      challenges: 40,
    },
    action: "initial",
    teachingMode: "adaptive",
    ...overrides,
  } as TutorRequest;
}

/** A lesson request grounded in a YouTube source. */
function youtubeRequest(): TutorRequest {
  return lessonRequest({
    sources: [
      {
        id: "src-1",
        type: "youtube",
        title: "Binary search explained",
        mimeType: "video/youtube",
        url: "https://www.youtube.com/watch?v=abcdefghijk",
        sections: [],
      },
    ],
  });
}

/**
 * Route responses by provider host.
 * `gemini` and `groq` are response factories or "network-error".
 */
function mockProviders({
  gemini,
  groq,
}: {
  gemini: () => Response | "network-error";
  groq?: () => Response | "network-error";
}) {
  globalThis.fetch = vi.fn(async (input: unknown) => {
    const host = hostOf(input);
    calls.push(host);
    const handler = host === GROQ_HOST ? groq : gemini;
    if (!handler) throw new Error(`Unexpected provider host: ${host}`);
    const result = handler();
    if (result === "network-error") throw new TypeError("fetch failed");
    return result;
  }) as unknown as typeof fetch;
}

function geminiCalls(): number {
  return calls.filter((host) => host === GEMINI_HOST).length;
}

function groqCalls(): number {
  return calls.filter((host) => host === GROQ_HOST).length;
}

beforeEach(() => {
  calls = [];
  vi.resetModules();
  process.env.AI_API_KEY = "test-primary-key";
  process.env.AI_BASE_URL = `https://${GEMINI_HOST}/v1beta/openai`;
  process.env.AI_MODEL = "gemini-flash-latest";
  delete process.env.AI_FALLBACK_API_KEY;
  delete process.env.AI_FALLBACK_BASE_URL;
  delete process.env.AI_FALLBACK_MODEL;
  process.env.GROQ_API_KEY = "test-groq-key";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

async function orchestrate(request: TutorRequest) {
  const { orchestrateAda } = await import("@/lib/server/ada/orchestrator");
  return orchestrateAda(request);
}

describe("provider configuration", () => {
  it("registers Gemini first and Groq last", async () => {
    const { getConfiguredProviders } = await import(
      "@/lib/server/ada/providers"
    );
    const providers = getConfiguredProviders();
    expect(providers.map((p) => p.name)).toEqual(["gemini", "groq"]);
    expect(providers[0].role).toBe("primary");
  });

  it("omits Groq entirely when GROQ_API_KEY is absent", async () => {
    delete process.env.GROQ_API_KEY;
    const { getConfiguredProviders } = await import(
      "@/lib/server/ada/providers"
    );
    const providers = getConfiguredProviders();
    expect(providers.map((p) => p.name)).toEqual(["gemini"]);
  });

  it("asks Groq for a plain JSON object and allows only one attempt", async () => {
    const { getConfiguredProviders } = await import(
      "@/lib/server/ada/providers"
    );
    const groq = getConfiguredProviders().find((p) => p.name === "groq")!;
    expect(groq.structuredOutput).toBe("json-object");
    expect(groq.singleAttempt).toBe(true);
    expect(groq.baseUrl).toBe("https://api.groq.com/openai/v1");
    expect(groq.model).toBe("openai/gpt-oss-120b");
  });

  it("keeps strict JSON schema for the primary provider", async () => {
    const { getConfiguredProviders } = await import(
      "@/lib/server/ada/providers"
    );
    const gemini = getConfiguredProviders().find((p) => p.name === "gemini")!;
    expect(gemini.structuredOutput).toBe("json-schema");
    expect(gemini.singleAttempt).toBe(false);
  });
});

describe("Gemini succeeds", () => {
  it("returns the Gemini result without calling Groq", async () => {
    mockProviders({ gemini: () => completion(lessonPayload()) });

    const result = await orchestrate(lessonRequest());

    expect("lesson" in result && result.lesson.title).toBe("Binary search");
    expect(result.source).toBe("live-primary");
    expect(geminiCalls()).toBe(1);
    expect(groqCalls()).toBe(0);
  });
});

describe("Gemini fails with a retryable provider error", () => {
  for (const status of [429, 500, 502, 503, 504]) {
    it(`falls back to Groq exactly once on HTTP ${status}`, async () => {
      mockProviders({
        gemini: () => jsonResponse({ error: "upstream" }, status),
        groq: () => completion(lessonPayload()),
      });

      const result = await orchestrate(lessonRequest());

      expect("lesson" in result && result.lesson.title).toBe("Binary search");
      expect(result.source).toBe("live-fallback");
      expect(groqCalls()).toBe(1);
    });
  }

  it("falls back to Groq once on a network failure", async () => {
    mockProviders({
      gemini: () => "network-error",
      groq: () => completion(lessonPayload()),
    });

    const result = await orchestrate(lessonRequest());

    expect("lesson" in result).toBe(true);
    expect(groqCalls()).toBe(1);
  });

  it("never loops back to Gemini after trying Groq", async () => {
    mockProviders({
      gemini: () => jsonResponse({ error: "upstream" }, 503),
      groq: () => completion(lessonPayload()),
    });

    await orchestrate(lessonRequest());

    // Exactly: Gemini, the pre-existing Gemini network retry, then Groq once.
    // Never gemini -> groq -> gemini -> groq.
    expect(calls).toEqual([GEMINI_HOST, GEMINI_HOST, GROQ_HOST]);
    expect(groqCalls()).toBe(1);
    expect(calls.slice(calls.indexOf(GROQ_HOST))).toEqual([GROQ_HOST]);
  });

  it("bounds the whole sequence to two providers and three attempts", async () => {
    mockProviders({
      gemini: () => "network-error",
      groq: () => completion(lessonPayload()),
    });

    await orchestrate(lessonRequest());

    expect(new Set(calls).size).toBe(2);
    expect(calls.length).toBeLessThanOrEqual(3);
    expect(groqCalls()).toBe(1);
  });
});

describe("Gemini fails with a non-retryable error", () => {
  it("does not call Groq on HTTP 401 credentials rejection", async () => {
    mockProviders({
      gemini: () => jsonResponse({ error: "unauthorized" }, 401),
      groq: () => completion(lessonPayload()),
    });

    await expect(orchestrate(lessonRequest())).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    });
    expect(groqCalls()).toBe(0);
  });

  it("does not call Groq when our own request is rejected (HTTP 400)", async () => {
    mockProviders({
      gemini: () => jsonResponse({ error: "bad request" }, 400),
      groq: () => completion(lessonPayload()),
    });

    await expect(orchestrate(lessonRequest())).rejects.toMatchObject({
      code: "PROVIDER_RESPONSE_INVALID",
    });
    expect(groqCalls()).toBe(0);
  });

  it("does not call Groq for an invalid application action", async () => {
    mockProviders({
      gemini: () => completion(lessonPayload()),
      groq: () => completion(lessonPayload()),
    });

    await expect(
      orchestrate(lessonRequest({ action: "review" })),
    ).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    expect(groqCalls()).toBe(0);
    expect(geminiCalls()).toBe(0);
  });
});

describe("both providers fail", () => {
  it("returns the existing safe learner-facing error", async () => {
    mockProviders({
      gemini: () => jsonResponse({ error: "upstream" }, 503),
      groq: () => jsonResponse({ error: "upstream" }, 503),
    });

    await expect(orchestrate(lessonRequest())).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    });
    // Groq is attempted once and the sequence stops. No cross-provider loop.
    expect(groqCalls()).toBe(1);
    expect(calls).toEqual([GEMINI_HOST, GEMINI_HOST, GROQ_HOST]);
  });
});

describe("missing GROQ_API_KEY", () => {
  it("leaves Gemini behaviour unchanged on success", async () => {
    delete process.env.GROQ_API_KEY;
    mockProviders({ gemini: () => completion(lessonPayload()) });

    const result = await orchestrate(lessonRequest());

    expect(result.source).toBe("live-primary");
    expect(geminiCalls()).toBe(1);
    expect(groqCalls()).toBe(0);
  });

  it("surfaces the existing error when Gemini fails and Groq is absent", async () => {
    delete process.env.GROQ_API_KEY;
    mockProviders({ gemini: () => jsonResponse({ error: "upstream" }, 503) });

    await expect(orchestrate(lessonRequest())).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    });
    expect(groqCalls()).toBe(0);
  });
});

describe("quiz schema stays authoritative", () => {
  const quizRequest = () =>
    lessonRequest({
      action: "generate-quiz",
      question: "1",
      currentLesson: {
        title: "Binary search",
        coreIdea: "Halve the sorted range each step.",
        explanation: "Inspect the middle element and discard one half.",
        stylesUsed: ["examples"],
      },
    });

  it("accepts Groq output only after GeneratedQuiz validation", async () => {
    mockProviders({
      gemini: () => jsonResponse({ error: "upstream" }, 503),
      groq: () => completion(quizPayload()),
    });

    const result = await orchestrate(quizRequest());

    expect("quiz" in result && result.quiz.questions).toHaveLength(1);
    expect("quizProvenance" in result && result.quizProvenance).toBe("remote");
    expect(groqCalls()).toBe(1);
  });

  it("rejects malformed Groq quiz output instead of passing it through", async () => {
    mockProviders({
      gemini: () => jsonResponse({ error: "upstream" }, 503),
      // correctOptionIndex points outside options — must not validate.
      groq: () =>
        completion({
          title: "Bad quiz",
          topic: "Binary search",
          questions: [
            {
              id: "q1",
              type: "multiple-choice",
              prompt: "What?",
              options: ["a", "b"],
              correctOptionIndex: 7,
              explanation: "nope",
            },
          ],
        }),
    });

    const result = await orchestrate(quizRequest());

    // Falls back to the deterministic quiz rather than shipping bad data.
    expect("quizProvenance" in result && result.quizProvenance).toBe(
      "deterministic-fallback",
    );
  });
});

describe("YouTube stays off Groq", () => {
  it("does not redirect video requests to the text fallback", async () => {
    mockProviders({
      gemini: () => jsonResponse({ error: "upstream" }, 503),
      groq: () => completion(lessonPayload()),
    });

    await expect(orchestrate(youtubeRequest())).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    });
    // Video refusal is non-retryable, so the orchestrator stops rather than
    // handing a video request to the text-only fallback.
    expect(groqCalls()).toBe(0);
    expect(calls).toEqual([GEMINI_HOST]);
  });

  it("does not report Groq as contacted when a video request fails", async () => {
    mockProviders({
      gemini: () => jsonResponse({ error: "upstream" }, 503),
      groq: () => completion(lessonPayload()),
    });

    const { AdaTelemetry } = await import("@/lib/server/ada/telemetry");
    const { orchestrateAda } = await import("@/lib/server/ada/orchestrator");
    const telemetry = new AdaTelemetry();

    await expect(
      orchestrateAda(youtubeRequest(), undefined, telemetry),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });

    const snapshot = telemetry.snapshot();
    // Only Gemini was actually contacted, so only Gemini may be reported.
    expect(calls).toEqual([GEMINI_HOST]);
    expect(snapshot.providerCalls).toBe(1);
    expect(snapshot.providerName).toBe("gemini");
    expect(snapshot.fallbackUsed).toBe(false);
  });

  it("still reports Groq when it is genuinely contacted for text", async () => {
    mockProviders({
      gemini: () => jsonResponse({ error: "upstream" }, 503),
      groq: () => completion(lessonPayload()),
    });

    const { AdaTelemetry } = await import("@/lib/server/ada/telemetry");
    const { orchestrateAda } = await import("@/lib/server/ada/orchestrator");
    const telemetry = new AdaTelemetry();

    await orchestrateAda(lessonRequest(), undefined, telemetry);

    const snapshot = telemetry.snapshot();
    expect(groqCalls()).toBe(1);
    expect(snapshot.providerName).toBe("groq");
    expect(snapshot.fallbackUsed).toBe(true);
  });
});
