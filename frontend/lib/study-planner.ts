import type {
  LearningDimension,
  LearningScores,
} from "@/lib/learning-dna";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import type { TopicMastery } from "@/lib/mastery";
import { getLessonRecommendation } from "@/lib/recommendations";

export type StudyPlanGoal =
  | "review"
  | "continue"
  | "exam"
  | "habit"
  | "explore";
export type StudyIntensity = "light" | "balanced" | "focused";
export type StudyTaskType =
  | "review"
  | "lesson"
  | "practice"
  | "understanding-check"
  | "reflection";

export interface StudyTask {
  id: string;
  topic: string;
  type: StudyTaskType;
  minutes: number;
  reason: string;
  teachingApproach: LearningDimension[];
  completed: boolean;
  completedAt?: string;
  masteryTarget?: number;
  reviewDate?: string;
  notes?: string;
  requiresConnection?: boolean;
}

export interface StudyPlanDay {
  dayNumber: number;
  date?: string;
  totalMinutes: number;
  focus: string;
  tasks: StudyTask[];
}

export interface StudyPlan {
  version?: 2;
  id: string;
  createdAt: string;
  updatedAt?: string;
  goal: StudyPlanGoal;
  durationDays: number;
  minutesPerDay: number;
  intensity: StudyIntensity;
  days: StudyPlanDay[];
  summary: string;
}

export interface StudyPlanSettings {
  goal: StudyPlanGoal;
  availableDays: number[];
  minutesPerDay: number;
  durationDays: 3 | 7 | 14;
  intensity: StudyIntensity;
  targetDate?: string;
  priorities?: string;
}

export const studyPlanStorageKey = "adaptivemind-study-plan";
export const studyPlanSettingsStorageKey = "adaptivemind-study-plan-settings";
export const STUDY_PLAN_VERSION = 2 as const;

const goals: StudyPlanGoal[] = [
  "review",
  "continue",
  "exam",
  "habit",
  "explore",
];
const intensities: StudyIntensity[] = ["light", "balanced", "focused"];
const taskTypes: StudyTaskType[] = [
  "review",
  "lesson",
  "practice",
  "understanding-check",
  "reflection",
];
const learningDimensions: LearningDimension[] = [
  "visual",
  "examples",
  "analogies",
  "stories",
  "challenges",
];

export const studyPlanGoalLabels: Record<StudyPlanGoal, string> = {
  review: "Review weak topics",
  continue: "Continue learning path",
  exam: "Prepare for an exam",
  habit: "Build study habits",
  explore: "Explore a new subject",
};

export function normalizeStudyPlanSettings(
  value: unknown,
  fallback: StudyPlanSettings,
): StudyPlanSettings {
  if (typeof value !== "object" || value === null) return fallback;
  const record = value as Record<string, unknown>;
  const availableDays = Array.isArray(record.availableDays)
    ? [...new Set(
      record.availableDays.filter(
        (day): day is number =>
          Number.isInteger(day) && day >= 0 && day <= 6,
      ),
    )]
    : fallback.availableDays;
  const durationDays =
    record.durationDays === 3
    || record.durationDays === 7
    || record.durationDays === 14
      ? record.durationDays
      : fallback.durationDays;
  return {
    goal: goals.includes(record.goal as StudyPlanGoal)
      ? record.goal as StudyPlanGoal
      : fallback.goal,
    availableDays:
      availableDays.length > 0 ? availableDays : fallback.availableDays,
    minutesPerDay:
      isFiniteInteger(record.minutesPerDay)
        ? Math.max(5, Math.min(180, record.minutesPerDay))
        : fallback.minutesPerDay,
    durationDays,
    intensity: intensities.includes(record.intensity as StudyIntensity)
      ? record.intensity as StudyIntensity
      : fallback.intensity,
    targetDate:
      typeof record.targetDate === "string"
      && /^\d{4}-\d{2}-\d{2}$/.test(record.targetDate)
        ? record.targetDate
        : undefined,
    priorities:
      typeof record.priorities === "string"
        ? record.priorities.slice(0, 160)
        : undefined,
  };
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number"
    && Number.isFinite(value)
    && Number.isInteger(value);
}

function safeIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    return undefined;
  }
  return new Date(value).toISOString();
}

