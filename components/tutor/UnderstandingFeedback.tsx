import type { UnderstandingEvaluation } from "@/lib/ai/types";

const labels: Record<UnderstandingEvaluation["status"], string> = {
  correct: "Strong understanding",
  partial: "Almost there",
  misconception: "Let's clarify one part",
  uncertain: "A useful pause",
};

const statusColor: Record<UnderstandingEvaluation["status"], string> = {
  correct: "var(--color-dna-visual)",
  partial: "var(--color-dna-examples)",
  misconception: "var(--color-dna-challenges)",
  uncertain: "var(--color-dna-analogies)",
};

const actionLabel: Record<UnderstandingEvaluation["nextStep"], string> = {
  continue: "Continue",
  clarify: "Clarify this part",
  simplify: "Make it simpler",
  example: "Show me an example",
  retry: "Try again",
};

export function UnderstandingFeedback({
  evaluation,
  source,
  onAction,
}: {
  evaluation: UnderstandingEvaluation;
  source: "provider" | "demo";
  onAction: (action: UnderstandingEvaluation["nextStep"]) => void;
}) {
  const color = statusColor[evaluation.status];
  return (
    <section className="surface-paper mt-4 rounded-2xl p-5" aria-live="polite" style={{ boxShadow: `0 0 0 1px ${color}33, 0 18px 40px -28px ${color}55` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
          <h2 className="font-display text-lg text-ink-950">{labels[evaluation.status]}</h2>
        </div>
        <span className="font-mono rounded-full bg-ink-900/5 px-2.5 py-1 text-xs font-semibold text-ink-700">{evaluation.score}%</span>
      </div>
      {source === "demo" ? <p className="mt-2 text-xs text-ink-500">Demo evaluation uses transparent topic matching.</p> : null}
      <p className="mt-3 text-sm leading-6 text-ink-700">{evaluation.feedback}</p>
      {evaluation.needsReview.length ? (
        <p className="mt-3 text-sm text-ink-600">
          <span className="font-semibold text-ink-800">Focus: </span>{evaluation.needsReview.join(", ")}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => onAction(evaluation.nextStep)}
        className="mt-4 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
        style={{ borderColor: `${color}55`, color }}
      >
        {actionLabel[evaluation.nextStep]} →
      </button>
    </section>
  );
}
