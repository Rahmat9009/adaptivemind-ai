import type { QuickRecallRecord } from "@/lib/quick-recall";
import {
  isPlanTaskDue,
  type StudyPlan,
} from "@/lib/study-planner";

export const reminderSettingsStorageKey =
  "adaptivemind-local-reminder-settings";
const notifiedReminderStorageKey =
  "adaptivemind-notified-local-reminders";

export interface LocalReminderSettings {
  browserNotifications: boolean;
}

export interface LocalReminderItem {
  id: string;
  type: "planner-task" | "quick-recall";
  title: string;
  body: string;
}

export function loadLocalReminderSettings(): LocalReminderSettings {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(reminderSettingsStorageKey) ?? "null",
    );
    return {
      browserNotifications:
        typeof value === "object"
        && value !== null
        && (value as Record<string, unknown>).browserNotifications === true,
    };
  } catch {
    return { browserNotifications: false };
  }
}

export function saveLocalReminderSettings(
  settings: LocalReminderSettings,
): LocalReminderSettings {
  const normalized = {
    browserNotifications: settings.browserNotifications === true,
  };
  localStorage.setItem(
    reminderSettingsStorageKey,
    JSON.stringify(normalized),
  );
  return normalized;
}

export function getDueLocalReminders(
  plan: StudyPlan | null,
  recalls: QuickRecallRecord[],
  now = new Date(),
): LocalReminderItem[] {
  const planItems =
    plan?.days.flatMap((day) =>
      day.tasks
        .filter((task) => isPlanTaskDue(task, day.date, now))
        .map((task): LocalReminderItem => ({
          id: `plan:${plan.id}:${task.id}`,
          type: "planner-task",
          title: `Study task due: ${task.topic}`,
          body: `${task.type.replace("-", " ")} - ${task.minutes} minutes`,
        })),
    ) ?? [];
  const recallItems = recalls
    .filter(
      (record) =>
        !record.completed
        && !record.fullReviewRecommended
        && Date.parse(record.dueAt) <= now.getTime(),
    )
    .map((record): LocalReminderItem => ({
      id: `recall:${record.skillId}:${record.dueAt}`,
      type: "quick-recall",
      title: `Quick recall due: ${record.topic}`,
      body: "A focused 30-60 second recall is ready.",
    }));
  return [...planItems, ...recallItems].slice(0, 50);
}

function loadNotifiedIds(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(notifiedReminderStorageKey) ?? "[]",
    );
    return Array.isArray(value)
      ? value
        .filter((item): item is string => typeof item === "string")
        .slice(-200)
      : [];
  } catch {
    return [];
  }
}

export function markReminderNotified(id: string): void {
  const ids = [...new Set([...loadNotifiedIds(), id])].slice(-200);
  localStorage.setItem(notifiedReminderStorageKey, JSON.stringify(ids));
}

export function getUnnotifiedReminders(
  reminders: LocalReminderItem[],
): LocalReminderItem[] {
  const notified = new Set(loadNotifiedIds());
  return reminders.filter((item) => !notified.has(item.id));
}