function normalizeTask(
  value: unknown,
  dayNumber: number,
  taskIndex: number,
  dayDate?: string,
): StudyTask | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.topic !== "string"
    || !record.topic.trim()
    || !taskTypes.includes(record.type as StudyTaskType)
    || !isFiniteInteger(record.minutes)
    || record.minutes < 1
    || record.minutes > 480
    || typeof record.reason !== "string"
    || !Array.isArray(record.teachingApproach)
  ) {
    return null;
  }
  const teachingApproach = record.teachingApproach.filter(
    (approach): approach is LearningDimension =>
      typeof approach === "string"
      && learningDimensions.includes(approach as LearningDimension),
  ).slice(0, learningDimensions.length);
  const id = typeof record.id === "string" && record.id.trim()
    ? record.id.slice(0, 120)
    : `task-${dayNumber}-${taskIndex + 1}`;
  const masteryTarget = isFiniteInteger(record.masteryTarget)
    ? Math.max(0, Math.min(100, record.masteryTarget))
    : 60;
  const type = record.type as StudyTaskType;

  return {
    id,
    topic: record.topic.trim().slice(0, 200),
    type,
    minutes: record.minutes,
    reason: record.reason.trim().slice(0, 500),
    teachingApproach:
      teachingApproach.length > 0 ? teachingApproach : ["examples"],
    completed: record.completed === true,
    completedAt: safeIsoDate(record.completedAt),
    masteryTarget,
    reviewDate: safeIsoDate(record.reviewDate) ?? dayDate,
    notes: typeof record.notes === "string"
      ? record.notes.slice(0, 500)
      : "",
    requiresConnection:
      typeof record.requiresConnection === "boolean"
        ? record.requiresConnection
        : type === "understanding-check",
  };
}

export function normalizeStudyPlan(value: unknown): StudyPlan | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string"
    || !record.id.trim()
    || typeof record.createdAt !== "string"
    || !Number.isFinite(Date.parse(record.createdAt))
    || !goals.includes(record.goal as StudyPlanGoal)
    || !isFiniteInteger(record.durationDays)
    || record.durationDays < 1
    || record.durationDays > 90
    || !isFiniteInteger(record.minutesPerDay)
    || record.minutesPerDay < 5
    || record.minutesPerDay > 480
    || !intensities.includes(record.intensity as StudyIntensity)
    || !Array.isArray(record.days)
    || typeof record.summary !== "string"
  ) {
    return null;
  }

  const days: StudyPlanDay[] = [];
  for (const [dayIndex, rawDay] of record.days.entries()) {
    if (typeof rawDay !== "object" || rawDay === null) return null;
    const dayRecord = rawDay as Record<string, unknown>;
    const dayNumber = isFiniteInteger(dayRecord.dayNumber)
      ? dayRecord.dayNumber
      : dayIndex + 1;
    if (
      dayNumber < 1
      || typeof dayRecord.focus !== "string"
      || !Array.isArray(dayRecord.tasks)
    ) {
      return null;
    }
    const date = safeIsoDate(dayRecord.date);
    const tasks = dayRecord.tasks.map((task, taskIndex) =>
      normalizeTask(task, dayNumber, taskIndex, date),
    );
    if (tasks.some((task) => task === null)) return null;
    const validTasks = tasks as StudyTask[];
    const totalMinutes = validTasks.reduce(
      (sum, task) => sum + task.minutes,
      0,
    );
    if (totalMinutes > record.minutesPerDay) return null;
    days.push({
      dayNumber,
      date,
      totalMinutes,
      focus: dayRecord.focus.trim().slice(0, 200),
      tasks: validTasks,
    });
  }
  if (days.length !== record.durationDays) return null;

  return {
    version: STUDY_PLAN_VERSION,
    id: record.id.slice(0, 120),
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: safeIsoDate(record.updatedAt) ?? new Date(record.createdAt).toISOString(),
    goal: record.goal as StudyPlanGoal,
    durationDays: record.durationDays,
    minutesPerDay: record.minutesPerDay,
    intensity: record.intensity as StudyIntensity,
    days,
    summary: record.summary.trim().slice(0, 1_000),
  };
}

export function prioritizeTopics(
  mastery: TopicMastery[],
  history: LessonHistoryEntry[],
): string[] {
  const ranked = [...mastery]
    .sort(
      (a, b) =>
        (
          a.masteryLevel === "needs-review"
            ? -2
            : a.masteryLevel === "developing"
              ? -1
              : 0
        )
        - (
          b.masteryLevel === "needs-review"
            ? -2
            : b.masteryLevel === "developing"
              ? -1
              : 0
        )
        || a.latestScore - b.latestScore,
    )
    .map((item) => item.topic);
  const recommendation = history[0]
    ? getLessonRecommendation(history[0].topic)?.topic
    : undefined;
  return [
    ...new Set([
      ...ranked,
      ...(recommendation ? [recommendation] : []),
      ...history.map((item) => item.topic),
      "Build consistent study habits",
    ]),
  ].slice(0, 6);
}

