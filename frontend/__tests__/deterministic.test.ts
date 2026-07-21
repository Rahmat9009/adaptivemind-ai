/**
 * AdaptiveMind 2.0 — Deterministic Tests
 *
 * These tests verify the pure algorithmic functions produce correct,
 * predictable outputs. No external dependencies, no mocking.
 *
 * Run with: npx vitest run __tests__/deterministic.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";

// Mock localStorage for storage-dependent modules
beforeAll(() => {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    },
    writable: true,
    configurable: true,
  });
});

// ────────────────────────────────────────────
// Learning DNA v2 — Migration
// ────────────────────────────────────────────

describe("Learning DNA v2 — Migration", () => {
  it("migrates from v1 profile format to LearningDNA2", async () => {
    const { migrateLearningDNA } = await import("@/lib/learning-dna-v2");
    const v1Profile = { scores: { visual: 30, examples: 70, analogies: 50, stories: 60, challenges: 40 } };
    const result = migrateLearningDNA(null, v1Profile);

    expect(result.version).toBe(2);
    expect(result.initialPreferences.examples).toBe(70);
    expect(result.initialPreferences.visual).toBe(30);
    // observedEffectiveness should have statedPreference set but zero evidence
    expect(result.observedEffectiveness.examples.evidenceCount).toBe(0);
    expect(result.observedEffectiveness.examples.statedPreference).toBe(70);
    // currentRecommendation should be the highest initial preference
    expect(result.currentRecommendation).toBe("examples");
    expect(result.recommendationConfidence).toBe(15);
  });

  it("returns empty DNA when no v1 or v2 data exists", async () => {
    const { migrateLearningDNA } = await import("@/lib/learning-dna-v2");
    const result = migrateLearningDNA(null, null);
    expect(result.version).toBe(2);
    expect(result.observedEffectiveness.visual.evidenceCount).toBe(0);
  });

  it("preserves existing v2 data", async () => {
    const { migrateLearningDNA, emptyLearningDNA2 } = await import("@/lib/learning-dna-v2");
    const v2 = emptyLearningDNA2();
    v2.currentRecommendation = "visual";
    const result = migrateLearningDNA(v2, null);
    expect(result.currentRecommendation).toBe("visual");
    expect(result.version).toBe(2);
  });
});

// ────────────────────────────────────────────
// Thompson Sampling (Mode Effectiveness)
// ────────────────────────────────────────────

describe("Thompson Sampling — Mode Effectiveness", () => {
  it("selects the forced approach when override is given", async () => {
    const { selectApproach, defaultApproachState } = await import("@/lib/mode-effectiveness");
    const state = defaultApproachState();
    const result = selectApproach(state, { forcedDimension: "visual" });
    expect(result.dimension).toBe("visual");
    expect(result.explored).toBe(false);
  });

  it("returns a valid dimension from the state array", async () => {
    const { selectApproach, defaultApproachState } = await import("@/lib/mode-effectiveness");
    const state = defaultApproachState();
    const dimensions = ["visual", "examples", "analogies", "stories", "challenges"] as const;
    const result = selectApproach(state);
    expect(dimensions).toContain(result.dimension);
    expect(typeof result.explored).toBe("boolean");
    expect(typeof result.sampledScores).toBe("object");
  });

  it("explains selection clearly", async () => {
    const { explainSelection, defaultApproachState } = await import("@/lib/mode-effectiveness");
    const state = defaultApproachState();
    const reason = explainSelection("examples", false, state, 5);
    // Dimension names are capitalized in the explanation
    expect(reason).toContain("Examples");
    expect(reason.length).toBeGreaterThan(10);
  });

  it("updates approach state correctly on success", async () => {
    const { updateApproachState, defaultApproachState } = await import("@/lib/mode-effectiveness");
    const state = defaultApproachState();
    const updated = updateApproachState(state, "examples", true);
    expect(updated.find((s) => s.dimension === "examples")?.alpha).toBe(2); // 1 + 1
    expect(updated.find((s) => s.dimension === "examples")?.evidenceCount).toBe(1);
  });

  it("updates approach state correctly on failure", async () => {
    const { updateApproachState, defaultApproachState } = await import("@/lib/mode-effectiveness");
    const state = defaultApproachState();
    const updated = updateApproachState(state, "visual", false);
    expect(updated.find((s) => s.dimension === "visual")?.beta).toBe(2); // 1 + 1
    expect(updated.find((s) => s.dimension === "visual")?.evidenceCount).toBe(1);
  });
});

// ────────────────────────────────────────────
// Mastery v2 — Bayesian Knowledge Tracing
// ────────────────────────────────────────────

describe("Mastery v2 — Bayesian Knowledge Tracing", () => {
  it("starts with probabilityKnown=0.1 for a new skill", async () => {
    const { createSkillMastery } = await import("@/lib/mastery-v2");
    const skill = createSkillMastery("photosynthesis");
    expect(skill.skillId).toBe("photosynthesis");
    expect(skill.probabilityKnown).toBeCloseTo(0.1);
    expect(skill.attempts).toBe(0);
  });

  it("increases probability after a correct answer", async () => {
    const { createSkillMastery, updateBKT } = await import("@/lib/mastery-v2");
    const skill = createSkillMastery("test-skill");
    const updated = updateBKT(skill, true, false);
    expect(updated.probabilityKnown).toBeGreaterThan(skill.probabilityKnown);
    expect(updated.attempts).toBe(1);
    expect(updated.successfulRetrievals).toBe(1);
  });

  it("increases probability less on incorrect vs correct", async () => {
    const { createSkillMastery, updateBKT } = await import("@/lib/mastery-v2");
    const skill = createSkillMastery("test-skill");
    // BKT includes a learning-from-attempt step, so P(K) rises on both.
    const correctUpdate = updateBKT(skill, true, false);
    const incorrectUpdate = updateBKT(skill, false, false);
    // A correct answer should increase P(K) more than an incorrect answer
    expect(correctUpdate.probabilityKnown).toBeGreaterThan(incorrectUpdate.probabilityKnown);
    expect(incorrectUpdate.attempts).toBe(1);
    expect(incorrectUpdate.successfulRetrievals).toBe(0);
  });

  it("handles hint penalty", async () => {
    const { createSkillMastery, updateBKT } = await import("@/lib/mastery-v2");
    const skill = createSkillMastery("test-skill");
    const withoutHint = updateBKT(skill, true, false);
    const withHint = updateBKT(skill, true, true);
    // Both should have increased probability
    expect(withoutHint.probabilityKnown).toBeGreaterThan(skill.probabilityKnown);
    expect(withHint.probabilityKnown).toBeGreaterThan(skill.probabilityKnown);
  });

  it("categorizes mastery labels correctly", async () => {
    const { calculateMasteryLabel } = await import("@/lib/mastery-v2");
    // 0 attempts → "new"
    expect(calculateMasteryLabel(0.05, 0, 0, false)).toBe("new");
    // Needs review: latest incorrect, pKnown < 0.5
    expect(calculateMasteryLabel(0.3, 2, 1, false)).toBe("needs-review");
    // Exploring: has attempts but doesn't meet higher thresholds
    expect(calculateMasteryLabel(0.3, 1, 0, true)).toBe("exploring");
    // Developing: pKnown >= 0.4, attempts >= 1
    expect(calculateMasteryLabel(0.5, 2, 1, true)).toBe("developing");
    // Understood: pKnown >= 0.7, attempts >= 2
    expect(calculateMasteryLabel(0.75, 3, 2, true)).toBe("understood");
    // Applied: pKnown >= 0.85, successes >= 3
    expect(calculateMasteryLabel(0.9, 4, 3, true)).toBe("applied");
    // Mastered: pKnown >= 0.95, successes >= 4
    expect(calculateMasteryLabel(0.97, 5, 4, true)).toBe("mastered");
  });

  it("produces confidence text for each range", async () => {
    const { skillConfidenceLabel } = await import("@/lib/mastery-v2");
    expect(skillConfidenceLabel(0.97)).toBe("Very confident");
    expect(skillConfidenceLabel(0.85)).toBe("Confident");
    expect(skillConfidenceLabel(0.6)).toBe("Moderately confident");
    expect(skillConfidenceLabel(0.4)).toBe("Somewhat uncertain");
    expect(skillConfidenceLabel(0.1)).toBe("Uncertain");
  });
});

// ────────────────────────────────────────────
// Confidence Calibration
// ────────────────────────────────────────────

describe("Confidence Calibration", () => {
  it("classifies well-calibrated learner", async () => {
    const { classifyCalibration } = await import("@/lib/confidence-calibration");
    const result = classifyCalibration([
      { selfReported: 80, actualScore: 85, timestamp: "2024-01-01", skillId: "s1", approach: "visual" },
      { selfReported: 75, actualScore: 78, timestamp: "2024-01-02", skillId: "s1", approach: "examples" },
    ]);
    expect(result.category).toBe("well-calibrated");
  });

  it("classifies overconfident learner", async () => {
    const { classifyCalibration } = await import("@/lib/confidence-calibration");
    const result = classifyCalibration([
      { selfReported: 90, actualScore: 20, timestamp: "2024-01-01", skillId: "s1", approach: "visual" },
      { selfReported: 80, actualScore: 30, timestamp: "2024-01-02", skillId: "s1", approach: "examples" },
      { selfReported: 85, actualScore: 15, timestamp: "2024-01-03", skillId: "s1", approach: "stories" },
    ]);
    expect(result.category).toBe("overconfident");
  });

  it("classifies underconfident learner", async () => {
    const { classifyCalibration } = await import("@/lib/confidence-calibration");
    const result = classifyCalibration([
      { selfReported: 25, actualScore: 85, timestamp: "2024-01-01", skillId: "s1", approach: "visual" },
      { selfReported: 40, actualScore: 90, timestamp: "2024-01-02", skillId: "s1", approach: "examples" },
      { selfReported: 30, actualScore: 80, timestamp: "2024-01-03", skillId: "s1", approach: "stories" },
    ]);
    expect(result.category).toBe("underconfident");
  });

  it("returns insufficient-data for empty input", async () => {
    const { classifyCalibration } = await import("@/lib/confidence-calibration");
    const result = classifyCalibration([]);
    expect(result.category).toBe("insufficient-data");
  });

  it("converts confidence levels to 0-100 scale", async () => {
    const { confidenceLevelToNumber, confidenceLevelFromNumber } = await import("@/lib/confidence-calibration");
    expect(confidenceLevelToNumber("low")).toBe(25);
    expect(confidenceLevelToNumber("somewhat")).toBe(50);
    expect(confidenceLevelToNumber("confident")).toBe(75);
    expect(confidenceLevelToNumber("very")).toBe(95);
    // Round-trip
    expect(confidenceLevelFromNumber(25)).toBe("low");
    expect(confidenceLevelFromNumber(75)).toBe("confident");
  });

  it("generates non-empty feedback for each category", async () => {
    const { generateConfidenceFeedback } = await import("@/lib/confidence-calibration");
    const categories = ["well-calibrated", "overconfident", "underconfident", "low-confidence-low-understanding", "insufficient-data"] as const;
    for (const category of categories) {
      const feedback = generateConfidenceFeedback({
        category, description: "",
        averageConfidence: 0, averagePerformance: 0, gap: 0, recordCount: 1,
      });
      expect(feedback.length).toBeGreaterThan(0);
    }
  });
});

// ────────────────────────────────────────────
// Spaced Review — SM-2
// ────────────────────────────────────────────

describe("Spaced Review — SM-2", () => {
  it("creates initial card with 1-day interval after quality 5", async () => {
    const { updateReviewCard } = await import("@/lib/spaced-review");
    const card = updateReviewCard(
      { skillId: "test", topic: "Test", repetition: 0, easeFactor: 2.5, interval: 0, qualityHistory: [] },
      5,
      "test",
      "Test",
    );
    expect(card.repetition).toBe(1);
    expect(card.interval).toBe(1);
    expect(card.easeFactor).toBeGreaterThanOrEqual(2.5);
  });

  it("resets card on quality 1", async () => {
    const { updateReviewCard } = await import("@/lib/spaced-review");
    const card = updateReviewCard(
      { skillId: "test", topic: "Test", repetition: 3, easeFactor: 2.5, interval: 10, qualityHistory: [4, 4, 3] },
      1,
      "test",
      "Test",
    );
    expect(card.repetition).toBe(0);
  });

  it("clamps ease factor to [1.3, 3.0]", async () => {
    const { updateReviewCard } = await import("@/lib/spaced-review");
    const card = updateReviewCard(
      { skillId: "test", topic: "Test", repetition: 5, easeFactor: 2.5, interval: 30, qualityHistory: [5, 5, 5, 5, 5] },
      5,
      "test",
      "Test",
    );
    expect(card.easeFactor).toBeLessThanOrEqual(3.0);
    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("gets empty due reviews for no stored data", async () => {
    const { getDueReviews } = await import("@/lib/spaced-review");
    localStorage.clear();
    const due = getDueReviews();
    expect(Array.isArray(due)).toBe(true);
    expect(due).toHaveLength(0);
  });

  it("upserts and retrieves a card", async () => {
    const { upsertReviewCard, loadReviewCards, saveReviewCards } = await import("@/lib/spaced-review");
    localStorage.clear();

    const newCard = {
      skillId: "__test_unique_skill__",
      topic: "Test Skill",
      repetition: 0,
      easeFactor: 2.5,
      interval: 0,
      qualityHistory: [],
    };

    upsertReviewCard(newCard);
    const loaded = loadReviewCards();
    const inserted = loaded.find((c) => c.skillId === "__test_unique_skill__");
    expect(inserted).toBeDefined();
    expect(inserted?.topic).toBe("Test Skill");

    // Cleanup
    saveReviewCards(loaded.filter((c) => c.skillId !== "__test_unique_skill__"));
  });
});

// ────────────────────────────────────────────
// Topic Normalization
// ────────────────────────────────────────────

describe("Topic Normalization", () => {
  it("normalizes topic IDs consistently", async () => {
    const { normalizeTopicId } = await import("@/lib/mastery");
    expect(normalizeTopicId("Photosynthesis")).toBe("photosynthesis");
    expect(normalizeTopicId(" Newton's First Law ")).toBe("newton-s-first-law");
    expect(normalizeTopicId("The Pythagorean Theorem")).toBe("the-pythagorean-theorem");
    expect(normalizeTopicId("  HELLO WORLD  ")).toBe("hello-world");
    expect(normalizeTopicId("Multi   spaces")).toBe("multi-spaces");
  });
});
