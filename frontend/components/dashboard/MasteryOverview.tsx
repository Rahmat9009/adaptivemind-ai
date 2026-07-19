"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { TopicMastery } from "@/lib/mastery";

export function MasteryOverview({
  entries,
  mastered,
  developing,
  needsReview,
  averageRecentScore,
}: {
  entries: TopicMastery[];
  mastered: number;
  developing: number;
  needsReview: number;
  averageRecentScore: number | null;
}) {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)]"
      aria-labelledby="mastery-title"
    >
      <h2
        id="mastery-title"
        className="text-xl font-semibold text-[var(--am-text-primary)]"
      >
        Mastery journey
      </h2>

      {entries.length > 0 ? (
        <>
          <motion.div
            variants={staggerItem}
            className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3">
              <p className="text-xs text-[var(--am-text-muted)]">Mastered</p>
              <p className="text-2xl font-semibold text-[var(--am-success)]">
                {mastered}
              </p>
            </div>
            <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3">
              <p className="text-xs text-[var(--am-text-muted)]">Developing</p>
              <p className="text-2xl font-semibold text-[var(--am-warning)]">
                {developing}
              </p>
            </div>
            <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3">
              <p className="text-xs text-[var(--am-text-muted)]">
                Needs review
              </p>
              <p className="text-2xl font-semibold text-[var(--am-error)]">
                {needsReview}
              </p>
            </div>
            <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3">
              <p className="text-xs text-[var(--am-text-muted)]">
                Recent score
              </p>
              <p className="text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
                {averageRecentScore ?? "—"}
                {averageRecentScore !== null ? "%" : ""}
              </p>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-5 space-y-2">
            {entries.slice(0, 5).map((entry) => (
              <div
                key={entry.topicId}
                className="flex items-center justify-between gap-3 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] px-4 py-2.5"
              >
                <span className="text-sm font-medium text-[var(--am-text-primary)]">
                  {entry.topic}
                </span>
                <span className="text-xs font-medium text-[var(--am-text-muted)] capitalize">
                  {entry.masteryLevel.replace("-", " ")}
                </span>
              </div>
            ))}
          </motion.div>
        </>
      ) : (
        <motion.p
          variants={staggerItem}
          className="mt-3 text-sm leading-6 text-[var(--am-text-secondary)]"
        >
          Complete an understanding check after a lesson to begin tracking
          mastery.
        </motion.p>
      )}
    </motion.section>
  );
}