export function buildStudyPlanInput(
  scores: LearningScores,
  mastery: TopicMastery[],
  history: LessonHistoryEntry[],
) {
  return {
    scores,
    mastery,
    history,
    topics: prioritizeTopics(mastery, history),
  };
}

export function allocateStudyTime(
  minutes: number,
  intensity: StudyIntensity,
): number[] {
  const desired =
    intensity === "light" ? 2 : intensity === "focused" ? 4 : 3;
  const base = Math.min(desired, Math.max(1, Math.floor(minutes / 5)));
  const each = Math.max(5, Math.floor(minutes / base));
  const allocated = Array.from({ length: base }, (_, index) =>
    index === base - 1
      ? Math.max(5, minutes - each * (base - 1))
      : each,
  );
  const total = allocated.reduce((sum, value) => sum + value, 0);
  let excess = Math.min(total - minutes, allocated.length * 5);
  if (excess > 0) {
    for (let index = allocated.length - 1; index >= 0 && excess > 0; index--) {
      const reduction = Math.min(allocated[index] - 5, excess);
      allocated[index] -= reduction;
      excess -= reduction;
    }
  }
  return allocated;
}

function parsePriorities(value?: string): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.slice(0, 120)),
    ),
  ].slice(0, 6);
}

export function buildStudyDates(
  count: number,
  availableDays: number[],
  start = new Date(),
  endBy?: Date,
): Date[] {
  const allowed = new Set(
    availableDays.filter(
      (day) => Number.isInteger(day) && day >= 0 && day <= 6,
    ),
  );
  if (allowed.size === 0) {
    for (let day = 0; day <= 6; day++) allowed.add(day);
  }
  const normalizedStart = new Date(start);
  normalizedStart.setUTCHours(12, 0, 0, 0);
  if (
    endBy
    && Number.isFinite(endBy.getTime())
    && endBy.getTime() >= normalizedStart.getTime()
  ) {
    const backwards: Date[] = [];
    const cursor = new Date(endBy);
    cursor.setUTCHours(12, 0, 0, 0);
    let inspected = 0;
    while (
      backwards.length < count
      && inspected < count * 14 + 14
      && cursor.getTime() >= normalizedStart.getTime()
    ) {
      if (allowed.has(cursor.getUTCDay())) {
        backwards.unshift(new Date(cursor));
      }
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      inspected += 1;
    }
    if (backwards.length === count) return backwards;
  }

  const dates: Date[] = [];
  const cursor = new Date(normalizedStart);
  let inspected = 0;
  while (dates.length < count && inspected < count * 14 + 14) {
    if (allowed.has(cursor.getUTCDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    inspected += 1;
  }
  return dates;
}

export function generateStudyPlan(
  settings: StudyPlanSettings,
  scores: LearningScores,
  mastery: TopicMastery[],
  history: LessonHistoryEntry[],
): StudyPlan {
  const input = buildStudyPlanInput(scores, mastery, history);
  const priorityTopics = parsePriorities(settings.priorities);
  const topics = [...new Set([...priorityTopics, ...input.topics])];
  const approach = (Object.keys(scores) as LearningDimension[])
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 2);
  const taskSequence: StudyTaskType[] = [
    "review",
    "lesson",
    "practice",
    "understanding-check",
    "reflection",
  ];
  const createdAt = new Date();
  const planId = `plan-${createdAt.getTime()}`;
  const studyDates = buildStudyDates(
    settings.durationDays,
    settings.availableDays,
    createdAt,
    settings.targetDate
      ? new Date(`${settings.targetDate}T12:00:00.000Z`)
      : undefined,
  );
  const days = Array.from(
    { length: settings.durationDays },
    (_, dayIndex) => {
      const topic =
        topics[dayIndex % topics.length] ?? "Build consistent study habits";
      const chunks = allocateStudyTime(
        settings.minutesPerDay,
        settings.intensity,
      );
      const dayDate =
        studyDates[dayIndex]
        ?? new Date(createdAt.getTime() + dayIndex * 86_400_000);
      const date = dayDate.toISOString();
      const tasks = chunks.map((minutes, taskIndex): StudyTask => {
        const type = taskSequence[
          (dayIndex + taskIndex) % taskSequence.length
        ];
        return {
          id: `${planId}-task-${dayIndex + 1}-${taskIndex + 1}`,
          topic,
          type,
          minutes,
          reason: `${
            taskIndex === 0 ? "Focus" : "Reinforce"
          } this using ${approach.join(
            " and ",
          )} because these are current starting preferences. Outcomes may change future recommendations.`,
          teachingApproach: approach,
          completed: false,
          masteryTarget: Math.min(90, 55 + dayIndex * 3),
          reviewDate: new Date(
            dayDate.getTime() + (type === "review" ? 0 : 2) * 86_400_000,
          ).toISOString(),
          notes: "",
          requiresConnection: type === "understanding-check",
        };
      });
      return {
        dayNumber: dayIndex + 1,
        date,
        totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
        focus: topic,
        tasks,
      };
    },
  );
  const timestamp = createdAt.toISOString();
  return {
    version: STUDY_PLAN_VERSION,
    id: planId,
    createdAt: timestamp,
    updatedAt: timestamp,
    goal: settings.goal,
    durationDays: settings.durationDays,
    minutesPerDay: settings.minutesPerDay,
    intensity: settings.intensity,
    days,
    summary: `${
      input.history.length
        ? "This plan prioritizes current review needs and your next learning step."
        : "This starter plan is based mainly on your selected goal and current Learning DNA preferences."
    }${
      settings.targetDate
        ? ` Sessions are scheduled on selected study days through ${settings.targetDate}.`
        : ""
    }`,
  };
}

export function calculatePlanSummary(plan: StudyPlan) {
  const tasks = plan.days.flatMap((day) => day.tasks);
  const completed = tasks.filter((task) => task.completed);
  return {
    totalTasks: tasks.length,
    completedTasks: completed.length,
    remainingTasks: tasks.length - completed.length,
    totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
    completedMinutes: completed.reduce(
      (sum, task) => sum + task.minutes,
      0,
    ),
    percentage: tasks.length
      ? Math.round((completed.length / tasks.length) * 100)
      : 0,
    currentDay:
      plan.days.find((day) => day.tasks.some((task) => !task.completed))
        ?.dayNumber ?? plan.durationDays,
  };
}

export function validateStudyPlan(plan: StudyPlan): boolean {
  return normalizeStudyPlan(plan) !== null;
}

export function readStudyPlan(): StudyPlan | null {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(studyPlanStorageKey) ?? "null",
    );
    const normalized = normalizeStudyPlan(value);
    if (
      normalized
      && JSON.stringify(normalized) !== JSON.stringify(value)
    ) {
      localStorage.setItem(
        studyPlanStorageKey,
        JSON.stringify(normalized),
      );
    }
    return normalized;
  } catch {
    return null;
  }
}

