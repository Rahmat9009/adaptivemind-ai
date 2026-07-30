"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const SLOW_NOTICE_MS = 20_000;

export function TutorLoadingState({
  hasSource = false,
  onCancel,
  onTryAgain,
}: {
  hasSource?: boolean;
  onCancel?: () => void;
  onTryAgain?: () => void;
}) {
  const [stage, setStage] = useState(0);
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    const understandingTimer = window.setTimeout(() => setStage(1), 1_200);
    const creatingTimer = window.setTimeout(() => setStage(2), 4_500);
    const slowTimer = window.setTimeout(
      () => setShowSlowNotice(true),
      SLOW_NOTICE_MS,
    );
    return () => {
      window.clearTimeout(understandingTimer);
      window.clearTimeout(creatingTimer);
      window.clearTimeout(slowTimer);
    };
  }, []);

  const stageLabel = [
    "Preparing your lesson…",
    hasSource ? "Understanding your request and source…" : "Understanding your request…",
    "Creating the explanation…",
  ][stage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="am-card p-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 animate-pulse rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, #1751EF, #0891B2, #7C3AED, #1751EF)",
          }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[var(--am-text-primary)]">{stageLabel}</p>
          <p className="mt-1 text-sm text-[var(--am-text-muted)]">
            {hasSource
              ? "Source and video tasks can take longer while Ada checks the material."
              : "Ada is preparing one concise response."}
          </p>
        </div>
        {onCancel && (
          <button type="button" className="am-btn am-btn-ghost text-xs" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <div className="mt-6 space-y-3" aria-hidden="true">
        <div className="h-3 animate-pulse rounded bg-[var(--am-border-light)]" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-[var(--am-border-light)]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--am-border-light)]" />
      </div>

      {showSlowNotice && (
        <div className="mt-6 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] p-4">
          <p className="text-sm text-[var(--am-text-secondary)]">
            Ada is taking longer than expected. You can keep waiting or try again.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="am-btn am-btn-secondary text-xs"
              onClick={() => setShowSlowNotice(false)}
            >
              Keep waiting
            </button>
            {onTryAgain && (
              <button type="button" className="am-btn am-btn-primary text-xs" onClick={onTryAgain}>
                Try again
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
