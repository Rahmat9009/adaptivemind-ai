/**
 * AdaptiveMind 2.0 — Learning DNA 2.0
 *
 * Repositioned from "detecting learning styles" to "tracking which explanation
 * approaches measurably improve understanding."
 *
 * Combines stated preference (the initial assessment) with observed
 * effectiveness from actual lesson outcomes.
 */

import type { LearningDimension, LearningScores } from "@/lib/learning-dna";

// ──────────────────────────────────────
// Approach Evidence
// ──────────────────────────────────────

export interface ApproachEvidence {
  /** Stated preference from the initial assessment (0–100) */
  statedPreference: number;
  /** How many times this approach was used */
  usageCount: number;
  /** How many times the learner switched away from this approach */
  switchAwayCount: number;
  /** Successful understanding checks using this approach */
  successfulChecks: number;
  /** Total understanding checks using this approach */
  totalChecks: number;
  /** Average check score (0–100) */
  averageCheckScore: number;
  /** Average confidence before check (0–100) */
  averageConfidenceBefore: number;
  /** Average confidence after check (0–100) */
  averageConfidenceAfter: number;
  /** How many hints were requested */
  hintRequests: number;
  /** How many retries occurred */
  retries: number;
  /**
   * Weighted effectiveness score (0–100).
   * Higher = approach measurably improves understanding.
   */
  weightedEffectiveness: number;
  /** Total pieces of evidence collected */
  evidenceCount: number;
  /** Recent evidence identifiers used to prevent duplicate submissions */
  recentEvidenceIds: string[];
  /** When this approach was last used */
  lastUsedAt?: string;
}

// ──────────────────────────────────────
// Skill Mastery (simplified Bayesian)
// ──────────────────────────────────────

export type MasteryLabel =
  | "new"
  | "exploring"
  | "developing"
  | "understood"
  | "applied"
  | "mastered"
  | "needs-review";

export interface SkillMasteryState {
  skillId: string;
  topic: string;
  subject?: string;
  /** P(K) — probability the skill is already known */
  probabilityKnown: number;
  /** P(T) — probability of learning after an opportunity */
  probabilityLearn: number;
  /** P(G) — probability of guessing correctly */
  probabilityGuess: number;
  /** P(S) — probability of slipping despite knowing */
  probabilitySlip: number;
  /** Number of learning opportunities */
  attempts: number;
  /** Number of successful retrievals */
  successfulRetrievals: number;
  /** Last practice timestamp */
  lastPracticedAt?: string;
  /** Next review timestamp (from spaced-repetition) */
  nextReviewAt?: string;
  /** Learner-facing label */
  masteryLabel: MasteryLabel;
}

// ──────────────────────────────────────
// Learning DNA 2.0
// ──────────────────────────────────────

export const LEARNING_DNA_V2_STORAGE_KEY = "adaptivemind-learning-dna-v2";

/**
 * LearningDNA2 combines initial stated preferences with observed
 * effectiveness from actual lesson outcomes. Evidence accumulates with
 * use; early recommendations have low confidence.
 */
export interface LearningDNA2 {
  version: 2;
  /** Preferences from the initial assessment (0–100) */
  initialPreferences: Record<LearningDimension, number>;
  /** Observed effectiveness per approach */
  observedEffectiveness: Record<LearningDimension, ApproachEvidence>;
  /** The currently recommended approach */
  currentRecommendation: LearningDimension;
  /** Confidence in the recommendation (0–100) */
  recommendationConfidence: number;
  /** Human-readable explanation for the recommendation */
  recommendationReason: string;
  /** One-line summary of available evidence */
  evidenceSummary: string;
  /** Last update timestamp */
  updatedAt: string;
}

// ──────────────────────────────────────
// Safe defaults
// ──────────────────────────────────────

const DIMENSIONS: LearningDimension[] = [
  "visual",
  "examples",
  "analogies",
  "stories",
  "challenges",
];

function emptyApproachEvidence(): ApproachEvidence {
  return {
    statedPreference: 50,
    usageCount: 0,
    switchAwayCount: 0,
    successfulChecks: 0,
    totalChecks: 0,
    averageCheckScore: 0,
    averageConfidenceBefore: 0,
    averageConfidenceAfter: 0,
    hintRequests: 0,
    retries: 0,
    weightedEffectiveness: 50,
    evidenceCount: 0,
    recentEvidenceIds: [],
  };
}

export function emptyLearningDNA2(): LearningDNA2 {
  const initialPreferences = {} as Record<LearningDimension, number>;
  const observedEffectiveness = {} as Record<LearningDimension, ApproachEvidence>;

  for (const dim of DIMENSIONS) {
    initialPreferences[dim] = 50;
    observedEffectiveness[dim] = emptyApproachEvidence();
  }

  return {
    version: 2,
    initialPreferences,
    observedEffectiveness,
    currentRecommendation: "visual",
    recommendationConfidence: 0,
    recommendationReason:
      "Not enough evidence yet. Try a few lessons to help AdaptiveMind learn what works.",
    evidenceSummary: "No lesson data collected yet.",
    updatedAt: new Date().toISOString(),
  };
}

