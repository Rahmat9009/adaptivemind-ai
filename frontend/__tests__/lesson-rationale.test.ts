import { describe, expect, it } from "vitest";
import {
  buildLessonRationale,
  describeEvidenceStrength,
} from "@/lib/lesson-rationale";
import {
  emptyLearningDNA2,
  type LearningDNA2,
} from "@/lib/learning-dna-v2";
import type { LearningDimension } from "@/lib/learning-dna";

function dnaWith(overrides: {
  recommendation?: LearningDimension;
  reason?: string;
  evidence?: Partial<Record<LearningDimension, number>>;
  stated?: Partial<Record<LearningDimension, number>>;
}): LearningDNA2 {
  const dna = emptyLearningDNA2();
  if (overrides.recommendation) {
    dna.currentRecommendation = overrides.recommendation;
  }
  if (overrides.reason !== undefined) {
    dna.recommendationReason = overrides.reason;
  }
  for (const [dimension, count] of Object.entries(overrides.evidence ?? {})) {
    dna.observedEffectiveness[dimension as LearningDimension].evidenceCount =
      count as number;
  }
  for (const [dimension, value] of Object.entries(overrides.stated ?? {})) {
    dna.initialPreferences[dimension as LearningDimension] = value as number;
  }
  return dna;
}

describe("describeEvidenceStrength", () => {
  it("separates no evidence from limited evidence", () => {
    expect(describeEvidenceStrength(0)).toBe("No outcome evidence yet");
    expect(describeEvidenceStrength(1)).toBe("Limited evidence");
  });

  it("escalates with more observations", () => {
    expect(describeEvidenceStrength(2)).toBe("Developing evidence");
    expect(describeEvidenceStrength(5)).toBe("Developing evidence");
    expect(describeEvidenceStrength(6)).toBe("Established evidence");
    expect(describeEvidenceStrength(50)).toBe("Established evidence");
  });

  it("treats negative counts as no evidence", () => {
    expect(describeEvidenceStrength(-3)).toBe("No outcome evidence yet");
  });
});

describe("buildLessonRationale — no Learning DNA", () => {
  it("still returns a complete rationale", () => {
    const rationale = buildLessonRationale(null, "adaptive");
    expect(rationale.dimension).toBe("visual");
    expect(rationale.label).toBe("Visual");
    expect(rationale.headline).toBe("Explained with visual");
    expect(rationale.basis).toBe("none");
    expect(rationale.evidenceCount).toBe(0);
    expect(rationale.evidenceLabel).toBe("No outcome evidence yet");
    expect(rationale.detail).toContain("first attempt");
  });

  it("still honours an explicit teaching mode", () => {
    const rationale = buildLessonRationale(null, "story");
    expect(rationale.dimension).toBe("stories");
    expect(rationale.basis).toBe("manual");
    expect(rationale.detail).toContain("You chose");
  });

  it("never throws for any teaching mode", () => {
    const modes = [
      "adaptive",
      "visual",
      "example",
      "analogy",
      "story",
      "challenge",
    ] as const;
    for (const mode of modes) {
      expect(() => buildLessonRationale(null, mode)).not.toThrow();
      expect(buildLessonRationale(null, mode).headline).toMatch(
        /^Explained with /,
      );
    }
  });
});

describe("buildLessonRationale — adaptive mode", () => {
  it("follows the stored recommendation and reason", () => {
    const dna = dnaWith({
      recommendation: "analogies",
      reason: "Analogies have the strongest observed effectiveness so far.",
      evidence: { analogies: 7 },
    });
    const rationale = buildLessonRationale(dna, "adaptive");
    expect(rationale.dimension).toBe("analogies");
    expect(rationale.label).toBe("Analogies");
    expect(rationale.headline).toBe("Explained with analogies");
    expect(rationale.detail).toBe(
      "Analogies have the strongest observed effectiveness so far.",
    );
    expect(rationale.evidenceCount).toBe(7);
    expect(rationale.evidenceLabel).toBe("Established evidence");
  });

  it("falls back to a plain reason when none is stored", () => {
    const dna = dnaWith({ recommendation: "stories", reason: "   " });
    const rationale = buildLessonRationale(dna, "adaptive");
    expect(rationale.detail).toBe("Ada selected stories from your Learning DNA.");
  });

  it("reports basis 'both' when stated and observed data agree", () => {
    const dna = dnaWith({
      recommendation: "examples",
      stated: { examples: 80 },
      evidence: { examples: 3 },
    });
    expect(buildLessonRationale(dna, "adaptive").basis).toBe("both");
  });

  it("reports basis 'stated' before any outcome is recorded", () => {
    const dna = dnaWith({
      recommendation: "examples",
      stated: { examples: 80 },
      evidence: { examples: 0 },
    });
    expect(buildLessonRationale(dna, "adaptive").basis).toBe("stated");
  });

  it("reports basis 'observed' when only outcomes exist", () => {
    const dna = dnaWith({
      recommendation: "challenges",
      stated: { challenges: 0 },
      evidence: { challenges: 4 },
    });
    expect(buildLessonRationale(dna, "adaptive").basis).toBe("observed");
  });
});

describe("buildLessonRationale — manual override", () => {
  it("says the learner chose the approach, not Ada", () => {
    const dna = dnaWith({
      recommendation: "analogies",
      reason: "Analogies are working best.",
      evidence: { visual: 2 },
    });
    const rationale = buildLessonRationale(dna, "visual");
    expect(rationale.dimension).toBe("visual");
    expect(rationale.basis).toBe("manual");
    expect(rationale.detail).toContain("You chose visual");
    expect(rationale.detail).toContain("2 recorded outcomes");
    // The adaptive recommendation must not leak into a manual explanation.
    expect(rationale.detail).not.toContain("Analogies are working best.");
  });

  it("uses singular wording for a single recorded outcome", () => {
    const dna = dnaWith({ evidence: { challenges: 1 } });
    const rationale = buildLessonRationale(dna, "challenge");
    expect(rationale.detail).toContain("1 recorded outcome for this approach");
    expect(rationale.detail).not.toContain("outcomes");
  });

  it("omits the evidence clause when there is none", () => {
    const dna = dnaWith({ evidence: { stories: 0 } });
    const rationale = buildLessonRationale(dna, "story");
    expect(rationale.detail).toBe(
      "You chose stories for this lesson, so Ada used it instead of its own recommendation.",
    );
  });

  it("maps every manual mode to its dimension", () => {
    const dna = dnaWith({});
    expect(buildLessonRationale(dna, "visual").dimension).toBe("visual");
    expect(buildLessonRationale(dna, "example").dimension).toBe("examples");
    expect(buildLessonRationale(dna, "analogy").dimension).toBe("analogies");
    expect(buildLessonRationale(dna, "story").dimension).toBe("stories");
    expect(buildLessonRationale(dna, "challenge").dimension).toBe("challenges");
  });
});

describe("buildLessonRationale — determinism", () => {
  it("returns identical output for identical input", () => {
    const dna = dnaWith({
      recommendation: "analogies",
      reason: "Analogies are working best.",
      evidence: { analogies: 4 },
    });
    const first = buildLessonRationale(dna, "adaptive");
    const second = buildLessonRationale(dna, "adaptive");
    expect(first).toEqual(second);
  });

  it("does not mutate the Learning DNA it reads", () => {
    const dna = dnaWith({ recommendation: "stories", evidence: { stories: 3 } });
    const snapshot = JSON.stringify(dna);
    buildLessonRationale(dna, "adaptive");
    buildLessonRationale(dna, "visual");
    expect(JSON.stringify(dna)).toBe(snapshot);
  });
});
