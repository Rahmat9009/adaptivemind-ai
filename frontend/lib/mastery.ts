import type { UnderstandingStatus } from "@/lib/ai/types";

export type MasteryLevel =
  | "new"
  | "exploring"
  | "developing"
  | "understood"
  | "applied"
  | "mastered"
  | "needs-review";

export type MasteryEvidenceKind =
  | "retrieval"
  | "application"
  | "explain-back"
  | "challenge"
  | "quick-recall";

export interface TopicMastery {
  topicId: string;
  topic: string;
  subject?: string;
  attempts: number;
  evidenceCount: number;
  bestScore: number;
  latestScore: number;
  masteryPercent: number;
  masteryLevel: MasteryLevel;
  lastAttemptAt: string;
  recentStatuses: UnderstandingStatus[];
  recentEvidenceIds: string[];
  applicationSuccesses: number;
  delayedRecallSuccesses: number;
  independentChallengeSuccesses: number;
  lastChangeReason: string;
  lastEvidenceApplied: boolean;
}

export interface MasteryEvidenceOptions {
  evidenceId?: string;
  kind?: MasteryEvidenceKind;
  hintsUsed?: number;
  retries?: number;
  independent?: boolean;
  delayed?: boolean;
}

export const topicMasteryStorageKey = "adaptivemind-topic-mastery";
const MAX_TOPICS = 100;
const MAX_EVIDENCE_IDS = 30;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function normalizeTopicId(topic: string): string {
  const normalized = topic
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
  return normalized || `topic-${stableHash(topic.trim())}`;
}

export function createMasteryEvidenceId(
  topic: string,
  activityId: string,
  learnerResponse: string,
): string {
  const response = learnerResponse
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
  return `${normalizeTopicId(topic)}:${activityId}:${stableHash(response)}`;
}

export function calculateMasteryLevel(
  attempts: number,
  bestScore: number,
  latestScore: number,
  recentStatuses: UnderstandingStatus[],
  masteryPercent = bestScore,
): MasteryLevel {
  if (attempts === 0) return "new";
  if (latestScore < 40 || recentStatuses[0] === "misconception") {
    return "needs-review";
  }
  if (masteryPercent >= 85 && attempts >= 4) return "mastered";
  if (masteryPercent >= 75 && attempts >= 3) return "applied";
  if (masteryPercent >= 62 && attempts >= 2) return "understood";
  if (masteryPercent >= 35 || bestScore >= 60) return "developing";
  return "exploring";
}

function isStatus(value: unknown): value is UnderstandingStatus {
  return value === "correct"
    || value === "partial"
    || value === "misconception"
    || value === "uncertain";
}

function normalizeStoredMastery(value: unknown): TopicMastery | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.topic !== "string" || !record.topic.trim()) return null;

  const attempts = clamp(
    finiteNumber(record.attempts),
    0,
    10_000,
  );
  const bestScore = clamp(
    finiteNumber(record.bestScore),
    0,
    100,
  );
  const latestScore = clamp(
    finiteNumber(record.latestScore),
    0,
    100,
  );
  const recentStatuses = Array.isArray(record.recentStatuses)
    ? record.recentStatuses.filter(isStatus).slice(0, 5)
    : [];
  const fallbackMastery = clamp(
    Math.round(bestScore * 0.55 + Math.min(attempts, 5) * 4),
    0,
    95,
  );
  const masteryPercent = clamp(
    finiteNumber(record.masteryPercent, fallbackMastery),
    0,
    99,
  );
  const recentEvidenceIds = Array.isArray(record.recentEvidenceIds)
    ? record.recentEvidenceIds
        .filter((item): item is string => typeof item === "string")
        .slice(0, MAX_EVIDENCE_IDS)
    : [];

  return {
    topicId: normalizeTopicId(record.topic),
    topic: record.topic.trim().slice(0, 160),
    subject: typeof record.subject === "string"
      ? record.subject.trim().slice(0, 50)
      : undefined,
    attempts,
    evidenceCount: clamp(
      finiteNumber(record.evidenceCount, attempts),
      0,
      10_000,
    ),
    bestScore,
    latestScore,
    masteryPercent,
    masteryLevel: calculateMasteryLevel(
      attempts,
      bestScore,
      latestScore,
      recentStatuses,
      masteryPercent,
    ),
    lastAttemptAt: typeof record.lastAttemptAt === "string"
      ? record.lastAttemptAt
      : new Date(0).toISOString(),
    recentStatuses,
    recentEvidenceIds,
    applicationSuccesses: clamp(
      finiteNumber(record.applicationSuccesses),
      0,
      10_000,
    ),
    delayedRecallSuccesses: clamp(
      finiteNumber(record.delayedRecallSuccesses),
      0,
      10_000,
    ),
    independentChallengeSuccesses: clamp(
      finiteNumber(record.independentChallengeSuccesses),
      0,
      10_000,
    ),
    lastChangeReason: typeof record.lastChangeReason === "string"
      ? record.lastChangeReason.slice(0, 300)
      : "Migrated from the earlier local mastery model.",
    lastEvidenceApplied: record.lastEvidenceApplied !== false,
  };
}

