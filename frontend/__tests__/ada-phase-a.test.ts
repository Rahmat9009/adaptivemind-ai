import { beforeEach, describe, expect, it } from "vitest";
import { buildTutorSystemPrompt } from "@/lib/adaptive-prompt";
import {
  parseTutorRequest,
  responseSources,
  tutorLessonSchema,
} from "@/lib/server/ada/schemas";
import { parseProviderJson } from "@/lib/server/ada/validation";
import {
  clearRequestDedupeForTests,
  deduplicateRequest,
} from "@/lib/server/ada/dedupe";

const scores = {
  visual: 50,
  examples: 50,
  analogies: 50,
  stories: 50,
  challenges: 50,
};

const diverseTopics = [
  "Derivatives",
  "Newton's second law",
  "Ionic bonding",
  "How mitochondria produce ATP",
  "Binary search",
  "Supply and demand",
  "Causes of the French Revolution",
  "Plate tectonics",
  "Metaphor in poetry",
  "Arabic verb conjugation",
];

describe("Ada request validation", () => {
  it.each(diverseTopics)("accepts the arbitrary topic %s", (topic) => {
    const parsed = parseTutorRequest({
      topic,
      subject: "General learning",
      level: "Intermediate",
      scores,
      action: "initial",
      teachingMode: "adaptive",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.topic).toBe(topic);
  });

  it("rejects empty topics and unknown actions", () => {
    expect(parseTutorRequest({
      topic: " ",
      subject: "Science",
      level: "Beginner",
      scores,
      action: "initial",
      teachingMode: "adaptive",
    }).success).toBe(false);

    expect(parseTutorRequest({
      topic: "Derivatives",
      subject: "Mathematics",
      level: "Beginner",
      scores,
      action: "runArbitraryTool",
      teachingMode: "adaptive",
    }).success).toBe(false);
  });

  it("requires action-specific context", () => {
    const parsed = parseTutorRequest({
      topic: "Derivatives",
      subject: "Mathematics",
      level: "Beginner",
      scores,
      action: "evaluate",
      teachingMode: "adaptive",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("Ada response validation", () => {
  const validLesson = {
    title: "Derivatives",
    coreIdea: "A derivative describes an instantaneous rate of change.",
    explanation: "Compare nearby input and output changes, then shrink the interval.",
    keyPoints: ["It is a rate.", "It is local.", "It is a limit."],
    checkQuestion: "What does the derivative measure at one point?",
    stylesUsed: ["examples"],
  };

  it("extracts and validates JSON surrounded by provider commentary", () => {
    const content = `Here is the result:\n\`\`\`json\n${JSON.stringify(validLesson)}\n\`\`\``;
    expect(parseProviderJson(content, tutorLessonSchema)).toEqual(validLesson);
  });

  it("recovers a balanced object from non-JSON prefix text", () => {
    const content = `Result follows: ${JSON.stringify(validLesson)} End.`;
    expect(parseProviderJson(content, tutorLessonSchema)).toEqual(validLesson);
  });

  it("rejects malformed or schema-invalid output", () => {
    expect(parseProviderJson("{not-json}", tutorLessonSchema)).toBeNull();
    expect(parseProviderJson(
      JSON.stringify({ ...validLesson, stylesUsed: ["unsupported"] }),
      tutorLessonSchema,
    )).toBeNull();
  });

  it("rejects evaluation scores that conflict with their status", async () => {
    const { understandingEvaluationSchema } = await import(
      "@/lib/server/ada/schemas"
    );
    const result = understandingEvaluationSchema.safeParse({
      status: "correct",
      score: 1,
      feedback: "Correct.",
      whatWasUnderstood: ["The core idea."],
      needsReview: [],
      nextStep: "continue",
      stylesUsed: ["examples"],
    });
    expect(result.success).toBe(false);
  });

  it("uses explicit response provenance labels", () => {
    expect(responseSources).toEqual([
      "live-primary",
      "live-fallback",
      "local-fallback",
    ]);
  });
});

describe("Ada duplicate request prevention", () => {
  beforeEach(() => clearRequestDedupeForTests());

  it("shares one in-flight operation for the same request identifier", async () => {
    let calls = 0;
    const operation = async () => {
      calls += 1;
      await Promise.resolve();
      return { lesson: "one result" };
    };

    const [first, second] = await Promise.all([
      deduplicateRequest("request-123", operation),
      deduplicateRequest("request-123", operation),
    ]);

    expect(calls).toBe(1);
    expect(first).toEqual(second);
  });

  it("does not merge different request identifiers", async () => {
    let calls = 0;
    const operation = async () => {
      calls += 1;
      return calls;
    };

    await Promise.all([
      deduplicateRequest("request-a", operation),
      deduplicateRequest("request-b", operation),
    ]);
    expect(calls).toBe(2);
  });
});

describe("Ada local fallback", () => {
  it("is limited and explicitly marked as non-live content", async () => {
    const { createLocalFallback } = await import(
      "@/lib/server/ada/local-fallback"
    );
    const fallback = createLocalFallback({
      topic: "Photosynthesis",
      subject: "Biology",
      level: "Beginner",
      scores,
      action: "initial",
      teachingMode: "adaptive",
    });
    const unsupported = createLocalFallback({
      topic: "Topology",
      subject: "Mathematics",
      level: "Advanced",
      scores,
      action: "initial",
      teachingMode: "adaptive",
    });

    expect(fallback?.source).toBe("local-fallback");
    expect(unsupported).toBeNull();
  });
});

describe("Universal Ada prompt", () => {
  it("keeps an arbitrary learner topic and requests clarification when needed", () => {
    const prompt = buildTutorSystemPrompt({
      topic: "Arabic verb conjugation",
      subject: "Language learning",
      level: "Advanced",
      scores,
      action: "initial",
      teachingMode: "adaptive",
    });

    expect(prompt).toContain("Arabic verb conjugation");
    expect(prompt).toContain("genuinely ambiguous");
    expect(prompt).not.toContain("supported topics");
  });
});
