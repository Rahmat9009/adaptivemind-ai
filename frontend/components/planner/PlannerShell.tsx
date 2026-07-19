"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { getTopicMastery } from "@/lib/mastery";
import { readLearningHistory } from "@/lib/dashboard-storage";
import { type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";
import { easeOutExpo } from "@/lib/motion";
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
  type StudyTaskType,
} from "@/lib/study-planner";

const profileStorageKey = "adaptivemind-learning-dna";
const defaults: StudyPlanSettings = { goal: "review", availableDays: [1, 2, 3, 4, 5], minutesPerDay: 25, durationDays: 7, intensity: "balanced" };
const emptyScores: LearningScores = { visual: 50, examples: 50, analogies: 50, stories: 50, challenges: 50 };

const taskTypeColor: Record<StudyTaskType, string> = {
  review: "var(--color-dna-challenges)",
  lesson: "var(--color-dna-analogies)",
  practice: "var(--color-dna-examples)",
  "understanding-check": "var(--color-dna-visual)",
  reflection: "var(--color-dna-stories)",
};

function loadScores(): LearningScores {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(profileStorageKey) ?? "null");
    const scores = typeof value === "object" && value !== null ? (value as Record<string, unknown>).scores : null;
    if (typeof scores === "object" && scores !== null) return scores as LearningScores;
  } catch { /* ignore */ }
  return emptyScores;
}

