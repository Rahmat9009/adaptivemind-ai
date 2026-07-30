import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GeneratedQuizSchema,
  type GeneratedQuiz,
} from "@/lib/ai/generated-quiz";
import {
  generateQuizWithRepair,
  inspectGeneratedQuiz,
  redactProviderOutput,
  createDeterministicFallbackQuiz,
} from "@/lib/server/ada/quiz-generation";
import {
  clearRequestDedupeForTests,
  deduplicateRequest,
} from "@/lib/server/ada/dedupe";
import { getSafeAdaError } from "@/lib/server/ada/safety";
import { createNativeMediaParts } from "@/lib/server/ada/provider-media";
import {
  normalizeYouTubeUrl,
  youtubeSourceErrorMessage,
} from "@/lib/youtube";
import {
  QuizExperience,
  scoreMultipleChoice,
} from "@/components/tutor/QuizExperience";

const scores = {
  visual: 50,
  examples: 50,
  analogies: 50,
  stories: 50,
  challenges: 50,
};

const validQuiz: GeneratedQuiz = {
  title: "Python check",
  topic: "Python",
  questions: [
    {
      id: "python-1",
      type: "multiple-choice",
      prompt: "Which description best matches Python?",
      options: ["A readable programming language", "A database", "A web browser"],
      correctOptionIndex: 0,
      explanation: "Python is a general-purpose programming language.",
    },
    {
      id: "python-2",
      type: "short-answer",
      prompt: "Name one use for Python.",
      modelAnswer: "Python can automate repetitive tasks.",
      guidance: "Compare whether your response names a concrete programming use.",
    },
  ],
};

const quizRequest = {
  topic: "Python",
  subject: "General learning",
  level: "High school",
  scores,
  action: "generate-quiz" as const,
  teachingMode: "adaptive" as const,
  question: "2",
  currentLesson: {
    title: "Python",
    coreIdea: "Python is a readable general-purpose programming language.",
    explanation: "It is used for automation, web services, and data work.",
    stylesUsed: ["examples" as const],
  },
};

