"use client";

import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import {
  classifyCalibration,
  generateConfidenceFeedback,
  type CalibrationSummary,
} from "@/lib/confidence-calibration";

interface CoachingCase {
  /** Coaching message category */
  case: "high-high" | "low-high" | "high-low" | "low-low";
  /** Supportive message title */
  title: string;
  /** Detail message */
  message: string;
  /** Actionable next step */
  nextStep: string;
}

function classifyCoachingCase(
  confidence: number | null,
  score: number,
): CoachingCase {
  const conf = confidence ?? 50;
  if (conf >= 60 && score >= 60) {
    return {
      case: "high-high",
      title: "Confidence matches your results",
      message: "You were confident and your explanation supported that confidence.",
      nextStep: "This material is solid. Consider moving to the next topic or trying a related challenge.",
    };
  }
  if (conf < 60 && score >= 60) {
    return {
      case: "low-high",
      title: "You understood more than expected",
      message: "You understood this better than you expected. That is a sign of progress.",
      nextStep: "Building awareness of what you know is part of the learning process. Try the next topic when you are ready.",
    };
  }
  if (conf >= 60 && score < 60) {
    return {
      case: "high-low",
      title: "A helpful checkpoint",
      message: "You felt confident, but one important idea still needs another look.",
      nextStep: "Review the key points above, then try again or explore a different approach.",
    };
  }
  // low-low
  return {
    case: "low-low",
    title: "Still building understanding",
    message: "This topic is still developing. Let us reduce the difficulty and rebuild it step by step.",
    nextStep: "Try a simpler explanation or a worked example to strengthen the foundation.",
  };
}

export function ConfidenceCoaching({
  confidence,
  score,
  calibrationRecords,
}: {
  /** Self-reported confidence before check (0–100, null if not reported) */
  confidence: number | null;
  /** Evaluation score (0–100) */
  score: number;
  /** Calibration records for broader context */
  calibrationRecords: { selfReported: number; actualScore: number }[];
  /** Evaluation status */
  status: string;
}) {
  const coaching = classifyCoachingCase(confidence, score);
  const calibration: CalibrationSummary | null =
    calibrationRecords.length >= 2
      ? classifyCalibration(
          calibrationRecords.map((r) => ({
            selfReported: r.selfReported,
            actualScore: r.actualScore,
            timestamp: new Date().toISOString(),
            skillId: "current",
            approach: "current",
          })),
        )
      : null;

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mt-4 rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-4 sm:p-5"
      role="status"
      aria-live="polite"
      aria-label="Confidence feedback"
    >
      <motion.div variants={slideUp}>
        <div className="flex items-center gap-2">
          {/* Coaching case icon */}
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              score >= 60
                ? "bg-[var(--am-success-light)] text-[var(--am-success)]"
                : "bg-[var(--am-warning-light)] text-[var(--am-warning)]"
            }`}
            aria-hidden="true"
          >
            {score >= 60 ? "✓" : "○"}
          </span>
          <h3 className="text-sm font-semibold text-[var(--am-text-primary)]">
            {coaching.title}
          </h3>
        </div>

        <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
          {coaching.message}
        </p>

        {confidence !== null && (
          <div className="mt-3 flex items-center gap-4 text-xs text-[var(--am-text-muted)]">
            <span>
              Confidence:{" "}
              <strong
                className={
                  score >= 60
                    ? confidence >= 60
                      ? "text-[var(--am-success)]"
                      : "text-[var(--am-warning)]"
                    : confidence >= 60
                      ? "text-[var(--am-warning)]"
                      : "text-[var(--am-text-secondary)]"
                }
              >
                {confidence}%
              </strong>
            </span>
            <span>
              Result: <strong className="text-[var(--am-text-secondary)]">{score}%</strong>
            </span>
          </div>
        )}

        {/* Actionable next step */}
        <p className="mt-2 text-xs leading-5 text-[var(--am-primary)]">
          {coaching.nextStep}
        </p>

        {/* Calibration insight (only when enough data) */}
        {calibration && calibration.recordCount >= 3 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-[var(--am-text-muted)] hover:text-[var(--am-text-secondary)]">
              Confidence pattern
            </summary>
            <p className="mt-2 text-xs leading-5 text-[var(--am-text-muted)]">
              {generateConfidenceFeedback(calibration)}
            </p>
          </details>
        )}
      </motion.div>
    </motion.section>
  );
}
