"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface ProgressCardProps {
  meaningfulActions: number;
  topicsWithEvidence: number;
  activeDays: number;
  lastActivityDate: string | null;
}

export function ProgressCard({
  meaningfulActions,
  topicsWithEvidence,
  activeDays,
  lastActivityDate,
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
            Meaningful actions
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {meaningfulActions}
          </p>
        </motion.div>
        <motion.div variants={staggerItem}>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Topics with evidence
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {topicsWithEvidence}
          </p>
        </motion.div>
        <motion.div variants={staggerItem}>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Active days in 14
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {activeDays}
          </p>
        </motion.div>
        <motion.div variants={staggerItem}>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Last activity
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--am-text-secondary)]">
            {lastActivityDate ?? "Not yet started"}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