// ──────────────────────────────────────
// Migration from v1 (old LearningScores)
// ──────────────────────────────────────

const V1_STORAGE_KEY = "adaptivemind-learning-dna";

interface V1StoredProfile {
  selectedAnswers?: Array<number | null>;
  scores?: LearningScores;
  primaryLearningStyle?: string;
  completedAt?: string | null;
}

function isV1StoredProfile(value: unknown): value is V1StoredProfile {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.scores !== undefined || record.selectedAnswers !== undefined
  );
}

function isLearningScores(value: unknown): value is LearningScores {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return DIMENSIONS.every(
    (dim) => typeof record[dim] === "number" && record[dim] >= 0 && record[dim] <= 100,
  );
}

/**
 * Migrate an old v1 LearningScores object into LearningDNA2.
 * Old scores become `initialPreferences`. Observed effectiveness
 * starts empty. Old topics no longer map to v2 without lesson data,
 * so we treat the migration as a fresh start for observed data.
 */
export function migrateLearningDNA(
  existingV2: unknown,
  existingV1: unknown,
): LearningDNA2 {
  const normalizedV2 = normalizeLearningDNA2(existingV2);
  if (normalizedV2) return normalizedV2;

  const fresh = emptyLearningDNA2();

  // Try to migrate from v1 profile
  if (isV1StoredProfile(existingV1) && existingV1.scores && isLearningScores(existingV1.scores)) {
    for (const dim of DIMENSIONS) {
      const score = existingV1.scores[dim];
      const clamped = clamp(score, 0, 100);
      fresh.initialPreferences[dim] = clamped;
      fresh.observedEffectiveness[dim].statedPreference = clamped;
    }
    // Build initial recommendation from migrated preferences
    const ranked = getRankedDimensions(fresh.initialPreferences);
    fresh.currentRecommendation = ranked[0];
    fresh.recommendationConfidence = 15; // low — no observed data yet
    fresh.recommendationReason =
      "Based on your initial preferences, but lesson outcomes will refine this over time.";
    fresh.evidenceSummary =
      "Migrated from a previous profile. Lesson outcomes will gradually replace initial preferences.";
    return fresh;
  }

  return fresh;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function normalizeLearningDNA2(value: unknown): LearningDNA2 | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    record.version !== 2
    || typeof record.initialPreferences !== "object"
    || record.initialPreferences === null
    || typeof record.observedEffectiveness !== "object"
    || record.observedEffectiveness === null
  ) {
    return null;
  }

  const fresh = emptyLearningDNA2();
  const initial = record.initialPreferences as Record<string, unknown>;
  const observed = record.observedEffectiveness as Record<string, unknown>;

  for (const dimension of DIMENSIONS) {
    fresh.initialPreferences[dimension] = clamp(
      finiteNumber(initial[dimension], 50),
      0,
      100,
    );
    const rawEvidence = typeof observed[dimension] === "object"
      && observed[dimension] !== null
      ? observed[dimension] as Record<string, unknown>
      : {};
    const fallback = emptyApproachEvidence();
    fresh.observedEffectiveness[dimension] = {
      statedPreference: clamp(
        finiteNumber(
          rawEvidence.statedPreference,
          fresh.initialPreferences[dimension],
        ),
        0,
        100,
      ),
      usageCount: clamp(finiteNumber(rawEvidence.usageCount, 0), 0, 10_000),
      switchAwayCount: clamp(
        finiteNumber(rawEvidence.switchAwayCount, 0),
        0,
        10_000,
      ),
      successfulChecks: clamp(
        finiteNumber(rawEvidence.successfulChecks, 0),
        0,
        10_000,
      ),
      totalChecks: clamp(finiteNumber(rawEvidence.totalChecks, 0), 0, 10_000),
      averageCheckScore: clamp(
        finiteNumber(rawEvidence.averageCheckScore, 0),
        0,
        100,
      ),
      averageConfidenceBefore: clamp(
        finiteNumber(rawEvidence.averageConfidenceBefore, 0),
        0,
        100,
      ),
      averageConfidenceAfter: clamp(
        finiteNumber(rawEvidence.averageConfidenceAfter, 0),
        0,
        100,
      ),
      hintRequests: clamp(
        finiteNumber(rawEvidence.hintRequests, 0),
        0,
        10_000,
      ),
      retries: clamp(finiteNumber(rawEvidence.retries, 0), 0, 10_000),
      weightedEffectiveness: clamp(
        finiteNumber(rawEvidence.weightedEffectiveness, 50),
        0,
        100,
      ),
      evidenceCount: clamp(
        finiteNumber(rawEvidence.evidenceCount, 0),
        0,
        10_000,
      ),
      recentEvidenceIds: Array.isArray(rawEvidence.recentEvidenceIds)
        ? rawEvidence.recentEvidenceIds
            .filter((item): item is string => typeof item === "string")
            .slice(0, 30)
        : fallback.recentEvidenceIds,
      lastUsedAt: typeof rawEvidence.lastUsedAt === "string"
        ? rawEvidence.lastUsedAt
        : undefined,
    };
  }

  fresh.currentRecommendation = DIMENSIONS.includes(
    record.currentRecommendation as LearningDimension,
  )
    ? record.currentRecommendation as LearningDimension
    : getRankedDimensions(fresh.initialPreferences)[0];
  fresh.recommendationConfidence = clamp(
    finiteNumber(record.recommendationConfidence, 5),
    0,
    100,
  );
  fresh.recommendationReason = typeof record.recommendationReason === "string"
    ? record.recommendationReason.slice(0, 500)
    : fresh.recommendationReason;
  fresh.evidenceSummary = typeof record.evidenceSummary === "string"
    ? record.evidenceSummary.slice(0, 500)
    : fresh.evidenceSummary;
  fresh.updatedAt = typeof record.updatedAt === "string"
    ? record.updatedAt
    : fresh.updatedAt;
  return fresh;
}

