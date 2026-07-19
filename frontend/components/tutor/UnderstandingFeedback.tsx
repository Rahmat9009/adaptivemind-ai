import type { UnderstandingEvaluation } from "@/lib/ai/types";

const labels = {
  correct: "Strong understanding",
  partial: "Almost there",
  misconception: "Let's clarify one thing",
  uncertain: "A useful pause",
};

const actionLabels = {
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
  return (
    <section
      className="mt-4 rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-5 shadow-[var(--am-shadow-sm)]"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-[var(--am-text-primary)]">
          {labels[evaluation.status]}
        </h2>
        <span className="rounded-[var(--am-radius-md)] bg-[var(--am-bg-reading)] px-2.5 py-1 text-xs font-semibold tabular-nums text-[var(--am-text-secondary)]">
          {evaluation.score}%
        </span>
      </div>

      {source === "demo" && (
        <p className="mt-2 text-xs text-[var(--am-text-muted)]">
          Demo evaluation uses transparent topic matching.
        </p>
      )}

      <p className="mt-3 text-sm leading-6 text-[var(--am-text-secondary)]">
        {evaluation.feedback}
      </p>

      {evaluation.whatWasUnderstood.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-[var(--am-success)]">
            Understood
          </p>
          <ul className="mt-1 space-y-1">
            {evaluation.whatWasUnderstood.map((item) => (
              <li
                key={item}
                className="text-sm text-[var(--am-text-secondary)]"
              >
                ✓ {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.needsReview.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-[var(--am-warning)]">
            Focus on these
          </p>
          <ul className="mt-1 space-y-1">
            {evaluation.needsReview.map((item) => (
              <li
                key={item}
                className="text-sm text-[var(--am-text-secondary)]"
              >
                ○ {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => onAction(evaluation.nextStep)}
        className="am-btn am-btn-secondary mt-4 py-2 px-4 text-sm"
      >
        {actionLabels[evaluation.nextStep]}
      </button>
    </section>
  );
}
