"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/motion";
import { PageShell } from "@/components/am/PageShell";
import { getTopicMastery } from "@/lib/mastery";
import { readLearningHistory } from "@/lib/dashboard-storage";
import { type LearningScores } from "@/lib/learning-dna";
import {
  calculatePlanSummary,
  generateStudyPlan,
  readStudyPlan,
  saveStudyPlan,
  studyPlanSettingsStorageKey,
  type StudyPlan,
  type StudyPlanGoal,
  type StudyPlanSettings,
  type StudyIntensity,
} from "@/lib/study-planner";

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved: unknown = JSON.parse(
          localStorage.getItem(studyPlanSettingsStorageKey) ?? "null",
        );
        if (typeof saved === "object" && saved !== null)
          setSettings({
            ...defaults,
            ...(saved as Partial<StudyPlanSettings>),
          });
        setPlan(readStudyPlan());
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function createPlan() {
    const next = generateStudyPlan(
      settings,
      loadScores(),
      getTopicMastery(),
      readLearningHistory(),
    );
    saveStudyPlan(next);
    localStorage.setItem(
      studyPlanSettingsStorageKey,
      JSON.stringify(settings),
    );
    setPlan(next);
    setConfirmReplace(false);
  }

  function toggleTask(dayIndex: number, taskId: string) {
    if (!plan) return;
    const next = {
      ...plan,
      days: plan.days.map((day, index) =>
        index !== dayIndex
          ? day
          : {
              ...day,
              tasks: day.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task,
              ),
            },
      ),
    };
    saveStudyPlan(next);
    setPlan(next);
  }

  if (!ready)
    return (
      <div
        className="min-h-screen bg-[var(--am-bg-reading)]"
        aria-busy="true"
      />
    );

  const summary = plan ? calculatePlanSummary(plan) : null;

  return (
    <PageShell
      heading="Study Planner"
      subheading="A practical plan for your next learning steps. Ada uses your recent progress and current preferences to keep the plan focused."
    >
      {/* Plan Setup */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)]"
      >
        <motion.h2
          variants={slideUp}
          className="text-xl font-semibold text-[var(--am-text-primary)]"
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
            className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--am-text-primary)]">
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
                  className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-[var(--am-radius-full)] text-sm font-semibold ${
                          dayProgress === 100
                            ? "bg-[var(--am-success)] text-white"
                            : "border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] text-[var(--am-text-secondary)]"
                        }`}
                      >
                        {dayProgress === 100 ? "✓" : day.dayNumber}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--am-text-primary)]">
                          Day {day.dayNumber}
                        </h3>
                        <p className="text-sm text-[var(--am-text-secondary)]">
                          {day.focus}
                        </p>
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
                        className="flex items-center gap-3 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTask(dayIndex, task.id)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] transition-colors ${
                            task.completed
                              ? "border-[var(--am-success)] bg-[var(--am-success)] text-white"
                              : "border-[var(--am-border)] hover:border-[var(--am-primary)]"
                          }`}
                          aria-label={`Mark ${task.topic} ${task.type} ${
                            task.completed ? "incomplete" : "complete"
                          }`}
                        >
                          {task.completed ? "✓" : ""}
                        </button>

                        <div className="flex-1 min-w-0">
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
                              · {task.topic}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--am-text-muted)]">
                            {task.reason}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--am-text-muted)]">
                          {task.minutes}m
                        </span>

                        <Link
                          href={`/tutor?topic=${encodeURIComponent(task.topic)}`}
                          className="shrink-0 text-xs font-semibold text-[var(--am-primary)] hover:underline inline-flex items-center gap-1"
                        >
                          Study
                          <ArrowRightIcon />
                        </Link>
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
          className="mt-8 rounded-[var(--am-radius-2xl)] border border-dashed border-[var(--am-border)] bg-[var(--am-bg-elevated)]/60 p-10 text-center"
        >
          <p className="font-medium text-[var(--am-text-secondary)]">
            Configure your plan settings and build a study plan to see your
            learning journey here.
          </p>
        </motion.section>
      )}
    </PageShell>
  );
}
