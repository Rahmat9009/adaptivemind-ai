"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import type { LearningDimension } from "@/lib/learning-dna";
import {
  loadLearningDNA2,
  generateRecommendation,
  type LearningDNA2,
} from "@/lib/learning-dna-v2";
import type { TeachingMode } from "@/lib/ai/types";

const MODE_LABELS: Record<string, string> = {
  visual: "Visual",
  examples: "Examples",
  analogies: "Analogies",
  stories: "Stories",
  challenges: "Challenges",
  adaptive: "Adaptive (auto-select)",
};

const MODE_DESCRIPTIONS: Record<string, string> = {
  visual: "Diagrams, charts, and spatial relationships.",
  examples: "Concrete worked examples and real cases.",
  analogies: "Familiar comparisons to other domains.",
  stories: "Narrative-driven explanations.",
  challenges: "Problem-first, learn by solving.",
  adaptive: "Let Ada select based on your Learning DNA.",
};

export function WhyThisMode({
  activeMode,
  onModeChange,
  availableModes,
}: {
  activeMode: TeachingMode;
  onModeChange: (mode: TeachingMode) => void;
  availableModes: TeachingMode[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dna: LearningDNA2 | null = (() => {
    try {
      return loadLearningDNA2();
    } catch {
      return null;
    }
  })();

  const recommendation = dna ? generateRecommendation(dna) : null;

  const activeDimension =
    activeMode === "adaptive" && recommendation
      ? recommendation.recommendation
      : activeMode;

  const evidence = dna?.observedEffectiveness[activeDimension as LearningDimension];

  function confidenceLabel(conf: number): string {
    if (conf >= 70) return "Strong";
    if (conf >= 40) return "Moderate";
    if (conf >= 15) return "Low";
    return "Very low";
  }

  function evidenceSource(
    dna: LearningDNA2 | null,
    dim: string,
  ): "Stated preference" | "Observed outcomes" | "Both" | "No data" {
    if (!dna) return "No data";
    const ev = dna.observedEffectiveness[dim as LearningDimension];
    const hasStated = dna.initialPreferences[dim as LearningDimension] > 0;
    const hasObserved = (ev?.evidenceCount ?? 0) > 0;
    if (hasStated && hasObserved) return "Both";
    if (hasStated) return "Stated preference";
    if (hasObserved) return "Observed outcomes";
    return "No data";
  }

  const source = evidenceSource(dna, activeDimension);
  const totalEvidence = evidence?.evidenceCount ?? 0;

  return (
    <motion.div
      variants={fadeIn}
      className="mt-4 rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)]"
      role="region"
      aria-label="Teaching mode explanation"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--am-primary)]"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span className="text-xs font-semibold text-[var(--am-text-primary)]">
            Why this mode?
          </span>
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[var(--am-text-muted)] transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isExpanded && (
        <motion.div
          variants={slideUp}
          className="border-t border-[var(--am-border-light)] p-3 pt-3"
        >
          {/* Active approach */}
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-[var(--am-text-muted)]">
                Active approach
              </p>
              <p className="text-sm font-semibold text-[var(--am-text-primary)]">
                {MODE_LABELS[activeMode] ?? activeMode}
              </p>
              <p className="text-xs leading-5 text-[var(--am-text-secondary)]">
                {MODE_DESCRIPTIONS[activeMode] ?? ""}
              </p>
            </div>

            {/* Recommendation reason */}
            {recommendation && (
              <div>
                <p className="text-xs font-medium text-[var(--am-text-muted)]">
                  Why Ada recommended this
                </p>
                <p className="text-xs leading-5 text-[var(--am-text-secondary)]">
                  {recommendation.reason}
                </p>
              </div>
            )}

            {/* Confidence and evidence */}
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--am-text-muted)]">
                  Confidence
                </p>
                <p className="text-sm font-semibold text-[var(--am-text-primary)]">
                  {recommendation
                    ? confidenceLabel(recommendation.confidence)
                    : "No data"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--am-text-muted)]">
                  Evidence
                </p>
                <p className="text-sm font-semibold text-[var(--am-text-primary)]">
                  {totalEvidence > 0 ? `${totalEvidence} check(s)` : "None yet"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--am-text-muted)]">
                  Source
                </p>
                <p className="text-sm font-semibold text-[var(--am-text-primary)]">
                  {source}
                </p>
              </div>
            </div>

            {/* Stated vs observed */}
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-[var(--am-text-muted)] hover:text-[var(--am-text-secondary)]">
                Stated preference vs observed effectiveness
              </summary>
              <div className="mt-2 space-y-1">
                {dna &&
                  (Object.keys(dna.initialPreferences) as LearningDimension[]).map(
                    (dim) => {
                      const stated = dna.initialPreferences[dim];
                      const obs = dna.observedEffectiveness[dim];
                      return (
                        <div
                          key={dim}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="text-[var(--am-text-secondary)]">
                            {MODE_LABELS[dim]}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-[var(--am-text-muted)]">
                              {stated}%
                            </span>
                            <span
                              className={`${
                                obs.evidenceCount > 0
                                  ? "text-[var(--am-primary)]"
                                  : "text-[var(--am-text-muted)]"
                              }`}
                            >
                              {obs.evidenceCount > 0
                                ? `${obs.weightedEffectiveness}% eff.`
                                : "no data"}
                            </span>
                          </span>
                        </div>
                      );
                    },
                  )}
              </div>
            </details>
          </div>

          {/* Alternative mode picker */}
          <div className="mt-3 border-t border-[var(--am-border-light)] pt-3">
            <p className="text-xs font-medium text-[var(--am-text-muted)] mb-1.5">
              Try a different approach
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onModeChange(mode)}
                  disabled={mode === activeMode}
                  className={`rounded-[var(--am-radius-md)] px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    mode === activeMode
                      ? "bg-[var(--am-primary)] text-white cursor-default"
                      : "bg-[var(--am-surface)] text-[var(--am-text-secondary)] border border-[var(--am-border-light)] hover:border-[var(--am-primary)]/30 hover:text-[var(--am-primary)]"
                  }`}
                >
                  {MODE_LABELS[mode] ?? mode}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
