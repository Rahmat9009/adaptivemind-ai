"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import {
  type LearningDNA2,
  getEffectivenessRanking,
  computeRecommendationConfidence,
} from "@/lib/learning-dna-v2";
import { learningDimensionLabels } from "@/lib/learning-dna";

interface LearningDNAEvidenceProps {
  dna: LearningDNA2;
}

function confidenceBar(pct: number): string {
  if (pct >= 75) return "bg-[var(--am-success)]";
  if (pct >= 50) return "bg-[var(--am-primary)]";
  if (pct >= 25) return "bg-[var(--am-warning)]";
  return "bg-[var(--am-error)]";
}

export function LearningDNAEvidence({ dna }: LearningDNAEvidenceProps) {
  const [showDetails, setShowDetails] = useState(false);

  const effectivenessRanking = getEffectivenessRanking(dna);
  const confidence = computeRecommendationConfidence(dna);
  const totalEvidence = Object.values(dna.observedEffectiveness).reduce(
    (s, e) => s + e.evidenceCount, 0,
  );

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6 sm:p-7"
      aria-labelledby="evidence-title"
    >
      <p className="am-label text-[var(--am-text-muted)]">
        How AdaptiveMind adapts
      </p>
      <h2 id="evidence-title" className="am-heading-serif mt-2 text-xl text-[var(--am-text-primary)]">
        Learning DNA evidence
      </h2>

      {/* Current recommendation */}
      <div className="mt-5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] p-4">
        <p className="am-label text-[var(--am-primary)]/70 text-[10px]">
          Current recommendation
        </p>
        <p className="mt-1 font-semibold text-[var(--am-text-primary)]">
          {learningDimensionLabels[dna.currentRecommendation]}
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--am-text-secondary)]">
          {dna.recommendationReason}
        </p>

        {/* Confidence bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--am-text-muted)]">Confidence</span>
            <span className="font-semibold text-[var(--am-text-primary)]">{confidence}%</span>
          </div>
          <div className="am-progress-track mt-1">
            <div
              className={`h-full rounded-full transition-all duration-[var(--am-duration-slow)] ${confidenceBar(confidence)}`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        <p className="mt-2 text-xs leading-5 text-[var(--am-text-muted)]">
          {dna.evidenceSummary}
        </p>
      </div>

      {/* Preference vs Effectiveness toggle */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="mt-4 w-full rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-transparent px-4 py-2.5 text-xs font-semibold text-[var(--am-text-secondary)] transition-colors hover:bg-[var(--am-warm-bg)]"
        aria-expanded={showDetails}
      >
        {showDetails ? "Hide evidence details" : "Show evidence details"}
      </button>

      {showDetails && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-4 space-y-4"
        >
          {/* Stated preferences */}
          <div>
            <p className="am-label text-[var(--am-text-muted)] mb-2">
              Stated preferences (initial assessment)
            </p>
            <div className="space-y-2">
              {effectivenessRanking.map((dim) => (
                <motion.div key={dim} variants={staggerItem}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--am-text-secondary)]">
                      {learningDimensionLabels[dim]}
                    </span>
                    <span className="font-medium tabular-nums text-[var(--am-text-primary)]">
                      {dna.initialPreferences[dim]}%
                    </span>
                  </div>
                  <div className="am-progress-track mt-1">
                    <div
                      className="h-full rounded-full bg-[var(--am-primary)]/40"
                      style={{ width: `${dna.initialPreferences[dim]}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Observed effectiveness */}
          <div>
            <p className="am-label text-[var(--am-text-muted)] mb-2">
              Observed effectiveness (from lesson outcomes)
            </p>
            <div className="space-y-2">
              {effectivenessRanking.map((dim) => {
                const ev = dna.observedEffectiveness[dim];
                return (
                  <motion.div key={dim} variants={staggerItem}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[var(--am-text-secondary)]">
                        {learningDimensionLabels[dim]}
                        <span className="text-[var(--am-text-muted)]">
                          ({ev.evidenceCount} uses)
                        </span>
                      </span>
                      <span className="font-medium tabular-nums text-[var(--am-text-primary)]">
                        {ev.weightedEffectiveness}%
                      </span>
                    </div>
                    <div className="am-progress-track mt-1">
                      <div
                        className="h-full rounded-full bg-[var(--am-success)]"
                        style={{ width: `${Math.max(ev.weightedEffectiveness, 5)}%` }}
                      />
                    </div>
                    {ev.evidenceCount > 0 && (
                      <div className="mt-1 flex gap-3 text-[10px] text-[var(--am-text-muted)]">
                        <span>✓ {ev.successfulChecks}/{ev.totalChecks} checks</span>
                        {ev.hintRequests > 0 && <span>Hints: {ev.hintRequests}</span>}
                        {ev.retries > 0 && <span>Retries: {ev.retries}</span>}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <p className="border-t border-[var(--am-border-light)] pt-4 text-xs leading-5 text-[var(--am-text-muted)]">
            {totalEvidence === 0
              ? "No lesson data recorded yet. Complete lessons to build evidence."
              : `Based on ${totalEvidence} observations across ${Object.values(dna.observedEffectiveness).filter(e => e.evidenceCount > 0).length} approaches.`}
          </p>
        </motion.div>
      )}
    </motion.section>
  );
}
