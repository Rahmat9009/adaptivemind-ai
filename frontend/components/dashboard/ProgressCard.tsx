"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface ProgressCardProps {
  lessonsCompleted: number;
  topicsExplored: number;
  streak: number;
  lastLessonDate: string | null;
}

export function ProgressCard({
  lessonsCompleted,
  topicsExplored,
  streak,
  lastLessonDate,
}: ProgressCardProps) {
  return (
    <section
      aria-labelledby="progress-title"
      className="am-card p-6"
    >
      <h2
        id="progress-title"
        className="am-heading-serif text-xl text-[var(--am-text-primary)]"
      >
        Your progress
      </h2>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5"
      >
        <motion.div variants={staggerItem}>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Lessons completed
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {lessonsCompleted}
          </p>
        </motion.div>
        <motion.div variants={staggerItem}>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Topics explored
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {topicsExplored}
          </p>
        </motion.div>
        <motion.div variants={staggerItem}>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Current streak
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {streak}{" "}
            <span className="text-sm font-normal text-[var(--am-text-muted)]">
              day{streak === 1 ? "" : "s"}
            </span>
          </p>
        </motion.div>
        <motion.div variants={staggerItem}>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Last lesson
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--am-text-secondary)]">
            {lastLessonDate ?? "Not yet started"}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
