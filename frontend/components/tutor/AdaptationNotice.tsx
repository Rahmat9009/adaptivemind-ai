"use client";

import { motion } from "motion/react";
import { fadeIn } from "@/lib/motion";
import { Button } from "@/components/base/buttons/button";
import type { LearningDimension } from "@/lib/learning-dna";
import { approachLabel } from "@/lib/struggle-adaptation";

interface AdaptationNoticeProps {
  from: LearningDimension;
  to: LearningDimension;
  /** One learner-facing sentence naming the evidence. */
  explanation: string;
  isLoading: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

/**
 * A calm, inline proposal to change teaching approach.
 *
 * Deliberately not a modal and not a dashboard: it sits above the lesson,
 * states what it noticed, and offers exactly two choices. The lesson stays
 * on screen and readable behind it.
 */
export function AdaptationNotice({
  from,
  to,
  explanation,
  isLoading,
  onAccept,
  onDismiss,
}: AdaptationNoticeProps) {
  const fromLabel = approachLabel(from);
  const toLabel = approachLabel(to);

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mt-4 rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] p-4"
      role="region"
      aria-label="Suggested teaching change"
    >
      <div className="flex items-start gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-1 shrink-0 text-[var(--am-primary)]"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--am-text-strong)]">
            Ada noticed this approach isn&rsquo;t clicking yet.
          </p>

          {/* Approach change. Text carries the meaning; the arrow is decorative. */}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--am-text-muted)]">
            <span>
              Current approach:{" "}
              <span className="font-medium text-[var(--am-text-strong)]">
                {fromLabel}
              </span>
            </span>
            <span aria-hidden="true">&rarr;</span>
            <span>
              Suggested:{" "}
              <span className="font-medium text-[var(--am-text-strong)]">
                {toLabel}
              </span>
            </span>
          </p>

          <p className="mt-2 text-sm text-[var(--am-text-muted)]">{explanation}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/*
              min-h-11 (44px) keeps both actions comfortable touch targets on
              mobile. Scoped to this notice rather than the shared Button, so
              no other control's sizing changes.
            */}
            <Button
              type="button"
              color="primary"
              size="sm"
              isDisabled={isLoading}
              onClick={onAccept}
              className="min-h-11"
            >
              {`Reteach with ${toLabel}`}
            </Button>
            <Button
              type="button"
              color="link-gray"
              size="sm"
              isDisabled={isLoading}
              onClick={onDismiss}
              className="min-h-11 px-3"
            >
              Keep current approach
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
