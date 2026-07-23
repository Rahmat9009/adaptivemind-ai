"use client";

import { motion } from "motion/react";
import { slideUp } from "@/lib/motion";

interface DashboardHeaderProps {
  activeDays: number;
  meaningfulActions: number;
  primaryLabel: string;
}

export function DashboardHeader({
  activeDays,
  meaningfulActions,
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
          <h1 className="am-heading-serif mt-2 text-2xl leading-[1.12] sm:text-4xl">
            Your learning dashboard
          </h1>
          <p className="mt-1 text-base text-[var(--am-text-secondary)]">
            Evidence, next steps, and review needs on this device.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] px-4 py-3 text-center">
            <p className="am-label text-[var(--am-text-muted)]">
              Active days
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--am-text-primary)]">
              {activeDays}
            </p>
          </div>
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] px-4 py-3 text-center">
            <p className="am-label text-[var(--am-text-muted)]">
              Actions
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--am-text-primary)]">
              {meaningfulActions}
            </p>
          </div>
          <div className="col-span-2 rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] px-4 py-3 text-center sm:col-span-1">
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
