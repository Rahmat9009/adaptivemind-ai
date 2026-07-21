/**
 * AdaptiveMind 2.0 — Explanation History
 *
 * Per-concept record of every approach tried, its outcome, and what was learned.
 * Separate from ordinary lesson history — this is about tracking which teaching
 * approaches have been tested and how they performed for each concept.
 */
import type { LearningDimension } from "@/lib/learning-dna";
import { normalizeTopicId } from "@/lib/mastery";

export const EXPLANATION_HISTORY_KEY = "adaptivemind-explanation-history";
export const MAX_ENTRIES_PER_CONCEPT = 20;
export const MAX_CONCEPTS = 100;

export interface ExplanationRecord {
  /** Normalized concept/skill ID */
  conceptId: string;
  /** Display-friendly concept name */
  conceptLabel: string;
  /** When this explanation happened */
  timestamp: string;
  /** Teaching approach used */
  approach: LearningDimension | "adaptive";
  /** Lesson or explanation ID (conversation history ID) */
  lessonId: string;
  /** Reason the approach was selected */
  reasonSelected: string;
  /** Learner's self-reported confidence before check (0–100, -1 if not reported) */
  learnerConfidence: number;
  /** Type of understanding check performed */
  checkType: "understanding" | "explain-back" | "quick-recall" | "retrieval" | "peer-agent";
  /** Evaluation result status */
  evaluationStatus: "correct" | "partial" | "misconception" | "uncertain";
  /** Evaluation score (0–100) */
  evaluationScore: number;
  /** Number of hints used */
  hintsUsed: number;
  /** Number of retries */
  retries: number;
  /** Mastery probability BEFORE this check */
  masteryBefore: number;
  /** Mastery probability AFTER this check */
  masteryAfter: number;
  /** Whether the learner switched away from this approach mid-lesson */
  switchedAway: boolean;
  /** Learner's explicit feedback: null | "helped" | "somewhat" | "not-helpful" */
  learnerFeedback: "helped" | "somewhat" | "not-helpful" | null;
  /** What Ada recommended after this check */
  recommendationOutcome: string;
}

export interface ExplanationHistory {
  /** Per-concept records, keyed by normalized concept ID */
  concepts: Record<string, ExplanationRecord[]>;
  /** Order concepts were first encountered */
  conceptOrder: string[];
}

// ──────────────────────────────────────
// Storage
// ──────────────────────────────────────

export function loadExplanationHistory(): ExplanationHistory {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(EXPLANATION_HISTORY_KEY) ?? "null",
    );
    if (!value || typeof value !== "object") return { concepts: {}, conceptOrder: [] };
    const raw = value as Record<string, unknown>;
    const concepts = raw.concepts as Record<string, ExplanationRecord[]> | undefined;
    const conceptOrder = raw.conceptOrder as string[] | undefined;
    if (!concepts || !Array.isArray(conceptOrder)) return { concepts: {}, conceptOrder: [] };
    // Validate concept order matches keys
    const validOrder = conceptOrder.filter((id) => id in concepts);
    return { concepts, conceptOrder: validOrder };
  } catch {
    return { concepts: {}, conceptOrder: [] };
  }
}

export function saveExplanationHistory(history: ExplanationHistory): void {
  localStorage.setItem(EXPLANATION_HISTORY_KEY, JSON.stringify(history));
}

// ──────────────────────────────────────
// Record functions
// ──────────────────────────────────────

export function addExplanationRecord(
  record: ExplanationRecord,
): ExplanationHistory {
  const history = loadExplanationHistory();
  const conceptId = record.conceptId;

  // Initialize concept array if needed
  if (!history.concepts[conceptId]) {
    history.concepts[conceptId] = [];
    history.conceptOrder.push(conceptId);
    // Keep concept order bounded
    if (history.conceptOrder.length > MAX_CONCEPTS) {
      const removed = history.conceptOrder.shift()!;
      delete history.concepts[removed];
    }
  }

  // Deduplicate: skip if same lessonId + same checkType already exists
  const existing = history.concepts[conceptId];
  const isDuplicate = existing.some(
    (r) => r.lessonId === record.lessonId && r.checkType === record.checkType,
  );
  if (isDuplicate) return history;

  // Add new record
  existing.unshift(record);

  // Bound per-concept size
  if (existing.length > MAX_ENTRIES_PER_CONCEPT) {
    existing.length = MAX_ENTRIES_PER_CONCEPT;
  }

  saveExplanationHistory(history);
  return history;
}

// ──────────────────────────────────────
// Query functions
// ──────────────────────────────────────

export function getExplanationHistoryForConcept(
  conceptLabel: string,
): ExplanationRecord[] {
  const conceptId = normalizeTopicId(conceptLabel);
  const history = loadExplanationHistory();
  return history.concepts[conceptId] ?? [];
}

export function getBestApproachForConcept(
  conceptLabel: string,
): { approach: string; averageScore: number; evidenceCount: number } | null {
  const records = getExplanationHistoryForConcept(conceptLabel);
  if (records.length === 0) return null;

  const byApproach = new Map<string, { total: number; count: number }>();
  for (const r of records) {
    const key = r.approach;
    const entry = byApproach.get(key) ?? { total: 0, count: 0 };
    entry.total += r.evaluationScore;
    entry.count += 1;
    byApproach.set(key, entry);
  }

  let best: { approach: string; averageScore: number; evidenceCount: number } | null = null;
  for (const [approach, stats] of byApproach) {
    const avg = stats.total / stats.count;
    if (!best || avg > best.averageScore) {
      best = { approach, averageScore: Math.round(avg), evidenceCount: stats.count };
    }
  }
  return best;
}

export function getConceptSummary(
  conceptLabel: string,
): {
  totalAttempts: number;
  approachesTried: string[];
  bestApproach: string | null;
  averageScore: number;
  hintsTotal: number;
} {
  const records = getExplanationHistoryForConcept(conceptLabel);
  if (records.length === 0) {
    return { totalAttempts: 0, approachesTried: [], bestApproach: null, averageScore: 0, hintsTotal: 0 };
  }

  const approaches = new Set<string>();
  let totalScore = 0;
  let totalHints = 0;
  for (const r of records) {
    approaches.add(r.approach);
    totalScore += r.evaluationScore;
    totalHints += r.hintsUsed;
  }

  const best = getBestApproachForConcept(conceptLabel);
  return {
    totalAttempts: records.length,
    approachesTried: Array.from(approaches),
    bestApproach: best?.approach ?? null,
    averageScore: Math.round(totalScore / records.length),
    hintsTotal: totalHints,
  };
}
