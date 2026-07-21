"use client";

import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import { useState } from "react";

export type ExplainBackState = "prompt" | "writing" | "submitted" | "feedback" | "retry";

interface ExplainBackProps {
  topic: string;
  sentenceStarters?: string[];
  onSubmit: (response: string) => void;
  onRetry: () => void;
  onNext: () => void;
  state: ExplainBackState;
  feedback?: ExplainBackFeedback | null;
  isLoading: boolean;
  error?: string | null;
}

export interface ExplainBackFeedback {
  understood: string[];
  missing: string[];
  misconception?: string;
  followUpQuestion?: string;
  isComplete: boolean;
}

const DEFAULT_STARTERS = [
  "The main idea is…",
  "This works because…",
  "An example would be…",
  "The part I am least certain about is…",
];

export function ExplainBack({
  topic,
  sentenceStarters = DEFAULT_STARTERS,
  onSubmit,
  onRetry,
  onNext,
  state,
  feedback,
  isLoading,
  error,
}: ExplainBackProps) {
  const [response, setResponse] = useState("");
  const [activeStarter, setActiveStarter] = useState<string | null>(null);

  function handleSubmit() {
    if (!response.trim()) return;
    const fullResponse = activeStarter
      ? `${activeStarter} ${response}`
      : response;
    onSubmit(fullResponse);
  }

  function handleStarterClick(starter: string) {
    setActiveStarter(starter);
    setResponse("");
  }

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card mt-8 p-6 sm:p-8"
      aria-labelledby="explain-back-title"
    >
      {/* Prompt state */}
      {(state === "prompt" || state === "writing") && !isLoading && (
        <>
          <div className="mb-1 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-[var(--am-radius-md)] bg-[var(--am-primary-light)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--am-primary)]"
            >
              Explain back
            </span>
            <span className="text-xs text-[var(--am-text-muted)]">Test your understanding</span>
          </div>

          <h3
            id="explain-back-title"
            className="am-heading-serif mt-3 text-xl text-[var(--am-text-primary)]"
          >
            Explain in your own words
          </h3>

          <motion.p variants={slideUp} className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
            Describe how <strong className="font-semibold text-[var(--am-text-primary)]">{topic}</strong> works. Using your
            own words helps strengthen what you have learned.
          </motion.p>

          {/* Sentence starters */}
          <motion.div variants={slideUp} className="mt-4 flex flex-wrap gap-2">
            {sentenceStarters.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => handleStarterClick(starter)}
                className={`rounded-[var(--am-radius-full)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeStarter === starter
                    ? "border-[var(--am-primary)] bg-[var(--am-primary-light)] text-[var(--am-primary)]"
                    : "border-[var(--am-border-light)] bg-transparent text-[var(--am-text-secondary)] hover:border-[var(--am-primary)]/30 hover:text-[var(--am-primary)]"
                }`}
              >
                {starter}
              </button>
            ))}
          </motion.div>

          {activeStarter && (
            <p className="mt-2 text-xs leading-5 text-[var(--am-text-muted)]">
              Start with: <span className="font-medium text-[var(--am-text-secondary)]">{activeStarter}</span>
            </p>
          )}

          {/* Response field */}
          <div className="mt-4">
            <label htmlFor="explain-back-response" className="sr-only">
              Your explanation
            </label>
            <textarea
              id="explain-back-response"
              value={response}
              onChange={(e) => setResponse(e.target.value.slice(0, 1000))}
              placeholder={
                activeStarter
                  ? "Continue from the sentence starter above…"
                  : "Write your explanation here…"
              }
              rows={4}
              className="w-full resize-none rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3 text-sm text-[var(--am-text-primary)] outline-none transition placeholder:text-[var(--am-text-muted)] focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              aria-describedby={activeStarter ? "active-starter-hint" : undefined}
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-[var(--am-text-muted)]">
                {response.length}/1000
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!response.trim() || isLoading}
              className="am-btn am-btn-primary text-sm"
            >
              {isLoading ? "Evaluating…" : "Submit explanation"}
            </button>
          </div>
        </>
      )}

      {/* Loading state */}
      {isLoading && (
        <div role="status" className="py-8 text-center">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-[var(--am-primary)]/20" />
          <p className="mt-3 text-sm text-[var(--am-text-secondary)]">
            Ada is reviewing your explanation…
          </p>
          <span className="sr-only">Evaluating understanding</span>
        </div>
      )}

      {/* Feedback state */}
      {state === "feedback" && feedback && !isLoading && (
        <>
          <div className="mb-1 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-[var(--am-radius-md)] bg-[var(--am-primary-light)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--am-primary)]"
            >
              Feedback
            </span>
          </div>

          <h3
            id="explain-back-title"
            className="am-heading-serif mt-3 text-xl text-[var(--am-text-primary)]"
          >
            Your explanation
          </h3>

          {feedback.understood.length > 0 && (
            <div className="mt-4">
              <p className="am-label text-[var(--am-success)] mb-2">What you captured</p>
              <ul className="space-y-1">
                {feedback.understood.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--am-text-secondary)]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--am-success)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.missing.length > 0 && (
            <div className="mt-4">
              <p className="am-label text-[var(--am-earth-accent)] mb-2">
                Consider adding
              </p>
              <ul className="space-y-1">
                {feedback.missing.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--am-text-secondary)]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--am-earth-accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.misconception && (
            <div className="mt-4 rounded-[var(--am-radius-lg)] border border-[var(--am-warning)]/20 bg-[var(--am-warning-light)] p-4">
              <p className="text-sm font-medium text-[var(--am-warning)]">
                Misconception to revisit
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
                {feedback.misconception}
              </p>
            </div>
          )}

          {feedback.followUpQuestion && (
            <div className="mt-4">
              <p className="text-sm font-medium text-[var(--am-text-primary)]">
                Follow-up question
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
                {feedback.followUpQuestion}
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm font-medium text-[var(--am-error)]" role="alert">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!feedback.isComplete && (
              <button
                type="button"
                onClick={onRetry}
                className="am-btn am-btn-outline text-sm"
              >
                Revise and resubmit
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="am-btn am-btn-primary text-sm"
            >
              {feedback.isComplete ? "Continue" : "Try a different approach"}
            </button>
          </div>
        </>
      )}
    </motion.section>
  );
}
