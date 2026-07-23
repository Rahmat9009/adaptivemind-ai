/**
 * AdaptiveMind 2.0 — Quick Recall Re-Checks
 *
 * Lightweight delayed re-checks separate from full lesson review.
 * Tests retention with one focused question (30-60 seconds).
 * Updates mastery and spaced-review scheduling conservatively.
 */

import { normalizeTopicId } from "@/lib/mastery";
import { loadReviewCards, upsertReviewCard, updateReviewCard } from "@/lib/spaced-review";

export const QUICK_RECALL_KEY = "adaptivemind-quick-recalls";
export const MIN_INTERVAL_HOURS = 1; // Min delay before a quick recall is due
export const SIMULATED_DELAY_MS = 2000; // Demo-only simulated delay
export const MAX_RETRIES = 2;

export type QuickRecallStatus =
  | "due"
  | "completed"
  | "full-review-recommended"
  | "not-due";

export interface QuickRecallRecord {
  /** Normalized concept ID */
  skillId: string;
  /** Display topic name */
  topic: string;
  /** Subject area */
  subject?: string;
  /** When the check was created (triggered by lesson completion) */
  createdAt: string;
  /** When the recall becomes due */
  dueAt: string;
  /** Last completed check */
  lastCompletedAt?: string;
  /** Number of retries used */
  retries: number;
  /** Best score across attempts */
  bestScore: number;
  /** Whether full review was recommended */
  fullReviewRecommended: boolean;
  /** Whether the recall was ever completed */
  completed: boolean;
  /** Focused retrieval/application question saved for offline display */
  question: string;
  /** Whether this record uses an accelerated demonstration delay */
  simulated: boolean;
}

interface QuickRecallStore {
  records: QuickRecallRecord[];
}

// ──────────────────────────────────────
// Storage
// ──────────────────────────────────────

export function loadQuickRecalls(): QuickRecallRecord[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(QUICK_RECALL_KEY) ?? "null",
    );
    if (!value || typeof value !== "object") return [];
    const store = value as QuickRecallStore;
    if (!Array.isArray(store.records)) return [];
    return store.records
      .filter(
        (r) =>
          typeof r.skillId === "string" &&
          typeof r.topic === "string" &&
          typeof r.createdAt === "string" &&
          typeof r.dueAt === "string",
      )
      .map((record) => ({
        ...record,
        question: typeof record.question === "string" && record.question.trim()
          ? record.question.slice(0, 500)
          : `Without looking back, explain the central idea of ${record.topic} and give one consequence or use.`,
        simulated: record.simulated === true,
      }))
      .slice(-100);
  } catch {
    return [];
  }
}

export function saveQuickRecalls(records: QuickRecallRecord[]): void {
  const store: QuickRecallStore = { records: records.slice(-100) };
  try {
    localStorage.setItem(QUICK_RECALL_KEY, JSON.stringify(store));
  } catch {
    // Review scheduling is optional when local storage is unavailable.
  }
}

// ──────────────────────────────────────
// Scheduling
// ──────────────────────────────────────

/**
 * Schedule a quick recall check after lesson completion.
 * Uses SM-2 interval data if available, otherwise defaults to 1 day.
 */