export function saveStudyPlan(plan: StudyPlan): StudyPlan {
  const normalized = normalizeStudyPlan({
    ...plan,
    version: STUDY_PLAN_VERSION,
    updatedAt: new Date().toISOString(),
  });
  if (!normalized) throw new Error("The study plan is invalid.");
  localStorage.setItem(studyPlanStorageKey, JSON.stringify(normalized));
  return normalized;
}

export function updatePlanTask(
  plan: StudyPlan,
  taskId: string,
  update: Partial<
    Pick<StudyTask, "completed" | "completedAt" | "notes">
  >,
): StudyPlan | null {
  let found = false;
  const updated = {
    ...plan,
    updatedAt: new Date().toISOString(),
    days: plan.days.map((day) => ({
      ...day,
      tasks: day.tasks.map((task) => {
        if (task.id !== taskId) return task;
        found = true;
        return {
          ...task,
          ...update,
          notes:
            update.notes === undefined
              ? task.notes
              : update.notes.slice(0, 500),
        };
      }),
    })),
  };
  return found ? normalizeStudyPlan(updated) : null;
}

export function isPlanTaskDue(
  task: StudyTask,
  dayDate: string | undefined,
  now = new Date(),
): boolean {
  if (task.completed) return false;
  const date = task.reviewDate ?? dayDate;
  if (!date || !Number.isFinite(Date.parse(date))) return false;
  const due = new Date(date);
  due.setHours(23, 59, 59, 999);
  return due.getTime() <= now.getTime();
}
