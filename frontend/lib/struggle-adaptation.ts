/**
 * AdaptiveMind — Struggle-aware adaptation (V1)
 *
 * Pure decision helpers for detecting that the current teaching approach is
 * not working, and for proposing a different one. No storage access and no
 * network access happens here, so every decision stays deterministic and
 * testable — the same shape as lib/recall-session.ts.
 *
 * This module deliberately does NOT introduce a second effectiveness model.
 * It reads rankings that Learning DNA 2.0 and the explanation history have
 * already computed, and only decides which alternative to surface.
 */

import type { LearningDimension } from "@/lib/learning-dna";
import { learningDimensionLabels } from "@/lib/learning-dna";
import { classifyConfidencePerformance } from "@/lib/confidence-calibration";

/** Every dimension the selector may consider, in deterministic order. */
const DIMENSIONS: LearningDimension[] = [
  "visual",
  "examples",
  "analogies",
  "stories",
  "challenges",
];

/**
 * V1 never auto-proposes "visual".
 *
 * A visual lesson requires the provider to return a structured `visual`
 * payload and uses a larger token budget. The emergency text fallback is
 * asked for a plain JSON object and is attempted once, so an automatic
 * switch to visual is materially more likely to fail than the alternatives.
 * The learner can still choose visual manually.
 */
export const V1_EXCLUDED_DIMENSIONS: readonly LearningDimension[] = ["visual"];

/**
 * Deterministic preference order used when there is no usable evidence.
 * "examples" first: a worked example is the safest general recovery from a
 * failed check, and it is the cheapest shape for any provider to produce.
 */
const FALLBACK_ORDER: LearningDimension[] = [
  "examples",
  "analogies",
  "stories",
  "challenges",
];

/** Concept-level evidence is only trusted once an approach has been seen twice. */
export const MIN_CONCEPT_EVIDENCE = 2;

export type StruggleReasonCode =
  | "misconception"
  | "uncertain"
  | "low-score"
  | "confident-error"
  | "repeated-attempts";

export type EvaluationStatus =
  | "correct"
  | "partial"
  | "misconception"
  | "uncertain";

export interface StruggleEvidence {
  status: EvaluationStatus;
  /** Understanding-check score, 0–100. */
  score: number;
  /** Self-reported confidence before the check, 0–100, or null if not given. */
  confidenceBefore: number | null;
  /** Retries already recorded for this check, before this outcome. */
  retries: number;
}

export interface StruggleDetection {
  struggling: boolean;
  reasonCode: StruggleReasonCode | null;
  /** One learner-facing sentence naming the evidence. */
  explanation: string;
}

const NO_STRUGGLE: StruggleDetection = {
  struggling: false,
  reasonCode: null,
  explanation: "",
};

/**
 * Decide whether the last understanding check is evidence that the current
 * approach is not working.
 *
 * Triggers are evaluated in a fixed order so the reason code is always
 * reproducible for the same evidence:
 *
 *  1. Strong failure     — misconception/uncertain, or score below 50.
 *  2. Overconfidence     — score below 70 while confidence was 70 or above.
 *  3. Repeated difficulty — at least one prior retry and score below 70.
 *
 * V1 deliberately ignores hint usage, topic mastery, recall failure and
 * Explain Back failure. Those are observable but not yet used, so that the
 * proposal stays rare and clearly justified.
 */
export function detectStruggle(evidence: StruggleEvidence): StruggleDetection {
  const score = clampScore(evidence.score);

  // 1. Strong failure.
  if (evidence.status === "misconception") {
    return {
      struggling: true,
      reasonCode: "misconception",
      explanation:
        "Your last check showed a misconception, so Ada recommends a different explanation.",
    };
  }
  if (evidence.status === "uncertain") {
    return {
      struggling: true,
      reasonCode: "uncertain",
      explanation:
        "Your last answer was too uncertain to confirm understanding, so Ada recommends a different explanation.",
    };
  }
  if (score < 50) {
    return {
      struggling: true,
      reasonCode: "low-score",
      explanation:
        "Your last check scored below half, so Ada recommends a different explanation.",
    };
  }

  // 2. Overconfidence: confident but incorrect.
  if (evidence.confidenceBefore !== null && score < 70 && evidence.confidenceBefore >= 70) {
    // The existing calibration classifier decides how strongly to word this.
    const category = classifyConfidencePerformance({
      confidence: evidence.confidenceBefore,
      score,
      status: evidence.status,
    });
    return {
      struggling: true,
      reasonCode: "confident-error",
      explanation:
        category === "confident-misconception"
          ? "You were highly confident, but the answer was incorrect. Trying a different approach may help uncover the misunderstanding."
          : "You were confident, but the check fell short. A different approach may surface what is missing.",
    };
  }

  // 3. Repeated difficulty.
  if (evidence.retries >= 1 && score < 70) {
    return {
      struggling: true,
      reasonCode: "repeated-attempts",
      explanation:
        "You've tried this check more than once, so Ada recommends changing the explanation style.",
    };
  }

  return NO_STRUGGLE;
}

