"use client";
import { useState } from "react";

export function UnderstandingCheck({
  question,
  isLoading,
  error,
  onSubmit,
}: {
  question: string;
  isLoading: boolean;
  error: string | null;
  onSubmit: (answer: string) => Promise<void>;
}) {
  const [answer, setAnswer] = useState("");
  async function submit(value = answer) {
    if (!value.trim() || isLoading) return;
    await onSubmit(value.trim());
    setAnswer("");
  }
  return (
    <section
      className="mt-6 rounded-[2rem] p-6"
      aria-labelledby="understanding-title"
      style={{
        background: "linear-gradient(160deg, rgba(167,139,250,0.08), var(--color-paper-50) 70%)",
        border: "1px solid rgba(167,139,250,0.25)",
      }}
    >
      <p className="eyebrow-num text-dna-analogies">Check your understanding</p>
      <h2 id="understanding-title" className="font-display mt-2 text-xl text-ink-950">{question}</h2>
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }}
        maxLength={1000}
        rows={3}
        placeholder="Write your answer in your own words…"
        className="mt-4 w-full rounded-xl border border-dna-analogies/30 bg-paper-50 px-3 py-3 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-dna-analogies/20"
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!answer.trim() || isLoading}
          onClick={() => void submit()}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-paper-50 disabled:opacity-50"
          style={{ background: "var(--color-dna-analogies)" }}
        >
          {isLoading ? "Checking…" : "Check my answer"}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void submit("I don't know yet.")}
          className="rounded-lg border border-dna-analogies/30 bg-paper-50 px-4 py-2.5 text-sm font-semibold text-ink-800"
        >
          I&apos;m not sure
        </button>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
