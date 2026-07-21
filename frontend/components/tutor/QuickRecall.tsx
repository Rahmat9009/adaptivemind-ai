"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn } from "@/lib/motion";

export type QuickRecallStatus =
  | "idle"
  | "asking"
  | "loading"
  | "result";

interface QuickRecallProps {
  /** Topic being recalled */
  topic: string;
  /** Status in dashboard */
  recallStatus: "due" | "completed" | "full-review-recommended" | "not-due";
  /** Whether recall is simulated */
  isSimulated?: boolean;
  /** The generated recall question */
  question?: string;
  /** Result of the recall */
  result?: {
    score: number;
    status: "correct" | "partial" | "incorrect";
    feedback: string;
  };
  /** Whether the result is being calculated */
  isLoading?: boolean;
  /** Handler for submitting an answer */
  onSubmit?: (answer: string) => void;
  /** Handler for retrying */
  onRetry?: () => void;
  /** Handler for starting a full review */
  onFullReview?: () => void;
}

function statusLabel(s: QuickRecallProps["recallStatus"]): {
  label: string;
  color: string;
} {
  switch (s) {
    case "due":
      return { label: "Quick recall due", color: "text-[var(--am-primary)]" };
    case "completed":
      return { label: "Recall completed", color: "text-[var(--am-success)]" };
    case "full-review-recommended":
      return {
        label: "Full review recommended",
        color: "text-[var(--am-warning)]",
      };
    case "not-due":
      return { label: "No review due", color: "text-[var(--am-text-muted)]" };
  }
}

export function QuickRecall({
  topic,
  recallStatus,
  isSimulated = false,
  question,
  result,
  isLoading = false,
  onSubmit,
  onRetry,
  onFullReview,
}: QuickRecallProps) {
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<QuickRecallStatus>(() =>
    recallStatus === "due" ? "idle" : recallStatus === "completed" ? "result" : "idle",
  );
  const badge = statusLabel(recallStatus);

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mt-4 rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] p-4 sm:p-5"
      role="region"
      aria-label="Quick recall"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-[var(--am-radius-md)] bg-[var(--am-primary)]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--am-primary)]">
            Quick recall
          </span>
          <span className={`text-xs font-medium ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        {isSimulated && (
          <span className="rounded-[var(--am-radius-md)] bg-[var(--am-warning-light)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--am-warning)]">
            Demo
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-[var(--am-text-secondary)]">
        <span className="font-medium text-[var(--am-text-primary)]">
          {topic}
        </span>{" "}
        {recallStatus === "due"
          ? "— It has been a little while since you covered this. A quick check helps with retention."
          : recallStatus === "completed"
            ? "— You recently reviewed this. Good job keeping it fresh."
            : recallStatus === "full-review-recommended"
              ? "— Quick recalls have not been enough. A full review may help reinforce this."
              : "— No review is scheduled yet."}
      </p>

      {/* Idle → Ask */}
      {recallStatus === "due" && phase === "idle" && (
        <button
          type="button"
          onClick={() => {
            setPhase("asking");
          }}
          className="am-btn am-btn-secondary mt-3 py-1.5 px-3 text-sm"
        >
          Start quick recall
        </button>
      )}

      {/* Asking phase */}
      {phase === "asking" && !result && (
        <div className="mt-3">
          {question ? (
            <p className="text-sm leading-6 text-[var(--am-text-secondary)]">
              {question}
            </p>
          ) : (
            <p className="text-sm leading-6 text-[var(--am-text-secondary)] italic">
              Loading question…
            </p>
          )}
          <div className="mt-3 flex items-start gap-2">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer…"
              className="min-h-[60px] flex-1 resize-none rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-2.5 text-sm leading-5 text-[var(--am-text-primary)] placeholder:text-[var(--am-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--am-primary)]/30"
              aria-label="Quick recall answer"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (answer.trim() && onSubmit) {
                  onSubmit(answer.trim());
                  setPhase("loading");
                }
              }}
              disabled={!answer.trim() || isLoading}
              className="rounded-[var(--am-radius-md)] bg-[var(--am-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isLoading ? "Checking…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase("idle");
                setAnswer("");
              }}
              className="text-xs font-medium text-[var(--am-text-muted)] hover:text-[var(--am-text-secondary)] transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Result phase */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3"
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                result.status === "correct"
                  ? "bg-[var(--am-success-light)] text-[var(--am-success)]"
                  : result.status === "partial"
                    ? "bg-[var(--am-warning-light)] text-[var(--am-warning)]"
                    : "bg-[var(--am-error-light)] text-[var(--am-error)]"
              }`}
              aria-hidden="true"
            >
              {result.status === "correct" ? "✓" : result.status === "partial" ? "○" : "✗"}
            </span>
            <span className="text-sm font-semibold text-[var(--am-text-primary)]">
              {result.status === "correct"
                ? "Recalled correctly"
                : result.status === "partial"
                  ? "Partially recalled"
                  : "Needs more practice"}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
            {result.feedback}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {recallStatus !== "full-review-recommended" && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-[var(--am-radius-md)] bg-[var(--am-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--am-text-secondary)] border border-[var(--am-border-light)] transition-colors hover:border-[var(--am-primary)]/30 hover:text-[var(--am-primary)]"
              >
                Try again
              </button>
            )}
            {(recallStatus === "full-review-recommended" || result.status === "incorrect") && onFullReview && (
              <button
                type="button"
                onClick={onFullReview}
                className="rounded-[var(--am-radius-md)] bg-[var(--am-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
              >
                Start full review
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Full review recommended */}
      {recallStatus === "full-review-recommended" && phase === "idle" && (
        <div className="mt-3">
          <p className="text-xs leading-5 text-[var(--am-warning)]">
            Quick recalls have not been enough to solidify this topic. A full lesson review is recommended.
          </p>
          {onFullReview && (
            <button
              type="button"
              onClick={onFullReview}
              className="am-btn am-btn-secondary mt-2 py-1.5 px-3 text-sm"
            >
              Start full review
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
