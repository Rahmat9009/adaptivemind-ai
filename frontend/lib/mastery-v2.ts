/**
 * AdaptiveMind 2.0 — Mastery Model (simplified Bayesian Knowledge Tracing)
 *
 * Tracks per-skill: P(K) = probability skill is known.
 *
 * Key assumptions (documented, not claimed as scientific truth):
 *  - P(T) = 0.4: probability of learning from one opportunity (conservative)
 *  - P(G) = 0.15: probability of guessing correctly while still unknown
 *  - P(S) = 0.10: probability of slipping despite knowing
 *
 * Updates after every retrieval attempt. Bounded to [0.01, 0.99].
 * Repeated identical submissions do not inflate mastery.
 */

import { normalizeTopicId } from "./mastery";

export type MasteryLabel =
  | "new"
  | "exploring"
  | "developing"
  | "understood"
  | "applied"
  | "mastered"
  | "needs-review";

export interface SkillMastery {
  skillId: string;
  topic: string;
  subject?: string;
  /** P(Known) — probability the skill is known */
  probabilityKnown: number;
  /** P(Learn) — fixed learning rate */
  probabilityLearn: number;
  /** P(Guess) — fixed guess rate */
  probabilityGuess: number;
  /** P(Slip) — fixed slip rate */
  probabilitySlip: number;
  /** Total attempts */
  attempts: number;
  /** Successful retrievals */
  successfulRetrievals: number;
  /** Last practice timestamp */
  lastPracticedAt?: string;
  /** Next review timestamp */
  nextReviewAt?: string;
  /** Learner-facing label */
  masteryLabel: MasteryLabel;
  /** Timestamp of last update (for dedup) */
  lastUpdateTimestamp?: number;
}

export const MASTERY_V2_STORAGE_KEY = "adaptivemind-mastery-v2";

// ──────────────────────────────────────
// Constants
// ──────────────────────────────────────

const DEFAULT_P_T = 0.4; // probability of learning per opportunity
const DEFAULT_P_G = 0.15; // probability of guessing correctly
const DEFAULT_P_S = 0.10; // probability of slipping

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ──────────────────────────────────────
// Create / default
// ──────────────────────────────────────

export function createSkillMastery(
  topic: string,
  subject?: string,
): SkillMastery {
  return {
    skillId: normalizeTopicId(topic),
    topic,
    subject,
    probabilityKnown: 0.1, // start low
    probabilityLearn: DEFAULT_P_T,
    probabilityGuess: DEFAULT_P_G,
    probabilitySlip: DEFAULT_P_S,
    attempts: 0,
    successfulRetrievals: 0,
    masteryLabel: "new",
  };
}

// ──────────────────────────────────────
// BKT update
// ──────────────────────────────────────

/**
 * Update BKT after a retrieval attempt.
 *
 * @param mastery — current state
 * @param correct — whether the retrieval was successful
 * @param hintUsed — whether hints were needed (reduces update weight)
 * @param dedupWindowMs — ignore updates within this window (prevents double-submit)
 * @returns updated mastery
 */
export function updateBKT(
  mastery: SkillMastery,
  correct: boolean,
  hintUsed: boolean,
  dedupWindowMs = 2000,
): SkillMastery {
  // Dedup: don't apply the same update twice within the window
  const now = Date.now();
  if (
    mastery.lastUpdateTimestamp &&
    now - mastery.lastUpdateTimestamp < dedupWindowMs
  ) {
    return mastery;
  }

  const pKnown = mastery.probabilityKnown;
  const pT = mastery.probabilityLearn;
  const pG = mastery.probabilityGuess;
  const pS = mastery.probabilitySlip;

  // Probability of observing a correct answer
  const pCorrect = pKnown * (1 - pS) + (1 - pKnown) * pG;

  if (pCorrect === 0) return mastery;

  // Bayes update: P(K | observation)
  let pKnownGivenObs: number;
  if (correct) {
    pKnownGivenObs = (pKnown * (1 - pS)) / pCorrect;
  } else {
    pKnownGivenObs = (pKnown * pS) / (1 - pCorrect);
  }

  // Apply hint penalty: hints reduce effective learning
  const hintDiscount = hintUsed ? 0.5 : 1.0;

  // Update P(K) with learning probability
  const pKnownNew =
    pKnownGivenObs + (1 - pKnownGivenObs) * pT * hintDiscount;

  const clamped = clamp(pKnownNew, 0.01, 0.99);

  const newAttempts = mastery.attempts + 1;
  const newSuccesses = mastery.successfulRetrievals + (correct ? 1 : 0);

  return {
    ...mastery,
    probabilityKnown: clamped,
    attempts: newAttempts,
    successfulRetrievals: newSuccesses,
    lastPracticedAt: new Date().toISOString(),
    masteryLabel: calculateMasteryLabel(clamped, newAttempts, newSuccesses, correct),
    lastUpdateTimestamp: now,
  };
}

// ──────────────────────────────────────
// Learner-facing labels
// ──────────────────────────────────────

export function calculateMasteryLabel(
  pKnown: number,
  attempts: number,
  successes: number,
  latestCorrect: boolean,
): MasteryLabel {
  if (attempts === 0) return "new";
  if (!latestCorrect && pKnown < 0.5) return "needs-review";
  if (pKnown >= 0.95 && successes >= 4) return "mastered";
  if (pKnown >= 0.85 && successes >= 3) return "applied";
  if (pKnown >= 0.7 && attempts >= 2) return "understood";
  if (pKnown >= 0.4 && attempts >= 1) return "developing";
  return "exploring";
}

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

export function skillRequiresReview(mastery: SkillMastery): boolean {
  if (!mastery.nextReviewAt) return false;
  return new Date(mastery.nextReviewAt) <= new Date();
}

export function skillConfidenceLabel(pKnown: number): string {
  if (pKnown >= 0.95) return "Very confident";
  if (pKnown >= 0.8) return "Confident";
  if (pKnown >= 0.5) return "Moderately confident";
  if (pKnown >= 0.3) return "Somewhat uncertain";
  return "Uncertain";
}
