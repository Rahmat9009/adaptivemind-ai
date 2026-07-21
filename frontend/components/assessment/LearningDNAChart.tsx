"use client";

import { motion } from "motion/react";
import {
  learningDimensionLabels,
  learningDimensions,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";

interface LearningDNAChartProps {
  scores: LearningScores;
  isVisible: boolean;
}

const dnaColors: Record<LearningDimension, string> = {
  visual: "#0891B2",
  examples: "#B45309",
  analogies: "#7C3AED",
  stories: "#BE185D",
  challenges: "#DC2626",
};

function DimensionIcon({ dimension }: { dimension: LearningDimension }) {
  const shared = {
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };
  if (dimension === "visual")
    return (
      <svg {...shared}>
        <path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  if (dimension === "examples")
    return (
      <svg {...shared}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h5M8 17h3" />
      </svg>
    );
  if (dimension === "analogies")
    return (
      <svg {...shared}>
        <path d="M7 12h10M7 8h4M13 16h4" />
        <circle cx="5" cy="8" r="2" />
        <circle cx="19" cy="16" r="2" />
      </svg>
    );
  if (dimension === "stories")
    return (
      <svg {...shared}>
        <path d="M5 5.5A3.5 3.5 0 0 1 9 6v13a3.5 3.5 0 0 0-4-0.5V5.5ZM19 5.5A3.5 3.5 0 0 0 15 6v13a3.5 3.5 0 0 1 4-0.5V5.5Z" />
        <path d="M9 6h6" />
      </svg>
    );
  return (
    <svg {...shared}>
      <path d="m12 3 1.9 5.8H20l-5 3.6 1.9 5.8-4.9-3.6-4.9 3.6 1.9-5.8-5-3.6h6.1L12 3Z" />
    </svg>
  );
}

export function LearningDNAChart({
  scores,
  isVisible,
}: LearningDNAChartProps) {
  return (
    <section
      aria-labelledby="dna-chart-title"
      className="am-card p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="dna-chart-title" className="text-xl font-semibold text-[var(--am-text-primary)]">
          All approaches
        </h2>
        <span className="text-sm text-[var(--am-text-muted)]">Initial profile</span>
      </div>

      <div className="mt-6 space-y-5">
        {learningDimensions.map((dimension, index) => (
          <div key={dimension}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-[var(--am-text-secondary)]">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--am-radius-md)]"
                  style={{
                    backgroundColor: `${dnaColors[dimension]}12`,
                    color: dnaColors[dimension],
                  }}
                >
                  <DimensionIcon dimension={dimension} />
                </span>
                <span className="text-sm font-medium">{learningDimensionLabels[dimension]}</span>
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ color: dnaColors[dimension] }}>
                {scores[dimension]}%
              </span>
            </div>

            <div className="mt-2 am-progress-track">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: isVisible ? `${scores[dimension]}%` : "0%" }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: index * 0.1,
                }}
                style={{ background: `linear-gradient(90deg, ${dnaColors[dimension]}, ${dnaColors[dimension]}88)` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
