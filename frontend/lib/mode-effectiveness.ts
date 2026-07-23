/**
 * AdaptiveMind 2.0 — Mode Effectiveness Engine
 *
 * Uses Thompson sampling to balance exploration (trying new approaches)
 * with exploitation (using what has worked). Each approach maintains a
 * Beta distribution (alpha = successes + 1, beta = failures + 1).
 *
 * Selection strategy:
 *  - Always allow manual override.
 *  - Default selection samples from the posterior of each approach.
 *  - Exploration probability decays with total evidence.
 *  - Low evidence → wide posterior → naturally more exploration.
 */

import type { LearningDimension } from "@/lib/learning-dna";
import type { TeachingMode } from "@/lib/ai/types";

const DIMENSIONS: LearningDimension[] = [
  "visual",
  "examples",
  "analogies",
  "stories",
  "challenges",
];

const DIMENSION_NAMES: Record<LearningDimension, string> = {
  visual: "Visual",
  examples: "Examples",
  analogies: "Analogies",
  stories: "Stories",
  challenges: "Challenges",
};

const MODE_TO_DIMENSION: Record<
  Exclude<TeachingMode, "adaptive">,
  LearningDimension
> = {
  visual: "visual",
  example: "examples",
  analogy: "analogies",
  story: "stories",
  challenge: "challenges",
};

export function teachingModeToDimension(
  mode: TeachingMode,
  adaptiveRecommendation: LearningDimension = "visual",
): LearningDimension {
  return mode === "adaptive"
    ? adaptiveRecommendation
    : MODE_TO_DIMENSION[mode];
}

export function dimensionToTeachingMode(
  dimension: LearningDimension,
): Exclude<TeachingMode, "adaptive"> {
  const entry = Object.entries(MODE_TO_DIMENSION).find(
    ([, candidate]) => candidate === dimension,
  );
  return (entry?.[0] ?? "visual") as Exclude<TeachingMode, "adaptive">;
}

// ──────────────────────────────────────
// Approach state (survival of checked attempts)
// ──────────────────────────────────────

export interface ApproachBetaState {
  dimension: LearningDimension;
  alpha: number; // successes + 1
  beta: number; // failures + 1
  evidenceCount: number;
}

export function defaultApproachState(): ApproachBetaState[] {
  return DIMENSIONS.map((dim) => ({
    dimension: dim,
    alpha: 1,
    beta: 1,
    evidenceCount: 0,
  }));
}

// ──────────────────────────────────────
// Update — record outcome
// ──────────────────────────────────────

export function updateApproachState(
  state: ApproachBetaState[],
  dimension: LearningDimension,
  success: boolean,
): ApproachBetaState[] {
  return state.map((s) => {
    if (s.dimension !== dimension) return s;
    return {
      ...s,
      alpha: s.alpha + (success ? 1 : 0),
      beta: s.beta + (success ? 0 : 1),
      evidenceCount: s.evidenceCount + 1,
    };
  });
}

// ──────────────────────────────────────
// Thompson sampling selection
// ──────────────────────────────────────

/**
 * Sample from Beta distribution using the transformed Gamma method.
 */
function sampleBeta(alpha: number, betaParam: number): number {
  const gamma1 = sampleGamma(alpha);
  const gamma2 = sampleGamma(betaParam);
  if (gamma1 + gamma2 === 0) return 0.5;
  return gamma1 / (gamma1 + gamma2);
}

/**
 * Marsaglia-Tsang method for Gamma(shape, 1).
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    // For α < 1, use the gamma-small trick
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  let result = 0;
  while (result === 0) {
    const x = (function () {
      // Box-Muller approximation
      let u = 0;
      let v = 0;
      while (u === 0) {
        u = Math.random();
        v = Math.random();
      }
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.pow(1 + c * z, 3);
    })();
    if (x > 0) {
      result = d * x;
    }
  }
  return result;
}

/**
 * Select the best approach using Thompson sampling.
 *
 * @param state — current Beta states per approach
 * @param options.forcedDimension — if set, skip sampling and return this
 * @param options.explorationRate — overrides automatic rate (0–1)
 * @returns selected dimension and whether it was an exploration choice
 */
export function selectApproach(
  state: ApproachBetaState[],
  options?: {
    forcedDimension?: LearningDimension;
    explorationRate?: number;
    preferenceWeight?: Record<LearningDimension, number>;
  },
): { dimension: LearningDimension; explored: boolean; sampledScores: Record<LearningDimension, number> } {
  // Manual override
  if (options?.forcedDimension) {
    return {
      dimension: options.forcedDimension,
      explored: false,
      sampledScores: {} as Record<LearningDimension, number>,
    };
  }

  const totalEvidence = state.reduce((s, a) => s + a.evidenceCount, 0);

  // Exploration rate decays with evidence: 0.4 at 0 → 0.05 at 40+
  const autoExplorationRate = clamp(0.4 - (totalEvidence / 100) * 0.35, 0.05, 0.4);
  const explorationRate =
    options?.explorationRate ?? autoExplorationRate;

  // Should we explore?
  const shouldExplore = Math.random() < explorationRate;

  const sampledScores = {} as Record<LearningDimension, number>;

  if (shouldExplore && totalEvidence > 0) {
    // Exploration: sample each approach and pick the best sample
    for (const dim of DIMENSIONS) {
      const betaState = state.find((s) => s.dimension === dim)!;
      sampledScores[dim] = sampleBeta(betaState.alpha, betaState.beta);
    }
    // Boost by preference weight if provided
    if (options?.preferenceWeight) {
      for (const dim of DIMENSIONS) {
        sampledScores[dim] =
          sampledScores[dim] * (1 - 0.3) +
          (options.preferenceWeight[dim] / 100) * 0.3;
      }
    }
    const best = DIMENSIONS.reduce((a, b) =>
      sampledScores[a] >= sampledScores[b] ? a : b,
    );
    return { dimension: best, explored: true, sampledScores };
  }

  // Exploitation: pick the approach with highest mean posterior
  for (const dim of DIMENSIONS) {
    const betaState = state.find((s) => s.dimension === dim)!;
    const mean =
      totalEvidence === 0
        ? (options?.preferenceWeight?.[dim] ?? 50) / 100
        : betaState.alpha / (betaState.alpha + betaState.beta);
    sampledScores[dim] = mean;
  }

  // Blend with preference weight for initial guidance
  if (totalEvidence === 0 && options?.preferenceWeight) {
    for (const dim of DIMENSIONS) {
      sampledScores[dim] =
        sampledScores[dim] * 0.5 + (options.preferenceWeight[dim] / 100) * 0.5;
    }
  }

  const best = DIMENSIONS.reduce((a, b) =>
    sampledScores[a] >= sampledScores[b] ? a : b,
  );

  return { dimension: best, explored: shouldExplore, sampledScores };
}

// ──────────────────────────────────────
// Explain
// ──────────────────────────────────────

export function explainSelection(
  dimension: LearningDimension,
  explored: boolean,
  state: ApproachBetaState[],
  totalEvidence: number,
): string {
  if (totalEvidence === 0) {
    return `No lesson data yet. Trying ${DIMENSION_NAMES[dimension]} as a starting point.`;
  }
  if (explored) {
    return `Exploring: trying ${DIMENSION_NAMES[dimension]} to gather more evidence.`;
  }
  const betaState = state.find((s) => s.dimension === dimension)!;
  const successRate = Math.round(
    (betaState.alpha / (betaState.alpha + betaState.beta)) * 100,
  );
  return `${DIMENSION_NAMES[dimension]} has a ${successRate}% success rate across ${betaState.evidenceCount} uses.`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
