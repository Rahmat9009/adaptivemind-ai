import { beforeEach, describe, expect, it } from "vitest";
import {
  expectedSm2Quality,
  normalizeRecallScore,
  toRecallResult,
  toRecallStatus,
} from "@/lib/recall-session";
import {
  completeQuickRecall,
  getQuickRecallStatus,
  loadQuickRecalls,
  QUICK_RECALL_KEY,
  scheduleQuickRecall,
  simulateQuickRecallDue,
} from "@/lib/quick-recall";
import {
  getReviewCard,
  loadReviewCards,
  SPACED_REVIEW_STORAGE_KEY,
  updateReviewCard,
  upsertReviewCard,
} from "@/lib/spaced-review";
import { normalizeTopicId } from "@/lib/mastery";
import type { UnderstandingEvaluation } from "@/lib/ai/types";

function evaluation(
  overrides: Partial<UnderstandingEvaluation>,
): UnderstandingEvaluation {
  return {
    status: "correct",
    score: 90,
    feedback: "Clear recall.",
    whatWasUnderstood: [],
    needsReview: [],
    nextStep: "continue",
    stylesUsed: [],
    ...overrides,
  };
}

beforeEach(() => {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) delete store[key];
      },
    },
    writable: true,
    configurable: true,
  });
});

describe("toRecallStatus", () => {
  it("keeps correct and partial distinct", () => {
    expect(toRecallStatus("correct")).toBe("correct");
    expect(toRecallStatus("partial")).toBe("partial");
  });

  it("treats a misconception or uncertainty as not recalled", () => {
    expect(toRecallStatus("misconception")).toBe("incorrect");
    expect(toRecallStatus("uncertain")).toBe("incorrect");
  });
});

