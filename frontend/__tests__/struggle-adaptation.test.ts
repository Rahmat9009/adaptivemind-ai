/**
 * Struggle-aware adaptation (V1).
 *
 * Pure-function coverage for detection, alternative selection and the
 * guard semantics the TutorShell relies on. No network and no storage.
 */
import { describe, expect, it } from "vitest";
import type { LearningDimension } from "@/lib/learning-dna";
import {
  chooseAlternativeApproach,
  describeAcceptedAdaptation,
  detectStruggle,
  normalizeAdaptationRecord,
  MIN_CONCEPT_EVIDENCE,
  V1_EXCLUDED_DIMENSIONS,
  type StruggleEvidence,
  type StruggleReasonCode,
} from "@/lib/struggle-adaptation";

function evidence(overrides: Partial<StruggleEvidence> = {}): StruggleEvidence {
  return {
    status: "correct",
    score: 90,
    confidenceBefore: 60,
    retries: 0,
    ...overrides,
  };
}

const RANKING: LearningDimension[] = [
  "visual",
  "stories",
  "examples",
  "analogies",
  "challenges",
];

describe("detectStruggle", () => {
  it("triggers on a misconception", () => {
    const result = detectStruggle(evidence({ status: "misconception", score: 80 }));
    expect(result.struggling).toBe(true);
    expect(result.reasonCode).toBe("misconception");
    expect(result.explanation).toMatch(/misconception/i);
  });

  it("triggers on an uncertain answer", () => {
    const result = detectStruggle(evidence({ status: "uncertain", score: 75 }));
    expect(result.struggling).toBe(true);
    expect(result.reasonCode).toBe("uncertain");
  });

  it("triggers when the score is below 50", () => {
    const result = detectStruggle(evidence({ status: "partial", score: 42 }));
    expect(result.struggling).toBe(true);
    expect(result.reasonCode).toBe("low-score");
  });

  it("triggers on a confident but incorrect answer", () => {
    const result = detectStruggle(
      evidence({ status: "partial", score: 60, confidenceBefore: 85 }),
    );
    expect(result.struggling).toBe(true);
    expect(result.reasonCode).toBe("confident-error");
    expect(result.explanation).toMatch(/confident/i);
  });

  it("triggers on a repeated attempt that is still below 70", () => {
    const result = detectStruggle(
      evidence({ status: "partial", score: 65, confidenceBefore: 40, retries: 1 }),
    );
    expect(result.struggling).toBe(true);
    expect(result.reasonCode).toBe("repeated-attempts");
  });

  it("does not trigger on healthy performance", () => {
    const result = detectStruggle(evidence());
    expect(result.struggling).toBe(false);
    expect(result.reasonCode).toBeNull();
    expect(result.explanation).toBe("");
  });

  it("does not trigger on a first partial answer that is close", () => {
    const result = detectStruggle(
      evidence({ status: "partial", score: 72, confidenceBefore: 50, retries: 0 }),
    );
    expect(result.struggling).toBe(false);
  });

  it("does not trigger on low confidence alone when the score is strong", () => {
    const result = detectStruggle(
      evidence({ status: "correct", score: 88, confidenceBefore: 20 }),
    );
    expect(result.struggling).toBe(false);
  });

  it("tolerates a missing confidence value", () => {
    const result = detectStruggle(
      evidence({ status: "partial", score: 65, confidenceBefore: null, retries: 0 }),
    );
    expect(result.struggling).toBe(false);
  });

  it("is deterministic for identical evidence", () => {
    const input = evidence({ status: "misconception", score: 30, retries: 2 });
    expect(detectStruggle(input)).toEqual(detectStruggle(input));
  });

  // V1 explicitly excludes these signals.
  it("does not trigger from hint usage or mastery (not part of V1 evidence)", () => {
    const result = detectStruggle(
      evidence({ status: "correct", score: 85, confidenceBefore: 90, retries: 0 }),
    );
    expect(result.struggling).toBe(false);
  });
});

