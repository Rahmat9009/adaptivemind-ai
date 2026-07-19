"use client";

import { useState } from "react";

interface UnderstandingCheckProps {
  question: string;
  isLoading: boolean;
  error: string | null;
  onSubmit: (answer: string) => Promise<void>;
}

export function UnderstandingCheck({
  question,
  isLoading,
  error,
  onSubmit,
}: UnderstandingCheckProps) {
  const [answer, setAnswer] = useState("");

  async function submit(value = answer) {
    if (!value.trim() || isLoading) return;
    await onSubmit(value.trim());
    setAnswer("");
  }

  return (
    <section
      className="mt-8 rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)]"
      aria-labelledby="understanding-title"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-primary)]/70">
        Check your understanding
      </p>
      <h2
        id="understanding-title"
        className="mt-2 text-lg font-semibold text-[var(--am-text-primary)]"
      >
        {question}
      </h2>

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
          disabled={!answer.trim() || isLoading}
          onClick={() => void submit()}
          className="am-btn am-btn-primary py-2.5 px-5 text-sm"
        >
          {isLoading ? "Checking..." : "Check my answer"}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void submit("I don't know yet.")}
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
    </section>
  );
}