function dayLabel(dateString: string | undefined, dayNumber: number): string {
  if (!dateString) return `Day ${dayNumber}`;
  const date = new Date(dateString);
  const today = new Date();
  const diff = Math.round((date.getTime() - today.setHours(0, 0, 0, 0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function PlannerShell() {
  const [settings, setSettings] = useState(defaults);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [ready, setReady] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(studyPlanSettingsStorageKey) ?? "null");
        if (typeof saved === "object" && saved !== null) setSettings({ ...defaults, ...(saved as Partial<StudyPlanSettings>) });
        setPlan(readStudyPlan());
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function createPlan() {
    const next = generateStudyPlan(settings, loadScores(), getTopicMastery(), readLearningHistory());
    saveStudyPlan(next);
    localStorage.setItem(studyPlanSettingsStorageKey, JSON.stringify(settings));
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
          : { ...day, tasks: day.tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)) },
      ),
    };
    saveStudyPlan(next);
    setPlan(next);
  }

  if (!ready) return <main className="min-h-screen bg-paper-50" aria-busy="true" />;

  const summary = plan ? calculatePlanSummary(plan) : null;
  const currentDay = plan?.days.find((day) => day.tasks.some((task) => !task.completed));

  return (
    <>
      <AppNavigation />
      <main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-paper-50 px-5 py-10 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_5%,rgba(167,139,250,0.08),transparent_35%)]" />
        <div className="mx-auto max-w-5xl">
          <header className="max-w-2xl">
            <p className="eyebrow-num text-ink-500">Personalized study plan</p>
            <h1 className="font-display mt-3 text-4xl leading-tight tracking-tight text-ink-950 sm:text-5xl">
              A day-by-day journey,<br />not a calendar grid.
            </h1>
            <p className="mt-4 text-base leading-7 text-ink-700">
              Ada builds a focused path from your recent lessons, mastery, and current Learning DNA —
              one day at a time, with a clear next step.
            </p>
          </header>

          {/* Plan setup */}
          <section className="surface-paper mt-8 rounded-[2rem] p-6 sm:p-7">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl text-ink-950">Plan setup</h2>
              <span className="font-mono text-xs uppercase tracking-wider text-ink-500">tune the journey</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-ink-700">Goal
                <select value={settings.goal} onChange={(e) => setSettings({ ...settings, goal: e.target.value as StudyPlanGoal })} className="mt-2 w-full rounded-xl border border-ink-900/12 bg-paper-50 px-3 py-2.5 text-ink-800 outline-none focus:border-dna-analogies focus:ring-2 focus:ring-dna-analogies/15">
                  <option value="review">Review weak topics</option>
                  <option value="continue">Continue learning path</option>
                  <option value="exam">Prepare for an exam</option>
                  <option value="habit">Build study habits</option>
                  <option value="explore">Explore a new subject</option>
                </select>
              </label>
              <label className="text-sm font-medium text-ink-700">Minutes per day
                <input type="number" min={5} max={180} value={settings.minutesPerDay} onChange={(e) => setSettings({ ...settings, minutesPerDay: Math.max(5, Math.min(180, Number(e.target.value) || 5)) })} className="mt-2 w-full rounded-xl border border-ink-900/12 bg-paper-50 px-3 py-2.5 text-ink-800 outline-none focus:border-dna-analogies focus:ring-2 focus:ring-dna-analogies/15" />
              </label>
              <label className="text-sm font-medium text-ink-700">Duration
                <select value={settings.durationDays} onChange={(e) => setSettings({ ...settings, durationDays: Number(e.target.value) as 3 | 7 | 14 })} className="mt-2 w-full rounded-xl border border-ink-900/12 bg-paper-50 px-3 py-2.5 text-ink-800 outline-none focus:border-dna-analogies focus:ring-2 focus:ring-dna-analogies/15">
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                </select>
              </label>
              <label className="text-sm font-medium text-ink-700">Intensity
                <select value={settings.intensity} onChange={(e) => setSettings({ ...settings, intensity: e.target.value as StudyIntensity })} className="mt-2 w-full rounded-xl border border-ink-900/12 bg-paper-50 px-3 py-2.5 text-ink-800 outline-none focus:border-dna-analogies focus:ring-2 focus:ring-dna-analogies/15">
                  <option value="light">Light</option>
                  <option value="balanced">Balanced</option>
                  <option value="focused">Focused</option>
                </select>
              </label>
              <label className="text-sm font-medium text-ink-700">Target date (optional)
                <input type="date" value={settings.targetDate ?? ""} onChange={(e) => setSettings({ ...settings, targetDate: e.target.value || undefined })} className="mt-2 w-full rounded-xl border border-ink-900/12 bg-paper-50 px-3 py-2.5 text-ink-800 outline-none focus:border-dna-analogies focus:ring-2 focus:ring-dna-analogies/15" />
              </label>
              <label className="text-sm font-medium text-ink-700">Topic priorities (optional)
                <input value={settings.priorities ?? ""} onChange={(e) => setSettings({ ...settings, priorities: e.target.value.slice(0, 160) })} placeholder="e.g. biology, algebra" className="mt-2 w-full rounded-xl border border-ink-900/12 bg-paper-50 px-3 py-2.5 text-ink-800 outline-none focus:border-dna-analogies focus:ring-2 focus:ring-dna-analogies/15" />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => (plan ? setConfirmReplace(true) : createPlan())} className="rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-paper-50 transition hover:-translate-y-0.5 hover:bg-ink-800">
                {plan ? "Regenerate plan" : "Build my study plan →"}
              </button>
              <AnimatePresence>
                {confirmReplace ? (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-ink-700">
                    <span>Replace the current plan?</span>
                    <button type="button" onClick={createPlan} className="font-semibold text-rose-700">Replace</button>
                    <button type="button" onClick={() => setConfirmReplace(false)} className="font-semibold text-ink-500">Cancel</button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </section>

          {/* The journey — vertical timeline */}
          {plan && summary ? (
            <section className="mt-10" aria-labelledby="journey-title">
              {/* Progress banner */}
              <div
                className="rounded-[2rem] p-6 sm:p-7"
                style={{
                  background: "linear-gradient(160deg, rgba(167,139,250,0.10), var(--color-paper-50) 70%)",
                  border: "1px solid rgba(167,139,250,0.25)",
                }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <p className="eyebrow-num text-dna-analogies">Your journey</p>
                    <h2 id="journey-title" className="font-display mt-2 text-2xl text-ink-950">{summary.percentage}% complete</h2>
                  </div>
                  <p className="text-sm text-ink-600">
                    {summary.completedTasks}/{summary.totalTasks} tasks · {summary.completedMinutes}/{summary.totalMinutes} min
                  </p>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-900/8">
                  <div className="h-full rounded-full bg-gradient-to-r from-dna-analogies via-dna-visual to-dna-examples transition-all duration-700" style={{ width: `${summary.percentage}%` }} />
                </div>
                {plan.summary ? <p className="mt-4 text-sm leading-6 text-ink-600">{plan.summary}</p> : null}
              </div>

              {/* Timeline */}
              <ol className="relative mt-10 pl-8 sm:pl-10">
                {/* The spine */}
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-dna-analogies via-ink-900/15 to-transparent sm:left-3.5" aria-hidden="true" />

                {plan.days.map((day, dayIndex) => {
                  const isCurrent = currentDay?.dayNumber === day.dayNumber;
                  const isPast = currentDay && day.dayNumber < currentDay.dayNumber;
                  const allDone = day.tasks.every((t) => t.completed);
                  const label = dayLabel(day.date, day.dayNumber);
                  return (
                    <motion.li
                      key={day.dayNumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: easeOutExpo, delay: dayIndex * 0.05 }}
                      className="relative pb-10 last:pb-0"
                    >
                      {/* Milestone dot on the spine */}
                      <span
                        className="absolute -left-[1.4rem] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-paper-50 sm:-left-[1.65rem]"
                        style={{
                          borderColor: allDone ? "var(--color-dna-visual)" : isCurrent ? "var(--color-dna-analogies)" : "color-mix(in srgb, var(--color-ink-900) 18%, transparent)",
                          boxShadow: isCurrent ? "0 0 0 4px rgba(167,139,250,0.15)" : allDone ? "0 0 14px -2px var(--color-dna-visual)" : "none",
                        }}
                      >
                        {allDone ? <span className="h-2 w-2 rounded-full bg-dna-visual" /> : isCurrent ? <span className="h-2 w-2 animate-pulse-soft rounded-full bg-dna-analogies" /> : null}
                      </span>

                      {/* Day header */}
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs uppercase tracking-wider text-ink-500">
                            {label}{isCurrent ? <span className="ml-2 rounded-full bg-dna-analogies/15 px-2 py-0.5 text-dna-analogies">in focus</span> : null}
                          </p>
                          <h3 className="font-display mt-1 text-2xl text-ink-950">{day.focus}</h3>
                        </div>
                        <p className="font-mono text-sm text-ink-500">{day.totalMinutes} min</p>
                      </div>

                      {/* Tasks */}
                      <div className="mt-4 space-y-2.5">
                        {day.tasks.map((task) => {
                          const color = taskTypeColor[task.type];
                          const approach = task.teachingApproach[0] as LearningDimension;
                          return (
                            <div
                              key={task.id}
                              className={`group relative flex flex-col gap-3 rounded-2xl border bg-paper-50 p-4 transition sm:flex-row sm:items-center ${isPast && !task.completed ? "opacity-60" : ""} ${task.completed ? "border-ink-900/8" : "border-ink-900/10 hover:border-ink-900/20"}`}
                            >
                              <span className="absolute left-0 top-0 h-full w-1 rounded-l-2xl" style={{ background: task.completed ? "var(--color-dna-visual)" : color, opacity: task.completed ? 0.6 : 1 }} />
                              <button
                                type="button"
                                onClick={() => toggleTask(dayIndex, task.id)}
                                className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs transition"
                                style={{
                                  borderColor: task.completed ? "var(--color-dna-visual)" : "color-mix(in srgb, var(--color-ink-900) 22%, transparent)",
                                  background: task.completed ? "var(--color-dna-visual)" : "transparent",
                                  color: task.completed ? "var(--color-midnight-950)" : "transparent",
                                }}
                                aria-label={`Mark ${task.topic} ${task.type} complete`}
                              >
                                {task.completed ? "✓" : ""}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className={`font-medium ${task.completed ? "text-ink-400 line-through" : "text-ink-900"}`}>
                                  <span className="font-mono text-xs uppercase tracking-wider mr-2" style={{ color }}>{task.type.replace("-", " ")}</span>
                                  {task.topic}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-ink-600">{task.reason}</p>
                                {approach ? (
                                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink-900/5 px-2 py-0.5 text-[0.7rem] text-ink-600">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: dnaHex[approach] }} />
                                    {approach}
                                  </span>
                                ) : null}
                              </div>
                              <span className="font-mono text-sm font-semibold text-ink-700">{task.minutes}m</span>
                              <Link
                                href={`/tutor?topic=${encodeURIComponent(task.topic)}`}
                                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5"
                                style={{ color: "var(--color-dna-analogies)" }}
                              >
                                Start →
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            </section>
          ) : (
            <section className="surface-paper mt-8 rounded-[2rem] border-dashed border-ink-900/15 p-10 text-center">
              <p className="font-display text-xl text-ink-950">Your journey appears here.</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">Choose your goal and duration above, then build the plan.</p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
