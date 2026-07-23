"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type {
  ExplanationHistory,
  ExplanationRecord,
} from "@/lib/explanation-history";
import {
  learningDimensionLabels,
  type LearningDimension,
} from "@/lib/learning-dna";
import { fadeIn } from "@/lib/motion";

function displayApproach(
  approach: ExplanationRecord["approach"],
): string {
  return approach === "adaptive"
    ? "Adaptive"
    : learningDimensionLabels[approach as LearningDimension];
}

export function ExplanationHistorySummary({
  history,
}: {
  history: ExplanationHistory;
}) {
  const records = Object.values(history.concepts)
    .flat()
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const approachTotals = new Map<string, { score: number; count: number }>();
  for (const record of records) {
    const current = approachTotals.get(record.approach) ?? {
      score: 0,
      count: 0,
    };
    current.score += record.evaluationScore;
    current.count += 1;
    approachTotals.set(record.approach, current);
  }
  const strongest = [...approachTotals.entries()]
    .map(([approach, value]) => ({
      approach,
      average: Math.round(value.score / value.count),
      count: value.count,
    }))
    .sort((a, b) => b.average - a.average)[0];

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6"
      aria-labelledby="explanation-summary-title"
    >
      <p className="am-label text-[var(--am-text-muted)]">
        Explanation outcomes
      </p>
      <h2
        id="explanation-summary-title"
        className="am-heading-serif mt-1 text-xl text-[var(--am-text-primary)]"
      >
        Approaches tried
      </h2>

      {strongest ? (
        <div className="mt-4 border-l-4 border-[var(--am-dna-visual)] bg-[var(--am-bg-reading)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--am-text-primary)]">
            Strongest observed result: {displayApproach(
              strongest.approach as ExplanationRecord["approach"],
            )}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--am-text-secondary)]">
            Average check result {strongest.average}% across {strongest.count}{" "}
            observation{strongest.count === 1 ? "" : "s"}. This is evidence,
            not proof that the approach caused the result.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--am-text-secondary)]">
          Explanation outcomes appear after a meaningful understanding check.
        </p>
      )}

      {records.length > 0 && (
        <ul className="mt-4 divide-y divide-[var(--am-border-light)]">
          {records.slice(0, 4).map((record) => (
            <li
              key={`${record.conceptId}-${record.lessonId}-${record.checkType}`}
              className="py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--am-text-primary)]">
                    {record.conceptLabel}
                  </p>
                  <p className="mt-1 text-xs text-[var(--am-text-secondary)]">
                    {displayApproach(record.approach)} -{" "}
                    {record.checkType.replace("-", " ")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--am-text-secondary)]">
                    Estimated mastery {record.masteryBefore}% to{" "}
                    {record.masteryAfter}%
                    {record.masteryBefore === record.masteryAfter
                      ? " (no change from this evidence)"
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--am-text-primary)]">
                  {record.evaluationScore}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {records[0] && (
        <Link
          href={`/tutor?topic=${encodeURIComponent(records[0].conceptLabel)}`}
          className="am-btn am-btn-ghost mt-3"
        >
          Retry another approach
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </motion.section>
  );
}
