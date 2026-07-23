"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
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
      className="am-card p-6"
      aria-labelledby="mastery-title"
    >
      <h2
        id="mastery-title"
        className="am-heading-serif text-xl text-[var(--am-text-primary)]"
      >
        Mastery journey
      </h2>

      {entries.length > 0 ? (
        <>
          <motion.div
            variants={staggerItem}
            className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            <div className="rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-white px-4 py-3 shadow-[var(--am-shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--am-text-muted)]">Mastered</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--am-success)]">{mastered}</p>
              {entries.length > 0 && (
                <ProgressBarBase value={mastered} max={entries.length} className="mt-2 h-1.5" progressClassName="bg-[var(--am-success)]" />
              )}
            </div>
            <div className="rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-white px-4 py-3 shadow-[var(--am-shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--am-text-muted)]">Developing</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--am-warning)]">{developing}</p>
              {entries.length > 0 && (
                <ProgressBarBase value={developing} max={entries.length} className="mt-2 h-1.5" progressClassName="bg-[var(--am-warning)]" />
              )}
            </div>
            <div className="rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-white px-4 py-3 shadow-[var(--am-shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--am-text-muted)]">Needs review</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--am-error)]">{needsReview}</p>
              {entries.length > 0 && (
                <ProgressBarBase value={needsReview} max={entries.length} className="mt-2 h-1.5" progressClassName="bg-[var(--am-error)]" />
              )}
            </div>
            <div className="rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-white px-4 py-3 shadow-[var(--am-shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--am-text-muted)]">Recent score</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
                {averageRecentScore ?? "—"}
                {averageRecentScore !== null ? "%" : ""}
              </p>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-5 space-y-2">
            {entries.slice(0, 5).map((entry) => {
              const masteryPct = entry.masteryPercent;
              return (
                <div
                  key={entry.topicId}
                  className="flex items-center justify-between gap-3 rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-white px-4 py-3"
                >
                  <span className="text-sm font-medium text-[var(--am-text-primary)]">
                    {entry.topic}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md border border-[var(--am-border-light)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--am-text-muted)]">
                      {entry.masteryLevel.replace("-", " ")}
                    </span>
                    {entry.evidenceCount > 0 && (
                      <span className="w-16">
                        <ProgressBarBase value={masteryPct} className="h-1.5" progressClassName="bg-[var(--am-primary)]" />
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
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