// ──────────────────────────────────────
// Storage
// ──────────────────────────────────────

export function loadLearningDNA2(): LearningDNA2 {
  const read = (key: string): unknown => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "null");
    } catch {
      return null;
    }
  };
  const migrated = migrateLearningDNA(
    read(LEARNING_DNA_V2_STORAGE_KEY),
    read(V1_STORAGE_KEY),
  );
  saveLearningDNA2(migrated);
  return migrated;
}

export function saveLearningDNA2(dna: LearningDNA2): void {
  try {
    localStorage.setItem(LEARNING_DNA_V2_STORAGE_KEY, JSON.stringify(dna));
  } catch {
    // Learning continues even when browser storage is unavailable.
  }
}

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRankedDimensions(
  scores: Record<LearningDimension, number>,
): LearningDimension[] {
  return [...DIMENSIONS].sort((a, b) => scores[b] - scores[a]);
}

/**
 * Get the stated-preference-only ranking (from initial assessment).
 */
export function getPreferencesRanking(
  dna: LearningDNA2,
): LearningDimension[] {
  return getRankedDimensions(dna.initialPreferences);
}

/**
 * Get the observed-effectiveness ranking.
 */
export function getEffectivenessRanking(
  dna: LearningDNA2,
): LearningDimension[] {
  const scores = {} as Record<LearningDimension, number>;
  for (const dim of DIMENSIONS) {
    scores[dim] = dna.observedEffectiveness[dim].weightedEffectiveness;
  }
  return getRankedDimensions(scores);
}

/**
 * Combine stated preference and observed effectiveness into a single
 * score used for recommendation. Observed effectiveness weights more
 * heavily as evidence accumulates.
 */
export function getCombinedScore(
  dna: LearningDNA2,
  dimension: LearningDimension,
): number {
  const stated = dna.initialPreferences[dimension];
  const observed = dna.observedEffectiveness[dimension];
  const evidenceWeight = clamp(observed.evidenceCount / 10, 0, 0.8);
  const statedWeight = 1 - evidenceWeight;
  return clamp(
    stated * statedWeight + observed.weightedEffectiveness * evidenceWeight,
    0,
    100,
  );
}

/**
 * Compute overall recommendation confidence (0–100).
 * Low when evidence is scarce.
 */
export function computeRecommendationConfidence(
  dna: LearningDNA2,
): number {
  const totalEvidence = DIMENSIONS.reduce(
    (sum, dim) => sum + dna.observedEffectiveness[dim].evidenceCount,
    0,
  );
  // Sigmoid-like: at 0 evidence → 10%, at 20+ → ~75%
  return clamp(Math.round((1 - 1 / (1 + totalEvidence / 8)) * 100), 5, 95);
}

/**
 * Generate a human-readable recommendation with reason.
 */
