"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import { ConfidenceSelector } from "./ConfidenceSelector";
import {
  confidenceLevelFromNumber,
  confidenceLevelToNumber,
} from "@/lib/confidence-calibration";

interface UnderstandingCheckProps {
  question: string;
  isLoading: boolean;
  error: string | null;
  confidence: number | null;
  onConfidenceChange: (confidence: number) => void;
  onSubmit: (answer: string, confidence: number) => Promise<void>;
}

export function UnderstandingCheck({
  question,
  isLoading,
  error,
  confidence,
  onConfidenceChange,
  onSubmit,
}: UnderstandingCheckProps) {
  const [answer, setAnswer] = useState("");

  async function submit(value = answer) {
    if (!value.trim() || isLoading || confidence === null) return;
    await onSubmit(value.trim(), confidence);
    setAnswer("");
  }

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mt-8 am-card p-6"
      aria-labelledby="understanding-title"
    >
      <motion.div variants={slideUp}>
        <p className="am-label text-[var(--am-primary)]/70">
          Check your understanding
        </p>
        <h2
          id="understanding-title"
          className="am-heading-serif mt-2 text-lg text-[var(--am-text-primary)]"
        >
          {question}
        </h2>
      </motion.div>

      <motion.div variants={slideUp}>
        <ConfidenceSelector
          label="answer this check without looking back"
          value={
            confidence === null
              ? null
              : confidenceLevelFromNumber(confidence)
          }
          onChange={(level) =>
            onConfidenceChange(confidenceLevelToNumber(level))
          }
          timing="before"
        />

        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          maxLength={1000}
          rows={3}
          placeholder="Write your answer in your own words..."
          disabled={isLoading}
          className="mt-4 w-full rounded-[var(--am-radius-lg)] border border-[var(--am-border)] bg-[var(--am-bg-reading)] px-4 py-3 text-sm text-[var(--am-text-primary)] outline-none transition placeholder:text-[var(--am-text-muted)] focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15 disabled:opacity-50"
        />

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!answer.trim() || isLoading || confidence === null}
            onClick={() => void submit()}
            className="am-btn am-btn-primary py-2.5 px-5 text-sm"
          >
            {isLoading ? "Checking..." : "Check my answer"}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              if (confidence === null) onConfidenceChange(25);
              void onSubmit("I don't know yet.", confidence ?? 25);
              setAnswer("");
            }}
            className="rounded-full border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--am-text-secondary)] transition-colors hover:border-[var(--am-text-muted)] disabled:opacity-40"
          >
            I&apos;m not sure
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm font-medium text-[var(--am-error)]" role="alert">
            {error}
          </p>
        )}
      </motion.div>
    </motion.section>
  );
}
