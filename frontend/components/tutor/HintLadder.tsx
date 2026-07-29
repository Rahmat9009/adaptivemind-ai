"use client";

import { motion } from "motion/react";
import { fadeIn } from "@/lib/motion";
import { useState } from "react";
import {
  isMeaningfulAttempt,
  nextHintLevel,
} from "@/lib/productive-struggle";

export type HintLevel = 0 | 1 | 2 | 3 | 4;

interface HintLadderProps {
  /** Hints in increasing levels of detail */
  hints: [string, string, string, string] | null; // nudge, direction, scaffold, full
  /** Which hint level is currently revealed (0 = none) */
  currentLevel: HintLevel;
  /** Called when the learner requests the next hint */
  onRequestHint: (level: HintLevel) => void;
  /** Called when the learner asks for the full solution */
  onRequestFullSolution?: () => void;
  /** Whether the full solution has been revealed */
  fullSolutionRevealed?: boolean;
  /** Whether hints are currently loading */
  isLoading: boolean;
  /** Loading/saving is disabled (e.g. for demo mode) */
  disabled?: boolean;
  /** Type of gate: "attempt" requires an attempt first, "struggle" appears at level 3 */
  gateType?: "none" | "attempt" | "struggle";
  /** Whether the learner has made a meaningful attempt */
  hasAttempted?: boolean;
  /** Called when the learner provides an attempt (triggers gate unlock) */
  onAttempt?: (attempt: string) => void;
  /** The attempt gate prompt (challenge question) */
  attemptPrompt?: string;
  /** Time in seconds before the first hint request (for tracking) */
  timeBeforeFirstHint?: number;
  /** Whether the learner eventually succeeded independently */
  succeededIndependently?: boolean;
  /** Challenge type indicator */
  isChallenge?: boolean;
  error?: string | null;
}

const HINT_LABELS: Record<number, string> = {
  1: "Nudge",
  2: "Direction",
  3: "Partial scaffold",
  4: "Full explanation",
};

