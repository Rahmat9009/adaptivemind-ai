/**
 * AdaptiveMind — Lesson rationale
 *
 * Explains, in one line, why Ada is teaching the current lesson the way it
 * is. This is a pure derivation over data that already exists locally
 * (Learning DNA 2.0 plus the active teaching mode). It never calls the AI
 * provider and never reads the network.
 *
 * Two distinct cases are reported honestly:
 *  - Manual mode  — the learner picked the approach, so Ada did not choose.
 *  - Adaptive     — Ada chose, and the stored recommendation reason applies.
 */

import type { LearningDimension } from "@/lib/learning-dna";
import { learningDimensionLabels } from "@/lib/learning-dna";
import type { LearningDNA2 } from "@/lib/learning-dna-v2";
import type { TeachingMode } from "@/lib/ai/types";
import { teachingModeToDimension } from "@/lib/mode-effectiveness";

/** Where the choice of approach came from. */
export type RationaleBasis =
  /** No Learning DNA at all — first run. */
  | "none"
  /** Assessment answers only, no measured outcomes yet. */
  | "stated"
  /** Measured lesson outcomes only. */
  | "observed"
  /** Both an assessment answer and measured outcomes. */
  | "both"
  /** The learner overrode the mode by hand. */
  | "manual";

export interface LessonRationale {
  dimension: LearningDimension;
  /** Human label for the dimension, e.g. "Analogies". */
  label: string;
  /** Short line shown inline, e.g. "Explained with analogies". */
  headline: string;
  /** Longer explanation revealed by the "Why?" disclosure. */
  detail: string;
  /** Total observed outcomes recorded for this dimension. */
  evidenceCount: number;
  /** Plain-language strength of the evidence behind this choice. */
  evidenceLabel: string;
  basis: RationaleBasis;
}

const DEFAULT_DIMENSION: LearningDimension = "visual";

export function describeEvidenceStrength(evidenceCount: number): string {
  if (evidenceCount <= 0) return "No outcome evidence yet";
  if (evidenceCount < 2) return "Limited evidence";
  if (evidenceCount < 6) return "Developing evidence";
  return "Established evidence";
}

function basisFor(
  dna: LearningDNA2 | null,
  dimension: LearningDimension,
  isManual: boolean,
): RationaleBasis {
  if (isManual) return "manual";
  if (!dna) return "none";
  const hasStated = dna.initialPreferences[dimension] > 0;
  const hasObserved = dna.observedEffectiveness[dimension].evidenceCount > 0;
  if (hasStated && hasObserved) return "both";
  if (hasObserved) return "observed";
  if (hasStated) return "stated";
  return "none";
}

/**
 * Build the rationale for the lesson currently on screen.
 *
 * Degrades gracefully: with no Learning DNA it still returns a complete,
 * truthful rationale rather than throwing or rendering an empty state.
 */
export function buildLessonRationale(
  dna: LearningDNA2 | null,
  teachingMode: TeachingMode,
): LessonRationale {
  const isManual = teachingMode !== "adaptive";
  const dimension = teachingModeToDimension(
    teachingMode,
    dna?.currentRecommendation ?? DEFAULT_DIMENSION,
  );
  const label = learningDimensionLabels[dimension];
  const lowerLabel = label.toLowerCase();
  const evidenceCount =
    dna?.observedEffectiveness[dimension].evidenceCount ?? 0;
  const basis = basisFor(dna, dimension, isManual);

  let detail: string;
  if (isManual) {
    detail = evidenceCount > 0
      ? `You chose ${lowerLabel} for this lesson, so Ada used it instead of its own recommendation. Ada has ${evidenceCount} recorded outcome${evidenceCount === 1 ? "" : "s"} for this approach.`
      : `You chose ${lowerLabel} for this lesson, so Ada used it instead of its own recommendation.`;
  } else if (!dna) {
    detail = `Ada is starting with ${lowerLabel} as a first attempt. Complete an understanding check and Ada will begin adapting to what actually works for you.`;
  } else if (dna.recommendationReason.trim()) {
    detail = dna.recommendationReason.trim();
  } else {
    detail = `Ada selected ${lowerLabel} from your Learning DNA.`;
  }

  return {
    dimension,
    label,
    headline: `Explained with ${lowerLabel}`,
    detail,
    evidenceCount,
    evidenceLabel: describeEvidenceStrength(evidenceCount),
    basis,
  };
}