export function scheduleQuickRecall(
  skillId: string,
  topic: string,
  subject?: string,
  simulatedDelay = false,
  question?: string,
): QuickRecallRecord {
  const records = loadQuickRecalls();

  // Check if a record already exists
  const existing = records.find(
    (r) => r.skillId === normalizeTopicId(skillId) && !r.completed,
  );
  if (existing) return existing;

  // Calculate due time based on spaced review card or default
  const cards = loadReviewCards();
  const card = cards.find((c) => c.skillId === normalizeTopicId(skillId));
  // SM-2 interval is in days; scale to hours for quick recall
  const intervalDays = card?.interval ?? 1;
  const intervalHours = Math.max(MIN_INTERVAL_HOURS, simulatedDelay ? 0 : intervalDays * 2);
  const intervalMs = simulatedDelay
    ? SIMULATED_DELAY_MS + 100
    : intervalHours * 60 * 60 * 1000;

  const dueAt = new Date(Date.now() + intervalMs).toISOString();

  const record: QuickRecallRecord = {
    skillId: normalizeTopicId(skillId),
    topic,
    subject,
    createdAt: new Date().toISOString(),
    dueAt,
    retries: 0,
    bestScore: 0,
    fullReviewRecommended: false,
    completed: false,
    question: question?.trim().slice(0, 500)
      || `Without looking back, explain the central idea of ${topic} and give one consequence or use.`,
    simulated: simulatedDelay,
  };

  records.push(record);
  saveQuickRecalls(records);
  return record;
}

/**
 * Record the outcome of a quick recall check.
 */
export function completeQuickRecall(
  skillId: string,
  score: number,
): { updated: QuickRecallRecord; masteryDelta: number } {
  const records = loadQuickRecalls();
  const normalizedId = normalizeTopicId(skillId);
  const idx = records.findIndex(
    (r) => r.skillId === normalizedId && !r.completed,
  );
  if (idx === -1) throw new Error("No pending quick recall found");

  const record = records[idx];

  // Update card in spaced review
  try {
    const quality =
      score >= 80 ? 5 : score >= 60 ? 4 : score >= 40 ? 3 : score >= 20 ? 2 : 1;
    const existing = loadReviewCards().find(
      (c) => c.skillId === normalizedId,
    );
    if (existing) {
      upsertReviewCard(
        updateReviewCard(existing, quality, normalizedId, record.topic, record.subject),
      );
    }
  } catch {
    // Non-critical
  }

  // Conservative mastery update
  // Only a modest mastery bump — single quick recall isn't definitive
  const masteryDelta = score >= 80 ? 0.05 : score >= 60 ? 0.02 : 0;

  const updated: QuickRecallRecord = {
    ...record,
    retries: record.retries + 1,
    bestScore: Math.max(record.bestScore, score),
    lastCompletedAt: new Date().toISOString(),
    fullReviewRecommended: score < 40,
    completed: true,
  };

  records[idx] = updated;
  saveQuickRecalls(records);
  return { updated, masteryDelta };
}

/**
 * Get the status of a quick recall for display.
 */
export function getQuickRecallStatus(
  skillId: string,
): QuickRecallStatus {
  const normalizedId = normalizeTopicId(skillId);
  const records = loadQuickRecalls();
  const record = records.find((r) => r.skillId === normalizedId);
  if (!record) return "not-due";
  if (record.fullReviewRecommended) return "full-review-recommended";
  if (record.completed) return "completed";
  if (new Date(record.dueAt) <= new Date()) return "due";
  return "not-due";
}

/**
 * Get all due quick recall checks.
 */
export function getDueQuickRecalls(): QuickRecallRecord[] {
  const records = loadQuickRecalls();
  const now = new Date();
  return records.filter(
    (r) => !r.completed && new Date(r.dueAt) <= now && !r.fullReviewRecommended,
  );
}

/**
 * Simulate a delayed quick recall for demo purposes.
 * Clearly labeled as simulated — never represents real retention evidence.
 */
export function simulateQuickRecallDue(
  skillId: string,
): QuickRecallRecord {
  const records = loadQuickRecalls();
  const normalizedId = normalizeTopicId(skillId);
  const existing = records.find(
    (r) => r.skillId === normalizedId && !r.completed,
  );

  if (existing) {
    // Bump due time to now
    existing.dueAt = new Date(Date.now() - 1000).toISOString();
    existing.simulated = true;
    saveQuickRecalls(records);
    return existing;
  }

  // Create a simulated record
  return scheduleQuickRecall(skillId, skillId, undefined, true);
}