export function HintLadder({
  hints,
  currentLevel,
  onRequestHint,
  onRequestFullSolution,
  fullSolutionRevealed,
  isLoading,
  disabled = false,
  gateType = "attempt",
  hasAttempted = false,
  onAttempt,
  attemptPrompt,
  timeBeforeFirstHint,
  isChallenge = false,
  error,
}: HintLadderProps) {
  const [struggleDismissed, setStruggleDismissed] = useState(false);
  const [showStruggleGate, setShowStruggleGate] = useState(!fullSolutionRevealed);
  const [attemptInput, setAttemptInput] = useState("");
  const [attemptSubmitted, setAttemptSubmitted] = useState(false);
  const gateUnlocked = hasAttempted || attemptSubmitted;

  function handleRequestNext() {
    const next = nextHintLevel(currentLevel);
    onRequestHint(next);
  }

  function handleSubmitAttempt() {
    if (!isMeaningfulAttempt(attemptInput) || !onAttempt) return;
    onAttempt(attemptInput.trim());
    setAttemptSubmitted(true);
  }

  const hasMoreHints = currentLevel < 4;
  const isGateActive = gateType === "attempt" && !gateUnlocked && isChallenge;
  const isFullSolutionGateActive =
    currentLevel >= 3
    && !fullSolutionRevealed
    && !struggleDismissed
    && showStruggleGate;

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mt-6 rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] p-5 sm:p-6"
      role="region"
      aria-label="Hints"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-[var(--am-radius-md)] bg-[var(--am-earth-dark)]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--am-earth-dark)]">
            Hint ladder
          </span>
          <span className="text-xs text-[var(--am-text-muted)]">
            {currentLevel > 0
              ? `Level ${currentLevel}/4 — ${HINT_LABELS[currentLevel]}`
              : "Request a hint when stuck"}
          </span>
        </div>

        {/* Hint request button — hidden behind gate */}
        {!isGateActive && !isFullSolutionGateActive && (
          <button
            type="button"
            onClick={handleRequestNext}
            disabled={!hasMoreHints || isLoading || disabled}
            className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--am-primary)] transition-colors hover:bg-[var(--am-primary-light)] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={
              currentLevel === 0
                ? "Get a hint"
                : `Get hint level ${currentLevel + 1}`
            }
          >
            {isLoading
              ? "Loading…"
              : currentLevel === 0
                ? "I need a hint"
                : "Show next hint"}
          </button>
        )}
      </div>

      {/* ── ATTEMPT GATE ── */}
      {isGateActive && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-[var(--am-radius-lg)] border border-[var(--am-earth-accent)]/20 bg-[var(--am-earth-light)] p-4"
        >
          <p className="text-sm font-medium text-[var(--am-earth-dark)]">
            {isChallenge ? "Give the challenge a try first" : "Try it first"}
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
            {isChallenge
              ? "Your attempt helps Ada understand where the difficulty is. Even a partial answer builds stronger understanding."
              : "Give it a try first. Your attempt helps Ada understand where the difficulty is."}
          </p>
          {attemptPrompt && (
            <div className="mt-3 rounded-[var(--am-radius-md)] bg-[var(--am-surface)] p-3 text-sm leading-6 text-[var(--am-text-secondary)]">
              {attemptPrompt}
            </div>
          )}
          <div className="mt-3 flex items-start gap-2">
            <textarea
              value={attemptInput}
              onChange={(e) => setAttemptInput(e.target.value)}
              placeholder={isChallenge ? "Type your answer here…" : "Write your initial thoughts…"}
              className="min-h-[60px] flex-1 resize-none rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-2.5 text-sm leading-5 text-[var(--am-text-primary)] placeholder:text-[var(--am-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--am-primary)]/30"
              aria-label="Your attempt"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmitAttempt}
              disabled={!isMeaningfulAttempt(attemptInput)}
              className="rounded-[var(--am-radius-md)] bg-[var(--am-earth-dark)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Submit attempt
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Post-submission success message ── */}
      {!isGateActive && attemptSubmitted && currentLevel === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-sm text-[var(--am-success)]"
        >
          Attempt recorded. You can now access hints.
        </motion.div>
      )}

      {/* Hint content */}
      {currentLevel > 0 && hints && (
        <div className="mt-4 space-y-3">
          {Array.from({ length: currentLevel }, (_, i) => {
            const level = (i + 1) as HintLevel;
            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-3"
              >
                <p className="am-label text-[var(--am-earth-accent)] text-[10px]">
                  {HINT_LABELS[level]}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
                  {hints[i]}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full solution */}
      {fullSolutionRevealed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-[var(--am-radius-lg)] border border-[var(--am-warning)]/20 bg-[var(--am-warning-light)] p-3"
        >
          <p className="am-label text-[var(--am-warning)] text-[10px]">
            Full solution shown
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
            That is okay — seeing the complete answer can help you understand the
            structure. Try solving a similar problem on your own afterward.
          </p>
        </motion.div>
      )}

      {/* Time tracking indicator (subtle, non-punitive) */}
      {!isGateActive && currentLevel === 0 && timeBeforeFirstHint === undefined && (
        <p className="mt-3 text-[11px] text-[var(--am-text-muted)]">
          {isChallenge
            ? "Take your time — working through a challenge builds lasting understanding."
            : "No rush — thinking through a problem is part of learning."}
        </p>
      )}

      {/* Productive struggle gate (at level 3) */}
      {isFullSolutionGateActive && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-[var(--am-radius-lg)] border border-[var(--am-earth-accent)]/20 bg-[var(--am-earth-light)] p-4"
        >
          <p className="text-sm font-medium text-[var(--am-earth-dark)]">
            Before revealing the full solution
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
            Try one more time with the partial scaffold above. Working through the
            last step yourself builds stronger understanding.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStruggleDismissed(true);
                setShowStruggleGate(false);
              }}
              className="text-sm font-semibold text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)] transition-colors"
            >
              I will try again
            </button>
            <button
              type="button"
              onClick={() => {
                if (onRequestFullSolution) onRequestFullSolution();
                else onRequestHint(4);
                setShowStruggleGate(false);
              }}
              className="rounded-[var(--am-radius-md)] border border-[var(--am-border)] bg-[var(--am-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--am-text-secondary)] hover:border-[var(--am-earth-accent)] hover:text-[var(--am-earth-accent)] transition-colors"
            >
              Show full solution
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <p className="mt-3 text-sm text-[var(--am-error)]" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
