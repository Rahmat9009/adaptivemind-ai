"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import {
  calculatePlanSummary,
  isPlanTaskDue,
  type StudyPlan,
} from "@/lib/study-planner";

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

export function StudyPlanCard({ plan }: { plan: StudyPlan | null }) {
  if (!plan) {
    return (
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="am-card p-6 border-dashed"
      >
        <motion.div variants={slideUp}>
          <h2 className="am-heading-serif text-xl text-[var(--am-text-primary)]">
            My Study Plan
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
            Turn your current learning progress into a realistic short-term plan.
          </p>
          <Link href="/planner" className="am-btn am-btn-primary mt-4 inline-flex">
            Build my study plan
          </Link>
        </motion.div>
      </motion.section>
    );
  }

  const summary = calculatePlanSummary(plan);
  const day =
    plan.days.find((item) => item.tasks.some((task) => !task.completed)) ??
    plan.days[0];
  const next = day?.tasks.find((task) => !task.completed);
  const dueCount = plan.days.reduce(
    (count, planDay) =>
      count
      + planDay.tasks.filter((task) =>
        isPlanTaskDue(task, planDay.date),
      ).length,
    0,
  );

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6"
    >
      <motion.div variants={slideUp}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="am-heading-serif text-xl text-[var(--am-text-primary)]">
              My Study Plan
            </h2>
            <p className="mt-1 text-sm text-[var(--am-text-secondary)]">
              Day {day?.dayNumber}: {day?.focus}
            </p>
          </div>
          <span className="rounded-[var(--am-radius-md)] bg-[var(--am-primary-light)] px-3 py-1 text-sm font-semibold text-[var(--am-primary)]">
            {summary.percentage}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="am-progress-track mt-4">
          <motion.div
            className="am-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${summary.percentage}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[var(--am-text-secondary)]">
            {summary.completedTasks}/{summary.totalTasks} tasks &middot;{" "}
            {summary.completedMinutes}/{summary.totalMinutes} min
          </p>
          {next && (
            <p className="text-sm text-[var(--am-text-muted)]">
              Next:{" "}
              <span className="font-medium text-[var(--am-text-secondary)]">
                {next.type.replace("-", " ")}
              </span>
            </p>
          )}
        </div>
        {dueCount > 0 && (
          <p className="mt-3 text-sm font-semibold text-[var(--am-warning)]">
            {dueCount} planner task{dueCount === 1 ? "" : "s"} due
          </p>
        )}

        <Link href="/planner" className="am-btn am-btn-ghost mt-4 inline-flex items-center gap-1.5">
          Open plan
          <ArrowRightIcon />
        </Link>
      </motion.div>
    </motion.section>
  );
}
