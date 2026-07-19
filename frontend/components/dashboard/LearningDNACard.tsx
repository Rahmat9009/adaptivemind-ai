"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import {
  learningDimensionLabels,
  learningDimensions,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
import { LearningDNAConstellation } from "@/components/three/LearningDNAConstellation";

const dnaColors: Record<LearningDimension, string> = {
  visual: "#22d3ee",
  examples: "#f59e0b",
  analogies: "#8b5cf6",
  stories: "#fb7185",
  challenges: "#fb6a4a",
};

export function LearningDNACard({ scores }: { scores: LearningScores }) {
  const profile = buildTeachingProfile(scores);

  return (
    <section
      aria-labelledby="learning-dna-card-title"
      className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)] sm:p-7"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-text-muted)]">
        Current Learning DNA
      </p>
      <h2
        id="learning-dna-card-title"
        className="mt-2 text-2xl font-semibold tracking-tight"
        style={{ color: dnaColors[profile.primaryDimension] }}
      >
        {learningDimensionLabels[profile.primaryDimension]}
      </h2>
      <p className="mt-1 text-sm text-[var(--am-text-secondary)]">
        strongest preference &middot; supporting:{" "}
        {learningDimensionLabels[profile.secondaryDimension].toLowerCase()}
      </p>

      <div className="mt-5">
        <LearningDNAConstellation
          scores={scores}
          activeDimension={profile.primaryDimension}
        />
      </div>

      {/* Dimension bars */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-6 space-y-3"
      >
        {learningDimensions.map((dimension) => (
          <motion.div key={dimension} variants={staggerItem}>
            <div className="flex justify-between gap-4 text-sm">
              <span className="font-medium text-[var(--am-text-secondary)]">
                {learningDimensionLabels[dimension]}
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: dnaColors[dimension] }}
              >
                {scores[dimension]}%
              </span>
            </div>
            <div className="am-progress-track mt-1.5">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${scores[dimension]}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  backgroundColor: dnaColors[dimension],
                }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-6 text-sm leading-6 text-[var(--am-text-secondary)] border-t border-[var(--am-border-light)] pt-5">
        You understand new ideas best through{" "}
        {learningDimensionLabels[profile.primaryDimension].toLowerCase()}-led
        explanations, with support from{" "}
        {learningDimensionLabels[profile.secondaryDimension].toLowerCase()}.
      </p>
    </section>
  );
}
