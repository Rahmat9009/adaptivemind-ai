"use client";

import { motion } from "motion/react";
import {
  buildActivityDays,
  getLearningActivityLabel,
  getLearningMomentum,
  type LearningActivity,
} from "@/lib/learning-activity";
import { fadeIn } from "@/lib/motion";

function intensityClass(count: number): string {
  if (count === 0) return "border border-[var(--am-border)] bg-[var(--am-bg)]";
  if (count === 1) return "bg-[#BAE6FD]";
  if (count === 2) return "bg-[#38BDF8]";
  if (count === 3) return "bg-[#1751EF]";
  return "bg-[#7C3AED]";
}

function formatActivityDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ActivityHeatmap({
  activities,
  loading,
}: {
  activities: LearningActivity[];
  loading: boolean;
}) {
  const days = buildActivityDays(activities);
  const momentum = getLearningMomentum(activities);
  const total = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6"
      aria-labelledby="activity-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="am-label text-[var(--am-text-muted)]">
            Learning momentum
          </p>
          <h2
            id="activity-title"
            className="am-heading-serif mt-1 text-xl text-[var(--am-text-primary)]"
          >
            Meaningful activity
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {momentum.activeDaysLast14}
          </p>
          <p className="text-xs text-[var(--am-text-muted)]">
            active days in 14
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 h-32 animate-pulse bg-[var(--am-bg-reading)]" role="status">
          <span className="sr-only">Loading meaningful activity</span>
        </div>
      ) : (
        <>
          <div
            className="mt-5 grid grid-flow-col grid-rows-7 justify-start gap-0.5 sm:gap-1"
            role="img"
            aria-label={`${total} meaningful learning actions across the last 17 weeks`}
          >
            {days.map((day) => (
              <span
                key={day.date}
                className={`h-2.5 w-2.5 rounded-[2px] sm:h-3 sm:w-3 ${intensityClass(day.count)}`}
                title={`${day.date}: ${day.count} meaningful action${day.count === 1 ? "" : "s"}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--am-text-muted)]">
            <span>{total} actions in 17 weeks</span>
            <span>
              Checks, Explain Back, challenges, recall, and completed plan tasks
            </span>
          </div>
        </>
      )}

      <div className="mt-5 border-t border-[var(--am-border-light)] pt-4">
        <h3 className="text-sm font-semibold text-[var(--am-text-primary)]">
          Recent activity
        </h3>
        {activities.length ? (
          <ul className="mt-2 divide-y divide-[var(--am-border-light)]">
            {activities.slice(0, 5).map((activity) => (
              <li
                key={activity.id}
                className="flex min-w-0 items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[var(--am-text-primary)]">
                    {getLearningActivityLabel(activity.type)}
                  </span>
                  {activity.topic && (
                    <span className="block truncate text-xs text-[var(--am-text-muted)]">
                      {activity.topic}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-[var(--am-text-muted)]">
                  {formatActivityDate(activity.occurredAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
            Complete a check, Explain Back, challenge, recall, or plan task to
            begin this private activity view.
          </p>
        )}
      </div>
    </motion.section>
  );
}