describe("normalizeRecallScore", () => {
  it("clamps into 0-100 and rounds", () => {
    expect(normalizeRecallScore(-20)).toBe(0);
    expect(normalizeRecallScore(140)).toBe(100);
    expect(normalizeRecallScore(72.6)).toBe(73);
  });

  it("treats non-finite scores as zero rather than guessing", () => {
    expect(normalizeRecallScore(Number.NaN)).toBe(0);
    expect(normalizeRecallScore(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeRecallScore(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe("toRecallResult", () => {
  it("carries score, status and feedback across", () => {
    const result = toRecallResult(
      evaluation({ status: "partial", score: 55, feedback: "Half right." }),
    );
    expect(result).toEqual({
      score: 55,
      status: "partial",
      feedback: "Half right.",
    });
  });
});

describe("expectedSm2Quality — mirrors lib/quick-recall.ts", () => {
  it("maps score bands to SM-2 qualities", () => {
    expect(expectedSm2Quality(95)).toBe(5);
    expect(expectedSm2Quality(80)).toBe(5);
    expect(expectedSm2Quality(79)).toBe(4);
    expect(expectedSm2Quality(60)).toBe(4);
    expect(expectedSm2Quality(59)).toBe(3);
    expect(expectedSm2Quality(40)).toBe(3);
    expect(expectedSm2Quality(39)).toBe(2);
    expect(expectedSm2Quality(20)).toBe(2);
    expect(expectedSm2Quality(19)).toBe(1);
    expect(expectedSm2Quality(0)).toBe(1);
  });
});

describe("recall loop — Learn to Recall to review update", () => {
  const topic = "Plate tectonics";
  const skillId = normalizeTopicId(topic);

  function seedReviewCard() {
    upsertReviewCard({
      skillId,
      topic,
      repetition: 1,
      easeFactor: 2.5,
      interval: 1,
      qualityHistory: [],
    });
  }

  it("advances the SM-2 review card after a successful recall", () => {
    seedReviewCard();
    scheduleQuickRecall(topic, topic, "Geography", false, "Explain it.");
    const before = getReviewCard(skillId);
    expect(before?.repetition).toBe(1);

    completeQuickRecall(topic, 90);

    const after = getReviewCard(skillId);
    expect(after).toBeDefined();
    expect(after!.repetition).toBe(2);
    expect(after!.lastQuality).toBe(5);
    expect(after!.interval).toBeGreaterThan(before!.interval);
    expect(after!.nextReview).toBeDefined();
  });

  it("sets a next review date in the future", () => {
    seedReviewCard();
    scheduleQuickRecall(topic, topic, "Geography", false, "Explain it.");
    completeQuickRecall(topic, 90);

    const card = getReviewCard(skillId);
    expect(Date.parse(card!.nextReview!)).toBeGreaterThan(Date.now());
  });

  it("records a weak recall with a low SM-2 quality", () => {
    seedReviewCard();
    scheduleQuickRecall(topic, topic, "Geography", false, "Explain it.");

    completeQuickRecall(topic, 10);

    const card = getReviewCard(skillId);
    expect(card!.lastQuality).toBe(1);
  });

  it("marks the recall completed and recommends a full review when weak", () => {
    seedReviewCard();
    scheduleQuickRecall(topic, topic, "Geography", false, "Explain it.");

    const { updated } = completeQuickRecall(topic, 15);

    expect(updated.completed).toBe(true);
    expect(updated.fullReviewRecommended).toBe(true);
    expect(updated.bestScore).toBe(15);
  });

  it("does not recommend a full review after a strong recall", () => {
    seedReviewCard();
    scheduleQuickRecall(topic, topic, "Geography", false, "Explain it.");

    const { updated } = completeQuickRecall(topic, 88);

    expect(updated.completed).toBe(true);
    expect(updated.fullReviewRecommended).toBe(false);
  });

  it("throws when no pending recall exists, which the caller must handle", () => {
    seedReviewCard();
    expect(() => completeQuickRecall(topic, 90)).toThrow(
      /No pending quick recall/,
    );
  });

  it("supports a second recall after re-scheduling, without a second store", () => {
    seedReviewCard();
    scheduleQuickRecall(topic, topic, "Geography", false, "Explain it.");
    completeQuickRecall(topic, 90);

    // The TutorShell handler re-schedules before completing again.
    scheduleQuickRecall(topic, topic, "Geography", false, "Explain it.");
    expect(() => completeQuickRecall(topic, 85)).not.toThrow();

    const card = getReviewCard(skillId);
    expect(card!.repetition).toBe(3);
    // Still exactly one quick-recall store and one review store.
    expect(localStorage.getItem(QUICK_RECALL_KEY)).not.toBeNull();
    expect(localStorage.getItem(SPACED_REVIEW_STORAGE_KEY)).not.toBeNull();
    expect(loadReviewCards()).toHaveLength(1);
  });

  it("keeps the stored recall question available for offline display", () => {
    scheduleQuickRecall(topic, topic, "Geography", false, "Name two plates.");
    const pending = loadQuickRecalls().find(
      (record) => record.skillId === skillId && !record.completed,
    );
    expect(pending?.question).toBe("Name two plates.");
  });

  it("reports a due status once the recall window opens", () => {
    scheduleQuickRecall(topic, topic, "Geography", false, "Explain it.");
    expect(getQuickRecallStatus(topic)).toBe("not-due");
    simulateQuickRecallDue(topic);
    expect(getQuickRecallStatus(topic)).toBe("due");
  });
});

describe("recall loop — SM-2 quality agreement", () => {
  it("applies the same quality the pure helper predicts", () => {
    for (const score of [0, 25, 45, 65, 95]) {
      localStorage.clear();
      const topic = `Topic ${score}`;
      const skillId = normalizeTopicId(topic);
      upsertReviewCard({
        skillId,
        topic,
        repetition: 0,
        easeFactor: 2.5,
        interval: 1,
        qualityHistory: [],
      });
      scheduleQuickRecall(topic, topic, undefined, false, "Explain it.");
      completeQuickRecall(topic, score);
      expect(getReviewCard(skillId)!.lastQuality).toBe(
        expectedSm2Quality(score),
      );
    }
  });

  it("matches a direct updateReviewCard call for the same quality", () => {
    const topic = "Direct comparison";
    const skillId = normalizeTopicId(topic);
    const base = {
      skillId,
      topic,
      repetition: 1,
      easeFactor: 2.5,
      interval: 1,
      qualityHistory: [],
    };
    const direct = updateReviewCard(base, 5, skillId, topic, undefined);

    upsertReviewCard(base);
    scheduleQuickRecall(topic, topic, undefined, false, "Explain it.");
    completeQuickRecall(topic, 90);

    const viaRecall = getReviewCard(skillId)!;
    expect(viaRecall.repetition).toBe(direct.repetition);
    expect(viaRecall.interval).toBe(direct.interval);
    expect(viaRecall.easeFactor).toBeCloseTo(direct.easeFactor, 5);
  });
});
