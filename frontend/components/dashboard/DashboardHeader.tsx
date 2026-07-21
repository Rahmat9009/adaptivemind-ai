"use client";

import { motion } from "motion/react";
import { slideUp } from "@/lib/motion";

interface DashboardHeaderProps {
  streak: number;
  lessonsCompleted: number;
  primaryLabel: string;
}

export function DashboardHeader({
  streak,
  lessonsCompleted,
  primaryLabel,
}: DashboardHeaderProps) {
  return (
    <motion.header
      variants={slideUp}
      className="am-card p-6 sm:p-8"
    >
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="am-label text-[var(--am-primary)]/70">
            Your learning space
          </p>
          <h1 className="am-heading-serif mt-2 text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.12]">
            Welcome back.
          </h1>
          <p className="mt-1 text-base text-[var(--am-text-secondary)]">
            Ready for today&apos;s lesson?
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] px-4 py-3 text-center">
            <p className="am-label text-[var(--am-text-muted)]">
              Streak
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--am-text-primary)]">
              {streak}
              <span className="text-sm font-normal text-[var(--am-text-muted)]">
                d
              </span>
            </p>
          </div>
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] px-4 py-3 text-center">
            <p className="am-label text-[var(--am-text-muted)]">
              Lessons
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--am-text-primary)]">
              {lessonsCompleted}
            </p>
          </div>
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] px-4 py-3 text-center">
            <p className="am-label text-[var(--am-text-muted)]">
              Approach
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--am-primary)]">
              {primaryLabel}
            </p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