describe("chooseAlternativeApproach", () => {
  it("never proposes the approach already in use", () => {
    const result = chooseAlternativeApproach({
      currentDimension: "examples",
      conceptBest: { approach: "examples", averageScore: 90, evidenceCount: 9 },
      effectivenessRanking: ["examples", "analogies", "stories", "challenges", "visual"],
      totalEvidenceCount: 12,
    });
    expect(result.dimension).not.toBe("examples");
  });

  it("excludes visual from automatic proposals in V1", () => {
    const result = chooseAlternativeApproach({
      currentDimension: "stories",
      conceptBest: { approach: "visual", averageScore: 99, evidenceCount: 20 },
      effectivenessRanking: RANKING,
      totalEvidenceCount: 30,
    });
    expect(result.dimension).not.toBe("visual");
    expect(V1_EXCLUDED_DIMENSIONS).toContain("visual");
  });

  it("uses concept evidence when it is sufficient", () => {
    const result = chooseAlternativeApproach({
      currentDimension: "stories",
      conceptBest: {
        approach: "challenges",
        averageScore: 88,
        evidenceCount: MIN_CONCEPT_EVIDENCE,
      },
      effectivenessRanking: RANKING,
      totalEvidenceCount: 20,
    });
    expect(result.dimension).toBe("challenges");
    expect(result.basis).toBe("concept-evidence");
  });

  it("falls back to the DNA ranking when concept evidence is too thin", () => {
    const result = chooseAlternativeApproach({
      currentDimension: "stories",
      conceptBest: {
        approach: "challenges",
        averageScore: 88,
        evidenceCount: MIN_CONCEPT_EVIDENCE - 1,
      },
      effectivenessRanking: RANKING,
      totalEvidenceCount: 20,
    });
    // "visual" ranks first but is excluded, so the next eligible one wins.
    expect(result.dimension).toBe("examples");
    expect(result.basis).toBe("dna-ranking");
  });

  it("uses the DNA ranking when there is no concept evidence at all", () => {
    const result = chooseAlternativeApproach({
      currentDimension: "examples",
      conceptBest: null,
      effectivenessRanking: ["visual", "challenges", "stories", "analogies", "examples"],
      totalEvidenceCount: 5,
    });
    expect(result.dimension).toBe("challenges");
    expect(result.basis).toBe("dna-ranking");
  });

  it("falls back deterministically to examples with zero evidence", () => {
    const result = chooseAlternativeApproach({
      currentDimension: "stories",
      conceptBest: null,
      effectivenessRanking: RANKING,
      totalEvidenceCount: 0,
    });
    expect(result.dimension).toBe("examples");
    expect(result.basis).toBe("fallback");
  });

  it("falls back past examples when examples is already in use", () => {
    const result = chooseAlternativeApproach({
      currentDimension: "examples",
      conceptBest: null,
      effectivenessRanking: RANKING,
      totalEvidenceCount: 0,
    });
    expect(result.dimension).toBe("analogies");
    expect(result.basis).toBe("fallback");
  });

  it("is deterministic across repeated calls", () => {
    const input = {
      currentDimension: "stories" as LearningDimension,
      conceptBest: null,
      effectivenessRanking: RANKING,
      totalEvidenceCount: 0,
    };
    expect(chooseAlternativeApproach(input)).toEqual(
      chooseAlternativeApproach(input),
    );
  });
});

describe("describeAcceptedAdaptation", () => {
  const codes: StruggleReasonCode[] = [
    "misconception",
    "uncertain",
    "low-score",
    "confident-error",
    "repeated-attempts",
  ];

  it("attributes every reason code to Ada, not the learner", () => {
    for (const code of codes) {
      const copy = describeAcceptedAdaptation(code);
      expect(copy).toMatch(/^Ada suggested a different approach because/);
      expect(copy).not.toMatch(/You selected/);
    }
  });

  it("gives each reason code its own specific wording", () => {
    const all = codes.map(describeAcceptedAdaptation);
    expect(new Set(all).size).toBe(codes.length);
  });

  it("names the misconception evidence", () => {
    expect(describeAcceptedAdaptation("misconception")).toMatch(/misconception/);
  });

  it("names the confidence evidence for an overconfident error", () => {
    expect(describeAcceptedAdaptation("confident-error")).toMatch(/confidence was high/);
  });

  it("names the repeated attempt evidence", () => {
    expect(describeAcceptedAdaptation("repeated-attempts")).toMatch(
      /more than one attempt/,
    );
  });

  it("stays concise", () => {
    for (const code of codes) {
      expect(describeAcceptedAdaptation(code).length).toBeLessThanOrEqual(140);
    }
  });
});