export type AlternativeBasis = "concept-evidence" | "dna-ranking" | "fallback";

export interface ConceptBestApproach {
  approach: string;
  averageScore: number;
  evidenceCount: number;
}

export interface AlternativeSelection {
  dimension: LearningDimension;
  basis: AlternativeBasis;
}

/**
 * Choose the approach to propose instead of the current one.
 *
 * Preference order:
 *  1. The best approach already observed for THIS concept, once it has
 *     enough evidence to be meaningful.
 *  2. The learner's observed-effectiveness ranking from Learning DNA 2.0.
 *  3. A deterministic pedagogical fallback.
 *
 * The current dimension and every V1-excluded dimension are always removed
 * from the candidate pool, so this never proposes what is already in use.
 */
export function chooseAlternativeApproach({
  currentDimension,
  conceptBest,
  effectivenessRanking,
  totalEvidenceCount,
}: {
  currentDimension: LearningDimension;
  conceptBest: ConceptBestApproach | null;
  effectivenessRanking: LearningDimension[];
  totalEvidenceCount: number;
}): AlternativeSelection {
  const pool = DIMENSIONS.filter(
    (dimension) =>
      dimension !== currentDimension
      && !V1_EXCLUDED_DIMENSIONS.includes(dimension),
  );

  // Defensive: the pool can only empty if the dimension list changes.
  if (pool.length === 0) {
    return { dimension: "examples", basis: "fallback" };
  }

  // 1. Concept-level evidence, when there is enough of it.
  if (
    conceptBest
    && conceptBest.evidenceCount >= MIN_CONCEPT_EVIDENCE
    && isLearningDimension(conceptBest.approach)
    && pool.includes(conceptBest.approach)
  ) {
    return { dimension: conceptBest.approach, basis: "concept-evidence" };
  }

  // 2. Observed-effectiveness ranking, only once any evidence exists.
  if (totalEvidenceCount > 0) {
    const ranked = effectivenessRanking.find((dimension) => pool.includes(dimension));
    if (ranked) return { dimension: ranked, basis: "dna-ranking" };
  }

  // 3. Deterministic fallback.
  const fallback = FALLBACK_ORDER.find((dimension) => pool.includes(dimension));
  return { dimension: fallback ?? pool[0], basis: "fallback" };
}

/** Learner-facing label for a dimension, reusing the shared label map. */
export function approachLabel(dimension: LearningDimension): string {
  return learningDimensionLabels[dimension];
}

/**
 * Learner-facing provenance for a mode that came from an accepted Ada
 * proposal, keyed by the reason that triggered it.
 *
 * Used by "Why this mode?" so an Ada-proposed switch is not misreported as
 * a manual selection. Kept here, next to the reason codes, so the wording
 * and the trigger cannot drift apart.
 */
export function describeAcceptedAdaptation(
  reasonCode: StruggleReasonCode,
): string {
  switch (reasonCode) {
    case "misconception":
      return "Ada suggested a different approach because your last check showed a misconception.";
    case "uncertain":
      return "Ada suggested a different approach because your last answer was too uncertain to confirm understanding.";
    case "low-score":
      return "Ada suggested a different approach because your last check scored below half.";
    case "confident-error":
      return "Ada suggested a different approach because your confidence was high but the check showed a misunderstanding.";
    case "repeated-attempts":
      return "Ada suggested a different approach because you needed more than one attempt on the previous check.";
  }
}

/**
 * The record persisted alongside the lesson session so an accepted
 * adaptation survives a refresh. Intentionally minimal.
 */
export interface AdaptationRecord {
  from: LearningDimension;
  to: LearningDimension;
  reasonCode: StruggleReasonCode;
  at: string;
}

/** Narrow unknown persisted data back into an AdaptationRecord. */
export function normalizeAdaptationRecord(value: unknown): AdaptationRecord | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    !isLearningDimension(record.from)
    || !isLearningDimension(record.to)
    || !isStruggleReasonCode(record.reasonCode)
    || typeof record.at !== "string"
  ) {
    return null;
  }
  return {
    from: record.from,
    to: record.to,
    reasonCode: record.reasonCode,
    at: record.at.slice(0, 40),
  };
}

function isLearningDimension(value: unknown): value is LearningDimension {
  return typeof value === "string"
    && (DIMENSIONS as string[]).includes(value);
}

function isStruggleReasonCode(value: unknown): value is StruggleReasonCode {
  return typeof value === "string"
    && [
      "misconception",
      "uncertain",
      "low-score",
      "confident-error",
      "repeated-attempts",
    ].includes(value);
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}
