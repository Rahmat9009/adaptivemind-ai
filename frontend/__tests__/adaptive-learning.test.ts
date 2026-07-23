import { beforeEach, describe, expect, it } from "vitest";
import {
  createMasteryEvidenceId,
  getTopicMastery,
  normalizeTopicId,
  topicMasteryStorageKey,
  updateTopicMastery,
} from "@/lib/mastery";
import {
  emptyLearningDNA2,
  migrateLearningDNA,
  recordCheckOutcome,
} from "@/lib/learning-dna-v2";
import {
  dimensionToTeachingMode,
  teachingModeToDimension,
} from "@/lib/mode-effectiveness";
import {
  classifyConfidencePerformance,
} from "@/lib/confidence-calibration";
import {
  canRevealFullSolution,
  isMeaningfulAttempt,
  nextHintLevel,
} from "@/lib/productive-struggle";
import {
  addExplanationRecord,
  EXPLANATION_HISTORY_KEY,
  getExplanationHistoryForConcept,
} from "@/lib/explanation-history";
import {
  getQuickRecallStatus,
  QUICK_RECALL_KEY,
  scheduleQuickRecall,
  simulateQuickRecallDue,
} from "@/lib/quick-recall";
import {
  normalizePreferenceOverrides,
} from "@/lib/preference-overrides";

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

describe("topic normalization and conservative mastery", () => {
  it("normalizes Unicode topics without erasing their identity", () => {
    const first = normalizeTopicId("  تصريف الأفعال العربية  ");
    const second = normalizeTopicId("تصريف الأفعال العربية");
    expect(first).toBe(second);
    expect(first).toContain("تصريف");
  });

  it("does not count the same submission twice", () => {
    const evidenceId = createMasteryEvidenceId(
      "Derivatives",
      "lesson-1:understanding",
      "It is the instantaneous rate of change.",
    );
    const first = updateTopicMastery(
      "Derivatives",
      "Mathematics",
      90,
      "correct",
      { evidenceId, kind: "retrieval" },
    );
    const repeated = updateTopicMastery(
      "Derivatives",
      "Mathematics",
      90,
      "correct",
      { evidenceId, kind: "retrieval" },
    );

    expect(first.attempts).toBe(1);
    expect(repeated.attempts).toBe(1);
    expect(repeated.lastEvidenceApplied).toBe(false);
    expect(getTopicMastery()).toHaveLength(1);
  });

  it("weights hinted evidence less than independent evidence", () => {
    const independent = updateTopicMastery(
      "Binary search",
      "Computer science",
      90,
      "correct",
      {
        evidenceId: "independent",
        kind: "challenge",
        independent: true,
      },
    );
    localStorage.removeItem(topicMasteryStorageKey);
    const supported = updateTopicMastery(
      "Binary search",
      "Computer science",
      90,
      "correct",
      {
        evidenceId: "supported",
        kind: "challenge",
        independent: false,
        hintsUsed: 3,
      },
    );

    expect(independent.masteryPercent).toBeGreaterThan(
      supported.masteryPercent,
    );
    expect(independent.masteryPercent).toBeLessThanOrEqual(99);
    expect(supported.masteryPercent).toBeGreaterThanOrEqual(1);
  });
});

describe("Learning DNA evidence", () => {
  it("recovers valid fields from a partially corrupted v2 record", () => {
    const partial = {
      version: 2,
      initialPreferences: { visual: 80 },
      observedEffectiveness: {
        visual: {
          evidenceCount: 2,
          weightedEffectiveness: 75,
          recentEvidenceIds: ["one"],
        },
      },
      currentRecommendation: "visual",
    };
    const migrated = migrateLearningDNA(partial, null);

    expect(migrated.initialPreferences.visual).toBe(80);
    expect(migrated.observedEffectiveness.visual.evidenceCount).toBe(2);
    expect(migrated.observedEffectiveness.examples.evidenceCount).toBe(0);
  });

  it("deduplicates check outcomes by evidence identifier", () => {
    const dna = emptyLearningDNA2();
    const first = recordCheckOutcome(dna, "examples", {
      score: 85,
      confidenceBefore: 50,
      confidenceAfter: 50,
      hintCount: 0,
      retryCount: 0,
      switchedAway: false,
      evidenceId: "check-1",
    });
    const repeated = recordCheckOutcome(first, "examples", {
      score: 85,
      confidenceBefore: 50,
      confidenceAfter: 50,
      hintCount: 0,
      retryCount: 0,
      switchedAway: false,
      evidenceId: "check-1",
    });

    expect(first.observedEffectiveness.examples.evidenceCount).toBe(1);
    expect(repeated.observedEffectiveness.examples.evidenceCount).toBe(1);
  });

  it("maps UI teaching modes to valid evidence dimensions", () => {
    expect(teachingModeToDimension("example")).toBe("examples");
    expect(teachingModeToDimension("analogy")).toBe("analogies");
    expect(teachingModeToDimension("adaptive", "stories")).toBe("stories");
    expect(dimensionToTeachingMode("challenges")).toBe("challenge");
  });
});

