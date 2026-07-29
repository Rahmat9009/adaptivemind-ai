import type { ExplanationHistory } from "@/lib/explanation-history";

export type LearningActivityType =
  | "understanding-check"
  | "explain-back"
  | "challenge-attempt"
  | "quick-recall"
  | "planner-task-complete";

export interface LearningActivity {
  id: string;
  type: LearningActivityType;
  occurredAt: string;
  topic?: string;
  score?: number;
}

export interface ActivityDay {
  date: string;
  count: number;
}

export const MAX_LEARNING_ACTIVITIES = 1_000;

const activityLabels: Record<LearningActivityType, string> = {
  "understanding-check": "Understanding check",
  "explain-back": "Explain Back",
  "challenge-attempt": "Challenge attempt",
  "quick-recall": "Quick recall",
  "planner-task-complete": "Planner task completed",
};

export function getLearningActivityLabel(type: LearningActivityType): string {
  return activityLabels[type];
}

export function isLearningActivity(value: unknown): value is LearningActivity {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string"
    && Object.hasOwn(activityLabels, record.type as PropertyKey)
    && typeof record.occurredAt === "string"
    && Number.isFinite(Date.parse(record.occurredAt))
    && (record.topic === undefined || typeof record.topic === "string")
    && (
      record.score === undefined
      || (
        typeof record.score === "number"
        && record.score >= 0
        && record.score <= 100
      )
    )
  );
}

export function localDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildActivityDays(
  activities: LearningActivity[],
  dayCount = 119,
  now = new Date(),
): ActivityDay[] {
  const boundedDayCount = Math.min(366, Math.max(7, Math.round(dayCount)));
  const counts = new Map<string, number>();
  for (const activity of activities) {
    if (!isLearningActivity(activity)) continue;
    const key = localDateKey(activity.occurredAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: boundedDayCount }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (boundedDayCount - index - 1));
    const key = localDateKey(date);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

export function getLearningMomentum(
  activities: LearningActivity[],
  now = new Date(),
): {
  activeDaysLast14: number;
  actionsLast14: number;
  latestActivityAt: string | null;
} {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 13);
  const recent = activities.filter((activity) => {
    const timestamp = Date.parse(activity.occurredAt);
    return Number.isFinite(timestamp) && timestamp >= cutoff.getTime();
  });
  const activeDays = new Set(recent.map((activity) =>
    localDateKey(activity.occurredAt),
  ));
  const latestActivityAt = activities
    .map((activity) => activity.occurredAt)
    .filter((value) => Number.isFinite(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;

  return {
    activeDaysLast14: activeDays.size,
    actionsLast14: recent.length,
    latestActivityAt,
  };
}

export function deriveActivitiesFromExplanationHistory(
  history: ExplanationHistory,
): LearningActivity[] {
  return Object.values(history.concepts)
    .flat()
    .filter((record) => record.checkType !== "peer-agent")
    .map((record): LearningActivity => {
      const type: LearningActivityType =
        record.checkType === "explain-back"
          ? "explain-back"
          : record.checkType === "quick-recall"
            ? "quick-recall"
            : record.attemptMade
              ? "challenge-attempt"
              : "understanding-check";
      return {
        id: `legacy:${record.conceptId}:${record.lessonId}:${record.checkType}`,
        type,
        occurredAt: record.timestamp,
        topic: record.conceptLabel,
        score: record.evaluationScore,
      };
    })
    .filter(isLearningActivity)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, MAX_LEARNING_ACTIVITIES);
}

export function plannerActivityId(planId: string, taskId: string): string {
  return `planner:${planId}:${taskId}`;
}
