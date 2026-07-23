"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CloudOff } from "lucide-react";
import { motion } from "motion/react";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/motion";
import { PageShell } from "@/components/am/PageShell";
import { getTopicMastery } from "@/lib/mastery";
import { readLearningHistory } from "@/lib/dashboard-storage";
import { type LearningScores } from "@/lib/learning-dna";
import {
  calculatePlanSummary,
  generateStudyPlan,
  isPlanTaskDue,
  normalizeStudyPlan,
  normalizeStudyPlanSettings,
  readStudyPlan,
  saveStudyPlan,
  studyPlanSettingsStorageKey,
  updatePlanTask,
  type StudyPlan,
  type StudyPlanGoal,
  type StudyPlanSettings,
  type StudyIntensity,
} from "@/lib/study-planner";
import {
  getAllPlans,
  removeLearningActivity,
  savePlan,
  saveLearningActivity,
} from "@/lib/idb";
import { plannerActivityId } from "@/lib/learning-activity";
import {
  processOfflineQueue,
  queuePlanTaskToggle,
} from "@/lib/offline-sync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { PlannerExportToolbar } from "./PlannerExportToolbar";
import { StudyPackBuilder } from "./StudyPackBuilder";
import { ReminderControls } from "./ReminderControls";

const profileStorageKey = "adaptivemind-learning-dna";
const defaults: StudyPlanSettings = {
  goal: "review",
  availableDays: [1, 2, 3, 4, 5],
  minutesPerDay: 25,
  durationDays: 7,
  intensity: "balanced",
};
const emptyScores: LearningScores = {
  visual: 50,
  examples: 50,
  analogies: 50,
  stories: 50,
  challenges: 50,
};
const weekdayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
] as const;

function loadScores(): LearningScores {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(profileStorageKey) ?? "null",
    );
    const scores =
      typeof value === "object" && value !== null
        ? (value as Record<string, unknown>).scores
        : null;
    if (typeof scores === "object" && scores !== null)
      return scores as LearningScores;
  } catch {
    /* ignore */
  }
  return emptyScores;
}

function ArrowRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function PlannerShell() {
  const [settings, setSettings] = useState(defaults);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [ready, setReady] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [persistenceMessage, setPersistenceMessage] =
    useState<string | null>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let localPlan: StudyPlan | null = null;
      try {
        const saved: unknown = JSON.parse(
          localStorage.getItem(studyPlanSettingsStorageKey) ?? "null",
        );
        setSettings(normalizeStudyPlanSettings(saved, defaults));
        localPlan = readStudyPlan();
        const indexedPlans = await getAllPlans();
        const candidates = [
          ...indexedPlans,
          ...(localPlan ? [localPlan] : []),
        ];
        const loadedPlan = candidates.sort(
          (a, b) =>
            Date.parse(b.updatedAt ?? b.createdAt)
            - Date.parse(a.updatedAt ?? a.createdAt),
        )[0] ?? null;
        if (loadedPlan && !cancelled) {
          setPlan(loadedPlan);
          try {
            saveStudyPlan(loadedPlan);
          } catch {
            // IndexedDB remains the durable copy if localStorage is blocked.
          }
          if (!indexedPlans.some((item) => item.id === loadedPlan.id)) {
            await savePlan(loadedPlan);
          }
        }
      } catch (storageError) {
        if (!cancelled) {
          setPlan(localPlan);
          setPersistenceMessage(
            storageError instanceof Error
              ? storageError.message
              : "The durable local plan is unavailable.",
          );
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        studyPlanSettingsStorageKey,
        JSON.stringify(settings),
      );
    } catch {
      // The current planner session still works when storage is unavailable.
    }
  }, [ready, settings]);

  function persistPlan(next: StudyPlan): StudyPlan {
    const normalized = normalizeStudyPlan({
      ...next,
      updatedAt: new Date().toISOString(),
    });
    if (!normalized) {
      setPersistenceMessage("The planner could not save an invalid update.");
      return next;
    }
    let localCopy = normalized;
    try {
      localCopy = saveStudyPlan(normalized);
    } catch {
      setPersistenceMessage(
        "The plan is active, but this browser blocked its fallback storage.",
      );
    }
    setPlan(localCopy);
    void savePlan(localCopy)
      .then(() => setPersistenceMessage(null))
      .catch((storageError) =>
        setPersistenceMessage(
          storageError instanceof Error
            ? storageError.message
            : "The plan could not be saved for offline use.",
        ),
      );
    return localCopy;
  }

  function createPlan() {
    const next = generateStudyPlan(
      settings,
      loadScores(),
      getTopicMastery(),
      readLearningHistory(),
    );
    persistPlan(next);
    setConfirmReplace(false);
  }

  function toggleTask(dayIndex: number, taskId: string) {
    if (!plan) return;
    const currentTask = plan.days[dayIndex]?.tasks.find(
      (task) => task.id === taskId,
    );
    if (!currentTask) return;
    const willComplete = !currentTask.completed;
    if (!isOnline && currentTask.requiresConnection && willComplete) {
      setPersistenceMessage(
        "This understanding check needs live Ada evaluation. Reconnect before marking it evaluated.",
      );
      return;
    }
    const completedAt = willComplete
      ? new Date().toISOString()
      : undefined;
    const next = updatePlanTask(plan, taskId, {
      completed: willComplete,
      completedAt,
    });
    if (!next) return;
    const saved = persistPlan(next);
    void queuePlanTaskToggle({
        planId: saved.id,
        taskId,
        completed: willComplete,
        completedAt,
      })
      .then(() => {
        if (isOnline) return processOfflineQueue();
        return undefined;
      })
      .catch((queueError) =>
        setPersistenceMessage(
          queueError instanceof Error
            ? queueError.message
            : "The local planner update could not be queued.",
        ),
      );
    const activityId = plannerActivityId(plan.id, taskId);
    if (willComplete) {
      void saveLearningActivity({
        id: activityId,
        type: "planner-task-complete",
        occurredAt: new Date().toISOString(),
        topic: currentTask.topic,
      }).catch(() => {
        // Planner progress remains local and usable without IndexedDB.
      });
    } else {
      void removeLearningActivity(activityId).catch(() => {
        // The planner state is still authoritative if activity cleanup fails.
      });
    }
  }

  function updateTaskNotes(taskId: string, notes: string) {
    if (!plan) return;
    const next = updatePlanTask(plan, taskId, {
      notes: notes.slice(0, 500),
    });
    if (next) persistPlan(next);
  }

  if (!ready)
    return (
      <PageShell
        heading="Study Planner"
        subheading="Your connected learning journey"
      >
        <div
          className="min-h-48 border-y border-[var(--am-border-light)] py-12 text-center text-sm text-[var(--am-text-muted)]"
          aria-busy="true"
          role="status"
        >
          Loading your local study plan...
        </div>
      </PageShell>
    );

  const summary = plan ? calculatePlanSummary(plan) : null;

  return (
    <PageShell
      heading="Study Planner"
      subheading="Your connected learning journey"
    >
      {!isOnline && (
        <div
          className="mb-6 flex items-start gap-3 border-l-4 border-[var(--am-warning)] bg-[var(--am-warm-bg)] px-4 py-3 text-sm leading-6 text-[var(--am-text-secondary)]"
          role="status"
        >
          <CloudOff
            size={18}
            className="mt-0.5 shrink-0 text-[var(--am-warning)]"
            aria-hidden="true"
          />
          You are offline. Saved lessons and your study plan remain available.
          New Ada responses require a connection.
        </div>
      )}
      <p
        className="mb-4 min-h-5 text-sm text-[var(--am-text-muted)]"
        role="status"
        aria-live="polite"
      >
        {persistenceMessage ?? ""}
      </p>
      {/* Plan Setup */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="am-card p-6"
      >
        <motion.h2
          variants={slideUp}
          className="am-heading-serif text-xl text-[var(--am-text-primary)]"
        >
          Plan setup
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <motion.div variants={staggerItem}>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--am-text-secondary)]">
              Goal
              <select
                value={settings.goal}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    goal: event.target.value as StudyPlanGoal,
                  })
                }
                className="mt-0.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-3 py-2.5 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              >
                <option value="review">Review weak topics</option>
                <option value="continue">Continue learning path</option>
                <option value="exam">Prepare for an exam</option>
                <option value="habit">Build study habits</option>
                <option value="explore">Explore a new subject</option>
              </select>
            </label>
          </motion.div>

          <motion.fieldset
            variants={staggerItem}
            className="sm:col-span-2 lg:col-span-3"
          >
            <legend className="text-sm font-medium text-[var(--am-text-secondary)]">
              Study days
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {weekdayOptions.map((day) => {
                const selected = settings.availableDays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={`flex min-h-11 min-w-12 cursor-pointer items-center justify-center rounded-[var(--am-radius-md)] border px-3 text-xs font-semibold ${
                      selected
                        ? "border-[var(--am-primary)] bg-[var(--am-primary-light)] text-[var(--am-primary)]"
                        : "border-[var(--am-border-light)] bg-[var(--am-bg-reading)] text-[var(--am-text-secondary)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        const next = selected
                          ? settings.availableDays.filter(
                            (value) => value !== day.value,
                          )
                          : [...settings.availableDays, day.value];
                        if (next.length > 0) {
                          setSettings({
                            ...settings,
                            availableDays: next,
                          });
                        }
                      }}
                    />
                    {day.label}
                  </label>
                );
              })}
            </div>
          </motion.fieldset>

          <motion.div variants={staggerItem}>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--am-text-secondary)]">
              Minutes per day
              <input
                type="number"
                min="5"
                max="180"
                value={settings.minutesPerDay}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    minutesPerDay: Math.max(
                      5,
                      Math.min(180, Number(event.target.value) || 5),
                    ),
                  })
                }
                className="mt-0.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-3 py-2.5 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              />
            </label>
          </motion.div>

          <motion.div variants={staggerItem}>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--am-text-secondary)]">
              Duration
              <select
                value={settings.durationDays}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    durationDays: Number(event.target.value) as 3 | 7 | 14,
                  })
                }
                className="mt-0.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-3 py-2.5 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
              </select>
            </label>
          </motion.div>

          <motion.div variants={staggerItem}>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--am-text-secondary)]">
              Intensity
              <select
                value={settings.intensity}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    intensity: event.target.value as StudyIntensity,
                  })
                }
                className="mt-0.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-3 py-2.5 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              >
                <option value="light">Light</option>
                <option value="balanced">Balanced</option>
                <option value="focused">Focused</option>
              </select>
            </label>
          </motion.div>

          <motion.div variants={staggerItem}>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--am-text-secondary)]">
              Target date (optional)
              <input
                type="date"
                value={settings.targetDate ?? ""}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    targetDate: event.target.value || undefined,
                  })
                }
                className="mt-0.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-3 py-2.5 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              />
            </label>
          </motion.div>

          <motion.div variants={staggerItem}>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--am-text-secondary)]">
              Priorities (optional)
              <input
                value={settings.priorities ?? ""}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    priorities: event.target.value.slice(0, 160),
                  })
                }
                placeholder="e.g. biology, algebra"
                className="mt-0.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-3 py-2.5 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              />
            </label>
          </motion.div>
        </motion.div>

        <motion.div variants={slideUp} className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (plan ? setConfirmReplace(true) : createPlan())}
            className="am-btn am-btn-primary"
          >
            {plan ? "Regenerate plan" : "Build my study plan"}
          </button>

          {confirmReplace && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[var(--am-text-secondary)]">
                Replace the current plan?
              </span>
              <button
                type="button"
                onClick={createPlan}
                className="font-semibold text-[var(--am-error)]"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setConfirmReplace(false)}
                className="font-semibold text-[var(--am-text-muted)]"
              >
                Cancel
              </button>
            </div>
          )}
        </motion.div>
      </motion.section>

      {/* Existing Plan */}
      {plan && summary && (
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-8"
        >
          {/* Summary */}
          <motion.div
            variants={staggerItem}
            className="am-card p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="am-heading-serif text-xl text-[var(--am-text-primary)]">
                  Your learning journey
                </h2>
                <p className="mt-1 text-sm text-[var(--am-text-secondary)]">
                  {plan.summary}
                </p>
              </div>
              <span className="rounded-[var(--am-radius-md)] bg-[var(--am-primary-light)] px-3 py-1.5 text-sm font-semibold tabular-nums text-[var(--am-primary)]">
                {summary.percentage}% complete
              </span>
            </div>

            {/* Overall progress */}
            <div className="am-progress-track mt-4">
              <motion.div
                className="am-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${summary.percentage}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="mt-2 text-sm text-[var(--am-text-muted)]">
              {summary.completedTasks}/{summary.totalTasks} tasks &middot;{" "}
              {summary.completedMinutes}/{summary.totalMinutes} min
            </p>
            <PlannerExportToolbar plan={plan} />
            <StudyPackBuilder plan={plan} />
            <ReminderControls />
          </motion.div>

          {/* Day timeline */}
          <div className="mt-8 space-y-6">
            {plan.days.map((day, dayIndex) => {
              const dayProgress =
                day.tasks.length > 0
                  ? Math.round(
                      (day.tasks.filter((t) => t.completed).length /
                        day.tasks.length) *
                        100,
                    )
                  : 0;

              return (
                <motion.article
                  key={day.dayNumber}
                  variants={staggerItem}
                  className="am-card p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-[var(--am-radius-full)] text-sm font-semibold ${
                          dayProgress === 100
                            ? "bg-[var(--am-success)] text-white"
                            : "border-2 border-[var(--am-primary)] bg-[var(--am-warm-bg)] text-[var(--am-primary)]"
                        }`}
                      >
                        {dayProgress === 100 ? "✓" : day.dayNumber}
                      </span>
                      <div>
                        <h3 className="am-heading-serif text-lg text-[var(--am-text-primary)]">
                          Day {day.dayNumber}
                        </h3>
                        <p className="text-sm text-[var(--am-text-secondary)]">
                          {day.focus}
                        </p>
                        {day.date && (
                          <p className="mt-0.5 text-xs text-[var(--am-text-muted)]">
                            {new Date(day.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-[var(--am-text-muted)]">
                      {day.totalMinutes} min
                    </span>
                  </div>

                  {/* Day progress bar */}
                  <div className="am-progress-track mt-3">
                    <motion.div
                      className="h-full rounded-full bg-[var(--am-success)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${dayProgress}%` }}
                      transition={{
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                        delay: dayIndex * 0.05,
                      }}
                    />
                  </div>

                  {/* Tasks */}
                  <div className="mt-4 space-y-2">
                    {day.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-wrap items-start gap-3 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] px-4 py-3 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTask(dayIndex, task.id)}
                          disabled={
                            !isOnline
                            && task.requiresConnection
                            && !task.completed
                          }
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                            task.completed
                              ? "border-[var(--am-success)] bg-[var(--am-success)] text-white"
                              : "border-[var(--am-border)] hover:border-[var(--am-primary)]"
                          }`}
                          aria-label={`Mark ${task.topic} ${task.type} ${
                            task.completed ? "incomplete" : "complete"
                          }${
                            !isOnline
                            && task.requiresConnection
                            && !task.completed
                              ? ". Reconnect for Ada evaluation."
                              : ""
                          }`}
                        >
                          {task.completed ? "✓" : ""}
                        </button>

                        <div className="min-w-[12rem] flex-[1_1_16rem]">
                          <p
                            className={`text-sm font-medium ${
                              task.completed
                                ? "text-[var(--am-text-muted)] line-through"
                                : "text-[var(--am-text-primary)]"
                            }`}
                          >
                            {task.type.replace("-", " ")}
                            <span className="font-normal text-[var(--am-text-muted)]">
                              {" "}
                              | {task.topic}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--am-text-muted)]">
                            {task.reason}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-[var(--am-text-muted)]">
                            <span>
                              Target {task.masteryTarget ?? 60}%
                            </span>
                            {isPlanTaskDue(task, day.date) && (
                              <span className="text-[var(--am-warning)]">
                                Due now
                              </span>
                            )}
                            {task.requiresConnection && (
                              <span>
                                {isOnline
                                  ? "Live Ada check"
                                  : "Connection required"}
                              </span>
                            )}
                          </div>
                          <label className="mt-3 block text-xs font-semibold text-[var(--am-text-secondary)]">
                            Notes
                            <textarea
                              value={task.notes ?? ""}
                              maxLength={500}
                              rows={2}
                              onChange={(event) =>
                                updateTaskNotes(
                                  task.id,
                                  event.target.value,
                                )
                              }
                              className="mt-1 block w-full resize-y rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-3 py-2 text-sm font-normal leading-6 text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
                              placeholder="Add local study notes"
                            />
                          </label>
                        </div>

                        <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--am-text-muted)]">
                          {task.minutes}m
                        </span>

                        {isOnline ? (
                          <Link
                            href={`/tutor?topic=${encodeURIComponent(task.topic)}`}
                            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-semibold text-[var(--am-primary)] hover:underline"
                          >
                            Study
                            <ArrowRightIcon />
                          </Link>
                        ) : (
                          <Link
                            href="/downloads"
                            className="inline-flex min-h-11 shrink-0 items-center text-xs font-semibold text-[var(--am-primary)] hover:underline"
                          >
                            Saved lessons
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.section>
      )}

      {!plan && (
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="am-card mt-8 p-10 text-center border-dashed"
        >
          <p className="am-heading-serif text-base text-[var(--am-text-secondary)]">
            Configure your plan settings and build a study plan to see your
            learning journey here.
          </p>
        </motion.section>
      )}
    </PageShell>
  );
}