export function generateRecommendation(
  dna: LearningDNA2,
): {
  recommendation: LearningDimension;
  confidence: number;
  reason: string;
  evidenceSummary: string;
} {
  const confidence = computeRecommendationConfidence(dna);
  const ranked = getRankedDimensions(
    Object.fromEntries(
      DIMENSIONS.map((dim) => [dim, getCombinedScore(dna, dim)]),
    ) as Record<LearningDimension, number>,
  );
  const top = ranked[0];
  const second = ranked[1];
  const topEvidence = dna.observedEffectiveness[top];
  const secondEffective = dna.observedEffectiveness[second].weightedEffectiveness;

  // Build a reason
  let reason: string;
  let evidenceSummary: string;

  if (confidence < 30) {
    reason = `Not enough evidence yet. Try lessons in a few different modes to help AdaptiveMind learn what works for you.`;
    evidenceSummary = `Limited evidence (${DIMENSIONS.reduce((s, d) => s + dna.observedEffectiveness[d].evidenceCount, 0)} total observations).`;
  } else if (topEvidence.weightedEffectiveness > secondEffective + 15) {
    reason = `${capitalize(top)} explanations have the strongest observed effectiveness so far (${topEvidence.weightedEffectiveness}% estimate over ${topEvidence.evidenceCount} checks).`;
    evidenceSummary = `Based on ${topEvidence.evidenceCount} uses with ${topEvidence.successfulChecks} successful checks.`;
  } else {
    reason = `${capitalize(top)} and ${capitalize(second)} approaches are both working well. Either would be a strong choice.`;
    evidenceSummary = `Your top approaches have similar effectiveness scores.`;
  }

  return {
    recommendation: top,
    confidence,
    reason,
    evidenceSummary,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Record an understanding-check outcome per approach and update
 * approach evidence.
 */
export function recordCheckOutcome(
  dna: LearningDNA2,
  approach: LearningDimension,
  outcome: {
    score: number;
    confidenceBefore: number;
    confidenceAfter: number;
    hintCount: number;
    retryCount: number;
    switchedAway: boolean;
    evidenceId?: string;
  },
): LearningDNA2 {
  const ev = dna.observedEffectiveness[approach];
  if (
    outcome.evidenceId
    && ev.recentEvidenceIds.includes(outcome.evidenceId)
  ) {
    return dna;
  }
  const boundedScore = clamp(outcome.score, 0, 100);
  const boundedConfidenceBefore = clamp(outcome.confidenceBefore, 0, 100);
  const boundedConfidenceAfter = clamp(outcome.confidenceAfter, 0, 100);
  const newTotalChecks = ev.totalChecks + 1;
  const newSuccessCount =
    ev.successfulChecks + (boundedScore >= 70 ? 1 : 0);

  const newAverageScore =
    (ev.averageCheckScore * ev.totalChecks + boundedScore) / newTotalChecks;

  const newAvgConfBefore =
    (ev.averageConfidenceBefore * ev.totalChecks + boundedConfidenceBefore) /
    newTotalChecks;

  const newAvgConfAfter =
    (ev.averageConfidenceAfter * ev.totalChecks + boundedConfidenceAfter) /
    newTotalChecks;

  // Calculate weighted effectiveness: blend success rate, hint penalty,
  // retry penalty, confidence calibration
  const successRate = newTotalChecks > 0 ? newSuccessCount / newTotalChecks : 0.5;
  const hintPenalty = clamp(1 - outcome.hintCount * 0.1, 0.5, 1);
  const retryPenalty = clamp(1 - outcome.retryCount * 0.1, 0.5, 1);
  const confidenceCalibration =
    boundedConfidenceAfter > boundedConfidenceBefore + 20
      ? 1.1
      : boundedConfidenceAfter < boundedConfidenceBefore - 20
        ? 0.9
        : 1.0;

  const newEffectiveness = clamp(
    Math.round(
      successRate * 100 * hintPenalty * retryPenalty * confidenceCalibration,
    ),
    0,
    100,
  );

  const updated: ApproachEvidence = {
    ...ev,
    usageCount: ev.usageCount + 1,
    successfulChecks: newSuccessCount,
    totalChecks: newTotalChecks,
    averageCheckScore: Math.round(newAverageScore),
    averageConfidenceBefore: Math.round(newAvgConfBefore),
    averageConfidenceAfter: Math.round(newAvgConfAfter),
    retries: ev.retries + outcome.retryCount,
    hintRequests: ev.hintRequests + outcome.hintCount,
    weightedEffectiveness: newEffectiveness,
    evidenceCount: ev.evidenceCount + 1,
    recentEvidenceIds: outcome.evidenceId
      ? [outcome.evidenceId, ...ev.recentEvidenceIds].slice(0, 30)
      : ev.recentEvidenceIds,
    switchAwayCount: ev.switchAwayCount + (outcome.switchedAway ? 1 : 0),
    lastUsedAt: new Date().toISOString(),
  };

  const result: LearningDNA2 = {
    ...dna,
    observedEffectiveness: { ...dna.observedEffectiveness, [approach]: updated },
    updatedAt: new Date().toISOString(),
  };

  // Recompute recommendation
  const rec = generateRecommendation(result);
  result.currentRecommendation = rec.recommendation;
  result.recommendationConfidence = rec.confidence;
  result.recommendationReason = rec.reason;
  result.evidenceSummary = rec.evidenceSummary;

  return result;
}