describe("Ada request reliability", () => {
  beforeEach(() => clearRequestDedupeForTests());

  it("one submission causes one provider operation", async () => {
    const provider = vi.fn(async () => "one response");
    await deduplicateRequest("one-submit-request", provider);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("deduplicates simultaneous requests with the same identifier", async () => {
    const provider = vi.fn(async () => "shared response");
    const [first, second] = await Promise.all([
      deduplicateRequest("duplicate-request", provider),
      deduplicateRequest("duplicate-request", provider),
    ]);
    expect(provider).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it("maps cancellation without exposing request content", () => {
    const error = getSafeAdaError(new DOMException("private learner content", "AbortError"));
    expect(error.code).toBe("REQUEST_CANCELLED");
    expect(error.message).not.toContain("private learner content");
  });
});

describe("canonical generated quiz contract", () => {
  it("accepts the canonical quiz schema", () => {
    expect(GeneratedQuizSchema.safeParse(validQuiz).success).toBe(true);
  });

  it("normalizes a harmless quiz wrapper", () => {
    expect(inspectGeneratedQuiz(JSON.stringify({ quiz: validQuiz }), 2).data)
      .toEqual(validQuiz);
  });

  it("rejects a correctOptionIndex outside the options array", () => {
    const invalid = structuredClone(validQuiz);
    const first = invalid.questions[0];
    if (first.type === "multiple-choice") first.correctOptionIndex = 99;
    expect(GeneratedQuizSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects duplicate multiple-choice options", () => {
    const invalid = structuredClone(validQuiz);
    const first = invalid.questions[0];
    if (first.type === "multiple-choice") first.options = ["Same", "same"];
    expect(GeneratedQuizSchema.safeParse(invalid).success).toBe(false);
  });

  it("uses one targeted repair when the first response is invalid", async () => {
    const complete = vi.fn()
      .mockResolvedValueOnce(JSON.stringify({ title: "broken" }))
      .mockResolvedValueOnce(JSON.stringify(validQuiz));
    await expect(generateQuizWithRepair({ request: quizRequest, complete }))
      .resolves.toEqual(validQuiz);
    expect(complete).toHaveBeenCalledTimes(2);
    expect(complete.mock.calls[1][1]).toBe("repair");
  });

  it("returns QUIZ_SCHEMA_INVALID_AFTER_REPAIR after two invalid responses", async () => {
    const complete = vi.fn(async () => JSON.stringify({ title: "still broken" }));
    await expect(generateQuizWithRepair({ request: quizRequest, complete }))
      .rejects.toMatchObject({
        code: "QUIZ_SCHEMA_INVALID_AFTER_REPAIR",
        message: "Ada couldn’t prepare this quiz correctly. Try generating it again.",
      });
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it("redacts learner and provider strings from development diagnostics", () => {
    const redacted = redactProviderOutput(JSON.stringify({
      prompt: "private learner content",
      apiKey: "secret-key-value",
      questions: [{ correctOptionIndex: 8 }],
    }));
    expect(redacted).not.toContain("private learner content");
    expect(redacted).not.toContain("secret-key-value");
    expect(redacted).toContain("[redacted]");
  });

  it("builds a validated deterministic multiple-choice fallback for text lessons", () => {
    const fallback = createDeterministicFallbackQuiz({
      ...quizRequest,
      question: "5",
      currentLesson: {
        ...quizRequest.currentLesson,
        coreIdea: "Detailed lesson statement. ".repeat(200),
      },
    });
    expect(GeneratedQuizSchema.safeParse(fallback).success).toBe(true);
    expect(fallback.questions).toHaveLength(5);
    expect(fallback.questions.every((question) => question.type === "multiple-choice"))
      .toBe(true);
  });
});

describe("quiz learner experience", () => {
  it("shows the useful quiz-specific error instead of malformed lesson data", () => {
    const markup = renderToStaticMarkup(
      <QuizExperience
        topic="Python"
        isLoading={false}
        error="Ada couldn’t prepare this quiz correctly. Try generating it again."
        quiz={null}
        onGenerate={() => undefined}
      />,
    );
    expect(markup).toContain("Ada couldn’t prepare this quiz correctly");
    expect(markup).not.toContain("malformed lesson data");
  });

  it("keeps short answers self-assessed and outside verified scores", () => {
    const result = scoreMultipleChoice(validQuiz, {
      "python-1": "0",
      "python-2": "A detailed learner response",
    });
    expect(result).toEqual({ correct: 1, total: 1, selfAssessed: 1 });
  });
});

describe("public YouTube sources", () => {
  it("normalizes watch URLs and safe timestamp parameters", () => {
    expect(normalizeYouTubeUrl(
      "https://www.youtube.com/watch?v=aircAruvnKk&t=200s",
    )).toMatchObject({
      kind: "youtube",
      videoId: "aircAruvnKk",
      canonicalUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
    });
  });

  it("normalizes youtu.be URLs", () => {
    expect(normalizeYouTubeUrl("https://youtu.be/aircAruvnKk?start=200"))
      .toMatchObject({ kind: "youtube", videoId: "aircAruvnKk" });
  });

  it("normalizes Shorts URLs", () => {
    expect(normalizeYouTubeUrl("https://www.youtube.com/shorts/aircAruvnKk"))
      .toMatchObject({ kind: "youtube", videoId: "aircAruvnKk" });
  });

  it("leaves non-YouTube URLs on the normal website path", () => {
    expect(normalizeYouTubeUrl("https://example.org/lesson"))
      .toEqual({ kind: "not-youtube" });
  });

  it("rejects invalid YouTube video identifiers", () => {
    expect(normalizeYouTubeUrl("https://www.youtube.com/watch?v=too-short"))
      .toMatchObject({
        kind: "invalid-youtube",
        error: "This does not appear to be a valid YouTube video URL.",
      });
  });

  it("maps private, unavailable, and timeout errors to learner-friendly text", () => {
    expect(youtubeSourceErrorMessage({ upstreamStatus: 404 }))
      .toContain("private, unlisted, age-restricted, unavailable, or inaccessible");
    expect(youtubeSourceErrorMessage({ code: "PROVIDER_TIMEOUT" }))
      .toBe("Video processing timed out.");
  });

  it("sends YouTube sources as native video file data, not webpage text", () => {
    const parts = createNativeMediaParts({
      imageDataUrls: [],
      youtubeUrls: ["https://www.youtube.com/watch?v=aircAruvnKk"],
    });
    expect(parts).toEqual([{
      fileData: { fileUri: "https://www.youtube.com/watch?v=aircAruvnKk" },
    }]);
    expect(JSON.stringify(parts)).not.toContain("text/html");
  });
});
