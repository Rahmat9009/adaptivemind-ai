"use client";

import { motion } from "motion/react";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/motion";
import {
  learningDimensionLabels,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";

interface LearningStyleSummaryProps {
  primaryStyle: LearningDimension;
  scores: LearningScores;
}

const guidance: Record<LearningDimension, string> = {
  visual:
    "clear visual structure and diagrams that make relationships easy to see",
  examples:
    "concrete situations that show how an idea works in practice",
  analogies:
    "familiar comparisons that connect new ideas to things you already know",
  stories:
    "connected narratives that give concepts a memorable context",
  challenges:
    "active practice that lets you test an idea and learn from feedback",
};

const approach: Record<LearningDimension, string> = {
  visual:
    "Ada will begin by making the structure and relationships easy to see.",
  examples:
    "Ada will begin with concrete situations before introducing abstract theory.",
  analogies:
    "Ada will begin by connecting new ideas to familiar ones.",
  stories:
    "Ada will begin with concise, contextual scenarios that make the idea memorable.",
  challenges:
    "Ada will begin with a question that invites you to reason through the idea.",
};

const dnaVisuals: Record<LearningDimension, { color: string }> = {
  visual: { color: "#22d3ee" },
  examples: { color: "#f59e0b" },
  analogies: { color: "#8b5cf6" },
  stories: { color: "#fb7185" },
  challenges: { color: "#fb6a4a" },
};

export function LearningStyleSummary({
  primaryStyle,
  scores,
}: LearningStyleSummaryProps) {
  const sorted = (Object.keys(scores) as LearningDimension[]).sort(
    (a, b) => scores[b] - scores[a],
  );
  const supportingStyle = sorted[1];
  const secondaryStyle = sorted[2];

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)] sm:p-8"
    >
      {/* Primary */}
      <motion.div variants={slideUp} className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-text-muted)]">
            Primary learning preference
          </p>
          <h2
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: dnaVisuals[primaryStyle].color }}
          >
            {learningDimensionLabels[primaryStyle]}
          </h2>
        </div>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: dnaVisuals[primaryStyle].color }}
        >
          {scores[primaryStyle]}%
        </span>
      </motion.div>

      <motion.p
        variants={slideUp}
        className="mt-4 leading-7 text-[var(--am-text-secondary)]"
      >
        Based on your current assessment, you respond best to{" "}
        <strong className="text-[var(--am-text-primary)]">
          {guidance[primaryStyle]}
        </strong>
        .
      </motion.p>

      <motion.div
        variants={slideUp}
        className="mt-6 rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-primary)]/70">
          Ada will teach you with
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
          {approach[primaryStyle]}
        </p>
      </motion.div>

      {/* Supporting preferences */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-6 space-y-3"
      >
        {supportingStyle && (
          <motion.div
            key={supportingStyle}
            variants={staggerItem}
            className="flex items-center justify-between gap-3 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--am-text-primary)]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: dnaVisuals[supportingStyle].color }}
              />
              {learningDimensionLabels[supportingStyle]}
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: dnaVisuals[supportingStyle].color }}
            >
              {scores[supportingStyle]}%
            </span>
          </motion.div>
        )}
        {secondaryStyle && (
          <motion.div
            key={secondaryStyle}
            variants={staggerItem}
            className="flex items-center justify-between gap-3 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--am-text-primary)]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: dnaVisuals[secondaryStyle].color }}
              />
              {learningDimensionLabels[secondaryStyle]}
            </span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: dnaVisuals[secondaryStyle].color }}
            >
              {scores[secondaryStyle]}%
            </span>
          </motion.div>
        )}
      </motion.div>
    </motion.section>
  );
}
