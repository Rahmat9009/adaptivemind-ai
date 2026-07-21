"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn } from "@/lib/motion";

interface PrivacySummaryProps {
  onReset: () => void;
  onExport: () => void;
  resetConfirm: boolean;
  onConfirmReset: () => void;
  onCancelReset: () => void;
}

export function PrivacySummary({
  onReset,
  onExport,
  resetConfirm,
  onConfirmReset,
  onCancelReset,
}: PrivacySummaryProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6 sm:p-7"
      aria-labelledby="privacy-title"
    >
      <button
        type="button"
        onClick={() => setShowPrivacy(!showPrivacy)}
        className="flex w-full items-center justify-between"
        aria-expanded={showPrivacy}
      >
        <h2 id="privacy-title" className="am-heading-serif text-lg text-[var(--am-text-primary)]">
          Privacy &amp; data
        </h2>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${showPrivacy ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {showPrivacy && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-4 border-t border-[var(--am-border-light)] pt-4"
        >
          <div className="space-y-3 text-sm leading-6 text-[var(--am-text-secondary)]">
            <h3 className="font-semibold text-[var(--am-text-primary)]">
              How AdaptiveMind handles your data
            </h3>

            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-[var(--am-text-primary)]">Local storage:</strong> Your Learning DNA data,
                lesson history, mastery, and study plans are stored in your browser
                using localStorage. No account is needed.
              </li>
              <li>
                <strong className="text-[var(--am-text-primary)]">AI lessons:</strong> When you request a lesson,
                the topic and your Learning DNA data are sent to the
                configured AI provider. Lesson content is not permanently stored by
                the provider.
              </li>
              <li>
                <strong className="text-[var(--am-text-primary)]">No cloud profile:</strong> This version does not
                create a cloud learner profile, use analytics services, or share
                your data with third parties.
              </li>
              <li>
                <strong className="var(--am-text-primary)]">Reset:</strong> You can export or delete all stored
                data at any time.
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-[var(--am-border-light)] pt-4">
            <button
              type="button"
              onClick={onExport}
              className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-4 py-2 text-xs font-semibold text-[var(--am-text-secondary)] transition-colors hover:border-[var(--am-primary)]/30 hover:text-[var(--am-primary)]"
            >
              Export learning profile
            </button>

            {resetConfirm ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onConfirmReset}
                  className="rounded-[var(--am-radius-md)] bg-[var(--am-error)] px-4 py-2 text-xs font-semibold text-white"
                >
                  Confirm reset
                </button>
                <button
                  type="button"
                  onClick={onCancelReset}
                  className="text-xs font-medium text-[var(--am-text-muted)] hover:text-[var(--am-text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onReset}
                className="rounded-[var(--am-radius-md)] border border-[var(--am-error)]/30 bg-transparent px-4 py-2 text-xs font-semibold text-[var(--am-error)] transition-colors hover:bg-[var(--am-error-light)]"
              >
                Reset all learning data
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
