"use client";

import { motion } from "motion/react";
import { fadeIn } from "@/lib/motion";
import type { ConfidenceLevel } from "@/lib/confidence-calibration";

interface ConfidenceSelectorProps {
  /** The aspect being rated */
  label: string;
  /** Currently selected level */
  value: ConfidenceLevel | null;
  /** Called when the learner selects a level */
  onChange: (level: ConfidenceLevel) => void;
  /** Timing: before or after an activity */
  timing: "before" | "after";
}

const LEVELS: Array<{ value: ConfidenceLevel; label: string }> = [
  { value: "low", label: "Low" },
  { value: "somewhat", label: "Somewhat confident" },
  { value: "confident", label: "Confident" },
  { value: "very", label: "Very confident" },
];

export function ConfidenceSelector({
  label,
  value,
  onChange,
  timing,
}: ConfidenceSelectorProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mt-5"
    >
      <p className="text-sm font-medium text-[var(--am-text-primary)]">
        {timing === "before"
          ? `How confident are you that you can ${label}?`
          : `How confident do you feel about ${label} now?`}
      </p>

      <div
        className="mt-3 flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Confidence level"
      >
        {LEVELS.map((level) => {
          const isSelected = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(level.value)}
              className={`rounded-[var(--am-radius-full)] border px-4 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? "border-[var(--am-primary)] bg-[var(--am-primary-light)] text-[var(--am-primary)] shadow-sm"
                  : "border-[var(--am-border-light)] bg-[var(--am-surface)] text-[var(--am-text-secondary)] hover:border-[var(--am-primary)]/30 hover:text-[var(--am-primary)]"
              }`}
            >
              {level.label}
            </button>
          );
        })}
      </div>

      {/* Hints for self-assessment (not shaming) */}
      {value === "very" && timing === "before" && (
        <p className="mt-2 text-xs leading-5 text-[var(--am-text-muted)]">
          Great — try answering without hints to confirm your confidence is accurate.
        </p>
      )}
      {value === "low" && timing === "before" && (
        <p className="mt-2 text-xs leading-5 text-[var(--am-text-muted)]">
          That is a fair self-assessment. The check will identify what to focus on.
        </p>
      )}
      {/* After-check feedback */}
      {value && timing === "after" && value === "confident" && (
        <p className="mt-2 text-xs leading-5 text-[var(--am-text-muted)]">
          Noticing steady confidence is a sign that the material is coming together.
        </p>
      )}
    </motion.div>
  );
}