describe("confidence and productive struggle", () => {
  it("classifies the four confidence-performance cases", () => {
    expect(classifyConfidencePerformance({
      confidence: 80,
      score: 90,
      status: "correct",
    })).toBe("aligned");
    expect(classifyConfidencePerformance({
      confidence: 25,
      score: 90,
      status: "correct",
    })).toBe("underconfident");
    expect(classifyConfidencePerformance({
      confidence: 90,
      score: 35,
      status: "misconception",
    })).toBe("confident-misconception");
    expect(classifyConfidencePerformance({
      confidence: 25,
      score: 40,
      status: "partial",
    })).toBe("low-confidence-developing");
  });

  it("requires meaningful effort and a prior hint before full solution", () => {
    expect(isMeaningfulAttempt("...")).toBe(false);
    expect(isMeaningfulAttempt("I think the midpoint is 25.")).toBe(true);
    expect(nextHintLevel(3)).toBe(4);
    expect(canRevealFullSolution({
      attemptMade: true,
      highestHintLevel: 0,
    })).toBe(false);
    expect(canRevealFullSolution({
      attemptMade: true,
      highestHintLevel: 1,
    })).toBe(true);
  });
});

describe("bounded local histories and reviews", () => {
  it("deduplicates explanation records for the same lesson and check", () => {
    const record = {
      conceptId: "derivatives",
      conceptLabel: "Derivatives",
      timestamp: new Date().toISOString(),
      approach: "examples" as const,
      lessonId: "lesson-1",
      reasonSelected: "Learner choice",
      learnerConfidence: 75,
      checkType: "understanding" as const,
      evaluationStatus: "correct" as const,
      evaluationScore: 90,
      hintsUsed: 0,
      retries: 0,
      masteryBefore: 10,
      masteryAfter: 28,
      switchedAway: false,
      learnerFeedback: null,
      recommendationOutcome: "continue",
    };
    addExplanationRecord(record);
    addExplanationRecord(record);

    expect(getExplanationHistoryForConcept("Derivatives")).toHaveLength(1);
    expect(localStorage.getItem(EXPLANATION_HISTORY_KEY)).not.toBeNull();
  });

  it("deduplicates recall scheduling and labels accelerated mode", () => {
    const first = scheduleQuickRecall(
      "plate tectonics",
      "Plate tectonics",
      "Geography",
    );
    const second = scheduleQuickRecall(
      "plate tectonics",
      "Plate tectonics",
      "Geography",
    );
    expect(first.createdAt).toBe(second.createdAt);
    expect(getQuickRecallStatus("plate tectonics")).toBe("not-due");

    const simulated = simulateQuickRecallDue("plate tectonics");
    expect(simulated.simulated).toBe(true);
    expect(getQuickRecallStatus("plate tectonics")).toBe("due");
    expect(localStorage.getItem(QUICK_RECALL_KEY)).not.toBeNull();
  });

  it("normalizes and bounds learner preference lists", () => {
    const normalized = normalizePreferenceOverrides({
      likedDomains: ["Nature", " nature ", ...Array(25).fill("science")],
      bannedDomains: ["sports analogies"],
      dislikedPatterns: ["long introductions", " long introductions "],
      detailPreference: "thorough",
      conciseStories: true,
      startChallengesEasy: true,
      updatedAt: "",
    });

    expect(normalized.likedDomains).toEqual(["Nature", "science"]);
    expect(normalized.dislikedPatterns).toEqual(["long introductions"]);
    expect(normalized.likedDomains.length).toBeLessThanOrEqual(20);
  });
});