export function getTopicMastery(): TopicMastery[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(topicMasteryStorageKey) ?? "[]",
    );
    if (!Array.isArray(value)) return [];

    const deduplicated = new Map<string, TopicMastery>();
    for (const item of value) {
      const normalized = normalizeStoredMastery(item);
      if (!normalized || deduplicated.has(normalized.topicId)) continue;
      deduplicated.set(normalized.topicId, normalized);
    }
    return [...deduplicated.values()].slice(0, MAX_TOPICS);
  } catch {
    return [];
  }
}

function evidenceStrength(options: MasteryEvidenceOptions): number {
  const kindStrength: Record<MasteryEvidenceKind, number> = {
    retrieval: 0.9,
    application: 1,
    "explain-back": 0.85,
    challenge: options.independent ? 1 : 0.7,
    "quick-recall": options.delayed ? 1 : 0.65,
  };
  const kind = options.kind ?? "retrieval";
  const hintPenalty = clamp(1 - (options.hintsUsed ?? 0) * 0.12, 0.45, 1);
  const retryPenalty = clamp(1 - (options.retries ?? 0) * 0.08, 0.6, 1);
  return kindStrength[kind] * hintPenalty * retryPenalty;
}

function saveTopicMastery(entries: TopicMastery[]): void {
  localStorage.setItem(
    topicMasteryStorageKey,
    JSON.stringify(entries.slice(0, MAX_TOPICS)),
  );
}

export function updateTopicMastery(
  topic: string,
  subject: string,
  score: number,
  status: UnderstandingStatus,
  options: MasteryEvidenceOptions = {},
): TopicMastery {
  const all = getTopicMastery();
  const topicId = normalizeTopicId(topic);
  const existing = all.find((item) => item.topicId === topicId);
  const evidenceId = options.evidenceId;

  if (
    existing
    && evidenceId
    && existing.recentEvidenceIds.includes(evidenceId)
  ) {
    return {
      ...existing,
      lastChangeReason: "This repeated submission was not counted again.",
      lastEvidenceApplied: false,
    };
  }

  const boundedScore = clamp(Math.round(score), 0, 100);
  const strength = evidenceStrength(options);
  const previousMastery = existing?.masteryPercent ?? 10;
  const effectiveScore = boundedScore * strength;
  const learningRate = effectiveScore < previousMastery ? 0.32 : 0.22;
  const masteryPercent = clamp(
    Math.round(
      previousMastery + (effectiveScore - previousMastery) * learningRate,
    ),
    1,
    99,
  );
  const attempts = (existing?.attempts ?? 0) + 1;
  const evidenceCount = (existing?.evidenceCount ?? 0) + 1;
  const recentStatuses = [status, ...(existing?.recentStatuses ?? [])].slice(0, 5);
  const bestScore = Math.max(existing?.bestScore ?? 0, boundedScore);
  const kind = options.kind ?? "retrieval";
  const successful = status === "correct" && boundedScore >= 70;
  const hintsUsed = Math.max(0, Math.round(options.hintsUsed ?? 0));
  const reasonParts = [
    `${kind.replace("-", " ")} evidence changed the estimate from ${previousMastery}% to ${masteryPercent}%.`,
  ];
  if (hintsUsed > 0) {
    reasonParts.push(
      `${hintsUsed} hint${hintsUsed === 1 ? "" : "s"} reduced the evidence weight.`,
    );
  }
  if ((options.retries ?? 0) > 0) {
    reasonParts.push("Retries were treated as supported rather than independent evidence.");
  }

  const entry: TopicMastery = {
    topicId,
    topic: topic.trim().slice(0, 160),
    subject: subject.trim().slice(0, 50),
    attempts,
    evidenceCount,
    bestScore,
    latestScore: boundedScore,
    masteryPercent,
    masteryLevel: calculateMasteryLevel(
      attempts,
      bestScore,
      boundedScore,
      recentStatuses,
      masteryPercent,
    ),
    lastAttemptAt: new Date().toISOString(),
    recentStatuses,
    recentEvidenceIds: evidenceId
      ? [evidenceId, ...(existing?.recentEvidenceIds ?? [])].slice(
          0,
          MAX_EVIDENCE_IDS,
        )
      : existing?.recentEvidenceIds ?? [],
    applicationSuccesses: (existing?.applicationSuccesses ?? 0)
      + (successful && kind === "application" ? 1 : 0),
    delayedRecallSuccesses: (existing?.delayedRecallSuccesses ?? 0)
      + (successful && kind === "quick-recall" && options.delayed ? 1 : 0),
    independentChallengeSuccesses:
      (existing?.independentChallengeSuccesses ?? 0)
      + (successful && kind === "challenge" && options.independent ? 1 : 0),
    lastChangeReason: reasonParts.join(" "),
    lastEvidenceApplied: true,
  };

  saveTopicMastery([
    entry,
    ...all.filter((item) => item.topicId !== topicId),
  ]);
  return entry;
}

export function getMasterySummary() {
  const entries = getTopicMastery();
  const recent = entries.slice(0, 5);
  return {
    entries,
    mastered: entries.filter((entry) => entry.masteryLevel === "mastered").length,
    developing: entries.filter((entry) =>
      ["exploring", "developing", "understood", "applied"].includes(
        entry.masteryLevel,
      ),
    ).length,
    needsReview: entries.filter(
      (entry) => entry.masteryLevel === "needs-review",
    ).length,
    averageRecentScore: recent.length
      ? Math.round(
          recent.reduce((sum, entry) => sum + entry.latestScore, 0)
          / recent.length,
        )
      : null,
  };
}
