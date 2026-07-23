"use client";

import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import {
  learningDimensionLabels,
  type LearningScores,
} from "@/lib/learning-dna";

export function PersonalizationCard({ scores }: { scores: LearningScores }) {
  const profile = buildTeachingProfile(scores);

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      aria-labelledby="personalization-title"
      className="am-card p-6 sm:p-7"
    >
      <motion.div variants={slideUp}>
        <p className="am-label text-[var(--am-text-muted)]">
          How Ada adapts
        </p>
        <h2
          id="personalization-title"
          className="am-heading-serif mt-2 text-xl text-[var(--am-text-primary)]"
        >
          Your adaptive approach
        </h2>
      </motion.div>

      <motion.div variants={slideUp} className="mt-5 space-y-3">
        <p className="text-sm font-medium text-[var(--am-text-secondary)]">
          Today&apos;s lessons are shaped by:
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-[var(--am-radius-md)] border border-[var(--am-primary)]/20 bg-[var(--am-primary-light)] px-3 py-1.5 text-sm font-semibold text-[var(--am-primary)]">
            {learningDimensionLabels[profile.primaryDimension]}
          </span>
          <span className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-3 py-1.5 text-sm font-semibold text-[var(--am-text-secondary)]">
            {learningDimensionLabels[profile.secondaryDimension]}
          </span>
        </div>
      </motion.div>

      <motion.div
        variants={slideUp}
        className="mt-5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] p-4"
      >
        <p className="am-label text-[var(--am-primary)]/70">
          Why this matters
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
          Ada starts with{" "}
          {learningDimensionLabels[profile.primaryDimension].toLowerCase()} and
          uses{" "}
          {learningDimensionLabels[profile.secondaryDimension].toLowerCase()}{" "}
          when it helps make the idea clearer. As you complete lessons, Ada
          estimates which approaches appear to improve your understanding.
        </p>
      </motion.div>
    </motion.section>
  );
}
