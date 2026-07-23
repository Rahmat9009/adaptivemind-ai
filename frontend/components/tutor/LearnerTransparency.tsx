"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import {
  loadLearningDNA2,
  type LearningDNA2,
  type ApproachEvidence,
} from "@/lib/learning-dna-v2";
import {
  getTopicMastery,
  type TopicMastery,
} from "@/lib/mastery";
import type { LearningDimension } from "@/lib/learning-dna";

const TRANSPARENCY_KEY = "adaptivemind-transparency-mode";

const MODE_LABELS: Record<string, string> = {
  visual: "Visual",
  examples: "Examples",
  analogies: "Analogies",
  stories: "Stories",
  challenges: "Challenges",
};

function masteryLabel(level: string): { label: string; color: string } {
  switch (level) {
    case "mastered":
      return { label: "Mastered", color: "text-[var(--am-success)]" };
    case "applied":
      return { label: "Applied", color: "text-[var(--am-success)]" };
    case "understood":
      return { label: "Understood", color: "text-[var(--am-primary)]" };
    case "developing":
      return { label: "Developing", color: "text-[var(--am-warning)]" };
    case "exploring":
      return { label: "Exploring", color: "text-[var(--am-warning)]" };
    case "needs-review":
      return { label: "Needs review", color: "text-[var(--am-error)]" };
    default:
      return { label: "New", color: "text-[var(--am-text-muted)]" };
  }
}

export function LearnerTransparency({
  topic,
}: {
  topic: string;
}) {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(TRANSPARENCY_KEY) === "true"; } catch { return false; }
  });
  const [expanded, setExpanded] = useState(false);
  const [dna, setDna] = useState<LearningDNA2 | null>(null);
  const [mastery, setMastery] = useState<TopicMastery[]>([]);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(TRANSPARENCY_KEY, next ? "true" : "false");
    } catch { /* */ }
    // Load or clear data on toggle
    if (next) {
      try { setDna(loadLearningDNA2()); } catch { /* */ }
      try { setMastery(getTopicMastery()); } catch { /* */ }
    } else {
      setDna(null);
      setMastery([]);
    }
  }

  // Current topic mastery
  const currentMastery = mastery.find(
    (m) => m.topic.toLowerCase() === topic.toLowerCase(),
  );

  const totalEvidence = dna
    ? (Object.values(dna.observedEffectiveness) as ApproachEvidence[]).reduce(
        (sum, ev) => sum + ev.evidenceCount,
        0,
      )
    : 0;

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)]"
      role="region"
      aria-label="Learning transparency"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
        aria-expanded={expanded}
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
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-xs font-semibold text-[var(--am-text-primary)]">
            Learning model
          </span>
        </span>
        <span
          className={`text-[10px] font-medium ${
            enabled ? "text-[var(--am-success)]" : "text-[var(--am-text-muted)]"
          }`}
        >
          {enabled ? "On" : "Off"}
        </span>
      </button>

      {expanded && (
        <motion.div
          variants={slideUp}
          className="border-t border-[var(--am-border-light)] p-3 pt-3"
        >
          {/* Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors">
              <input
                type="checkbox"
                checked={enabled}
                onChange={toggle}
                className="sr-only peer"
                aria-label="Show detailed learning model"
              />
              <span className="h-4 w-4 rounded-full bg-[var(--am-surface)] border border-[var(--am-border-light)] transition-all peer-checked:translate-x-4 peer-checked:bg-[var(--am-primary)] peer-checked:border-[var(--am-primary)]" />
            </span>
            <span className="text-xs text-[var(--am-text-secondary)]">
              Show detailed learning model
            </span>
          </label>

          <p className="mt-2 text-[11px] leading-5 text-[var(--am-text-muted)]">
            When enabled, you can see how AdaptiveMind estimates your progress
            and which approaches it has evidence for.
          </p>

          {enabled && dna && (
            <div className="mt-3 space-y-3">
              {/* Current topic mastery */}
              {currentMastery && (
                <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-3">
                  <p className="text-[11px] font-medium text-[var(--am-text-muted)]">
                    Current topic
                  </p>
                  <p className="text-sm font-semibold text-[var(--am-text-primary)]">
                    {currentMastery.topic}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-[11px]">
                    <span className={masteryLabel(currentMastery.masteryLevel).color}>
                      {masteryLabel(currentMastery.masteryLevel).label}
                    </span>
                    <span className="text-[var(--am-text-muted)]">
                      {currentMastery.attempts} attempt{currentMastery.attempts !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[var(--am-text-muted)]">
                      Estimated mastery: {currentMastery.masteryPercent}%
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[var(--am-text-muted)]">
                    This is an approximate model based on{" "}
                    {currentMastery.evidenceCount} meaningful check
                    {currentMastery.evidenceCount === 1 ? "" : "s"}.
                  </p>
                </div>
              )}

              {/* Evidence count */}
              <div className="flex items-center gap-3 text-[11px] text-[var(--am-text-muted)]">
                <span>
                  Total observations: {totalEvidence}
                </span>
                <span>
                  Confidence: {dna.recommendationConfidence}%
                </span>
              </div>

              {/* Per-approach effectiveness */}
              <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-3">
                <p className="text-[11px] font-medium text-[var(--am-text-muted)] mb-2">
                  Approach evidence
                </p>
                {(Object.keys(dna.observedEffectiveness) as LearningDimension[]).map(
                  (dim) => {
                    const ev = dna.observedEffectiveness[dim];
                    return (
                      <div
                        key={dim}
                        className="flex items-center justify-between gap-2 py-1 text-[11px]"
                      >
                        <span className="text-[var(--am-text-secondary)]">
                          {MODE_LABELS[dim] ?? dim}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-[var(--am-text-muted)]">
                            {ev.evidenceCount} check{ev.evidenceCount !== 1 ? "s" : ""}
                          </span>
                          <span
                            className={
                              ev.evidenceCount > 0
                                ? ev.weightedEffectiveness >= 60
                                  ? "text-[var(--am-success)]"
                                  : ev.weightedEffectiveness >= 40
                                    ? "text-[var(--am-warning)]"
                                    : "text-[var(--am-text-muted)]"
                                : "text-[var(--am-text-muted)]"
                            }
                          >
                            {ev.evidenceCount > 0
                              ? `${ev.weightedEffectiveness}%`
                              : "—"}
                          </span>
                        </span>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] leading-4 text-[var(--am-text-muted)]">
                These are estimates based on limited evidence. They improve as
                you complete more lessons.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
