interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = Math.round((current / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-ink-500">
        <span>Question {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <span>{progress}% traced</span>
      </div>
      <div
        className="mt-3 h-px w-full bg-ink-900/12"
        role="progressbar"
        aria-label="Assessment progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div
          className="h-px bg-gradient-to-r from-dna-visual via-dna-analogies to-dna-stories transition-all duration-700"
          style={{ width: `${progress}%`, boxShadow: "0 0 8px -1px var(--color-dna-visual)" }}
        />
      </div>
    </div>
  );
}
