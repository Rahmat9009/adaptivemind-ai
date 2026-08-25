/**
 * AdaptiveMind — Recall session helpers
 *
 * Pure glue between the retrieval-check evaluation returned by Ada and the
 * existing quick-recall / spaced-review stores. No storage access and no
 * network access happens here so the mapping stays deterministic and
 * testable.
 *
 * The persistence itself is done by completeQuickRecall(), which already
 * applies the SM-2 quality mapping and updates the review card. Nothing in
 * this module introduces a second recall system.
 */

import type { UnderstandingEvaluation } from "@/lib/ai/types";

/** The narrower result vocabulary the QuickRecall component renders. */
export type RecallResultStatus = "correct" | "partial" | "incorrect";

export interface RecallResult {
  score: number;
  status: RecallResultStatus;
  feedback: string;
}

/**
 * Collapse the four-way understanding status into the three-way recall
 * status. A misconception and an uncertain answer are both treated as
 * "incorrect" for recall purposes: neither demonstrates retrieval.
 */
export function toRecallStatus(
  status: UnderstandingEvaluation["status"],
): RecallResultStatus {
  if (status === "correct") return "correct";
  if (status === "partial") return "partial";
  return "incorrect";
}

/** Clamp a provider score into the 0-100 range the stores expect. */
export function normalizeRecallScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function toRecallResult(
  evaluation: UnderstandingEvaluation,
): RecallResult {
  return {
    score: normalizeRecallScore(evaluation.score),
    status: toRecallStatus(evaluation.status),
    feedback: evaluation.feedback,
  };
}

/**
 * The SM-2 quality that completeQuickRecall() will derive from a score.
 *
 * Mirrors lib/quick-recall.ts so the mapping can be asserted in tests
 * without reaching into storage. Kept in sync deliberately: the recall
 * flow must not invent its own scheduling rules.
 */
export function expectedSm2Quality(score: number): 1 | 2 | 3 | 4 | 5 {
  const normalized = normalizeRecallScore(score);
  if (normalized >= 80) return 5;
  if (normalized >= 60) return 4;
  if (normalized >= 40) return 3;
  if (normalized >= 20) return 2;
  return 1;
}
