"use client";

import { motion } from "motion/react";
import type { CalibrationSummary } from "@/lib/confidence-calibration";
import { fadeIn } from "@/lib/motion";

const categoryLabels: Record<CalibrationSummary["category"], string> = {
  "well-calibrated": "Confidence aligned with performance",
  overconfident: "One or more confident gaps remain",
  underconfident: "Understanding is stronger than confidence",
  "low-confidence-low-understanding": "Understanding is still developing",
  "insufficient-data": "More evidence is needed",
};

export function ConfidenceInsightCard({
  summary,
}: {
  summary: CalibrationSummary;
}) {
  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6"
      aria-labelledby="confidence-insight-title"
    >
      <p className="am-label text-[var(--am-text-muted)]">
        Confidence calibration
      </p>
      <h2
        id="confidence-insight-title"
        className="am-heading-serif mt-1 text-xl text-[var(--am-text-primary)]"
      >
        {categoryLabels[summary.category]}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--am-text-secondary)]">
        {summary.description}
      </p>

      {summary.recordCount >= 2 && (
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--am-border-light)] pt-4">
          <div>
            <p className="text-xs text-[var(--am-text-muted)]">
              Average confidence
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
              {summary.averageConfidence}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--am-text-muted)]">
              Average performance
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
              {summary.averagePerformance}%
            </p>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-[var(--am-text-muted)]">
        Based on {summary.recordCount} confidence check
        {summary.recordCount === 1 ? "" : "s"}.
      </p>
    </motion.section>
  );
}
