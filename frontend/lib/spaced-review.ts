/**
 * AdaptiveMind 2.0 — Spaced Review (SM-2 inspired)
 *
 * Lightweight SM-2 scheduler tracking per-skill:
 *  - repetition count
 *  - ease factor
 *  - interval (days)
 *  - last review date
 *  - next review date
 *
 * SM-2 quality mapping:
 *  5 — perfect response
 *  4 — correct after hesitation
 *  3 — correct with difficulty
 *  2 — incorrect but remembered after seeing answer
 *  1 — completely forgotten
 *
 * Assumptions (documented approximations):
 *  - Minimum interval: 1 day
 *  - Maximum interval: 180 days
 *  - Ease factor clamped to [1.3, 3.0]
 *  - First interval is always 1 day
 *  - Second interval is 3 days (if quality ≥ 3)
 *  - Schedule is approximate, not scientifically precise
 */

export interface ReviewCard {
  skillId: string;
  topic: string;
  subject?: string;
  /** SM-2 repetition number */
  repetition: number;
  /** SM-2 ease factor (1.3 – 3.0) */
  easeFactor: number;
  /** Current interval in days */
  interval: number;
  /** Last review date (ISO string) */
  lastReview?: string;
  /** Next scheduled review (ISO string) */
  nextReview?: string;
  /** Latest performance quality (1–5) */
  lastQuality?: number;
  /** All recorded qualities for diagnostic display */
  qualityHistory: number[];
}

export const SPACED_REVIEW_STORAGE_KEY = "adaptivemind-spaced-review";

// ──────────────────────────────────────
// SM-2 Update
// ──────────────────────────────────────

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const MAX_INTERVAL_DAYS = 180;
const MIN_INTERVAL_DAYS = 1;

/**
 * Update a review card using SM-2 algorithm.
 *
 * @param card — current state (or undefined for new card)
 * @param quality — learner-perceived quality (1–5)
 * @param skillId — skill identifier
 * @param topic — topic name
 * @param subject — optional subject
 * @returns updated ReviewCard
 */
export function updateReviewCard(
  card: ReviewCard | undefined,
  quality: number,
  skillId: string,
  topic: string,
  subject?: string,
): ReviewCard {
  const clampedQuality = clamp(quality, 1, 5);
  const q = clampedQuality;

  // New card
  if (!card) {
    const nextReview = addDays(new Date(), 1);
    return {
      skillId,
      topic,
      subject,
      repetition: 1,
      easeFactor: computeEaseFactor(DEFAULT_EASE, q),
      interval: 1,
      lastReview: new Date().toISOString(),
      nextReview: nextReview.toISOString(),
      lastQuality: q,
      qualityHistory: [q],
    };
  }

  const repetition = q >= 3 ? card.repetition + 1 : 0;
  const easeFactor = computeEaseFactor(card.easeFactor, q);
  const interval = computeInterval(easeFactor, repetition);
  const nextReview = addDays(new Date(), interval);

  return {
    ...card,
    repetition,
    easeFactor,
    interval,
    lastReview: new Date().toISOString(),
    nextReview: nextReview.toISOString(),
    lastQuality: q,
    qualityHistory: [...card.qualityHistory, q].slice(-10),
  };
}

function computeEaseFactor(oldFactor: number, quality: number): number {
  const newFactor =
    oldFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return clamp(newFactor, MIN_EASE, MAX_EASE);
}

function computeInterval(easeFactor: number, repetition: number): number {
  if (repetition === 0) return MIN_INTERVAL_DAYS;
  if (repetition === 1) return 1;
  if (repetition === 2) return 3;
  return Math.min(
    Math.round(
      computeInterval(easeFactor, repetition - 1) * easeFactor,
    ),
    MAX_INTERVAL_DAYS,
  );
}

// ──────────────────────────────────────
// Storage
// ──────────────────────────────────────

export function loadReviewCards(): ReviewCard[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(SPACED_REVIEW_STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(value)) return [];
    return value.filter(
      (c): c is ReviewCard =>
        typeof c === "object" &&
        c !== null &&
        typeof c.skillId === "string",
    );
  } catch {
    return [];
  }
}

export function saveReviewCards(cards: ReviewCard[]): void {
  localStorage.setItem(
    SPACED_REVIEW_STORAGE_KEY,
    JSON.stringify(cards),
  );
}

export function getReviewCard(
  skillId: string,
): ReviewCard | undefined {
  return loadReviewCards().find((c) => c.skillId === skillId);
}

export function upsertReviewCard(card: ReviewCard): void {
  const cards = loadReviewCards();
  const existing = cards.findIndex((c) => c.skillId === card.skillId);
  if (existing >= 0) {
    cards[existing] = card;
  } else {
    cards.push(card);
  }
  saveReviewCards(cards);
}

// ──────────────────────────────────────
// Queries
// ──────────────────────────────────────

export function getDueReviews(): ReviewCard[] {
  const now = new Date();
  return loadReviewCards().filter((card) => {
    if (!card.nextReview) return false;
    return new Date(card.nextReview) <= now;
  });
}

export function getUpcomingReviews(days = 7): ReviewCard[] {
  const deadline = addDays(new Date(), days);
  return loadReviewCards().filter((card) => {
    if (!card.nextReview) return false;
    const reviewDate = new Date(card.nextReview);
    return reviewDate > new Date() && reviewDate <= deadline;
  });
}

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