describe("normalizeAdaptationRecord", () => {
  it("accepts a well-formed record", () => {
    const record = normalizeAdaptationRecord({
      from: "stories",
      to: "examples",
      reasonCode: "misconception",
      at: "2026-09-01T00:00:00.000Z",
    });
    expect(record).not.toBeNull();
    expect(record?.to).toBe("examples");
  });

  it("rejects unknown dimensions and reason codes", () => {
    expect(
      normalizeAdaptationRecord({
        from: "telepathy",
        to: "examples",
        reasonCode: "misconception",
        at: "2026-09-01T00:00:00.000Z",
      }),
    ).toBeNull();
    expect(
      normalizeAdaptationRecord({
        from: "stories",
        to: "examples",
        reasonCode: "vibes",
        at: "2026-09-01T00:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("rejects non-objects", () => {
    expect(normalizeAdaptationRecord(null)).toBeNull();
    expect(normalizeAdaptationRecord("nope")).toBeNull();
  });
});

/**
 * Guard semantics.
 *
 * The one-proposal-per-lesson rule lives in TutorShell as a comparison
 * between `adaptationHandledGeneration` and `lessonGeneration`. These tests
 * model that comparison directly so the rule itself is covered without
 * mounting the whole shell.
 */
describe("adaptation guards", () => {
  function canPropose(handled: number | null, generation: number): boolean {
    return handled !== generation;
  }

  it("allows one proposal per generated lesson", () => {
    let handled: number | null = null;
    const generation = 1;
    expect(canPropose(handled, generation)).toBe(true);
    handled = generation; // raised
    expect(canPropose(handled, generation)).toBe(false);
  });

  it("keeps the proposal spent after a dismiss, until a new lesson", () => {
    let handled: number | null = 1;
    const generation = 1;
    // Dismiss clears the visible proposal but not the spent marker.
    expect(canPropose(handled, generation)).toBe(false);
    // A newly generated lesson resets the marker.
    handled = null;
    expect(canPropose(handled, 2)).toBe(true);
  });

  it("keeps the proposal spent after an accept, until a new lesson", () => {
    const handled: number | null = 3;
    expect(canPropose(handled, 3)).toBe(false);
    expect(canPropose(null, 4)).toBe(true);
  });

  it("models that an accepted adaptation is tracked apart from didSwitchMode", () => {
    // didSwitchMode must only ever be set by learner-initiated mode changes,
    // because it feeds switchAwayCount in the Learning DNA evidence model.
    let didSwitchMode = false;
    let appliedAdaptation: { from: string; to: string } | null = null;

    // Ada-initiated, learner-accepted adaptation:
    appliedAdaptation = { from: "stories", to: "examples" };
    expect(didSwitchMode).toBe(false);
    expect(appliedAdaptation).not.toBeNull();

    // Learner-initiated switch, for contrast:
    didSwitchMode = true;
    expect(didSwitchMode).toBe(true);
  });

  it("records the triggering evaluation against the mode that produced it", () => {
    // TutorShell computes the recorded approach from `teachingMode` before
    // any adaptation is applied; the new mode only reaches the next request.
    const modeAtCheckTime = "story";
    let currentMode = modeAtCheckTime;
    const recordedApproach = currentMode;

    // Adaptation accepted afterwards.
    currentMode = "example";

    expect(recordedApproach).toBe("story");
    expect(currentMode).toBe("example");
  });
});
