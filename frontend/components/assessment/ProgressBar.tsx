interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = Math.round((current / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--am-text-secondary)]">
          Question {current} of {total}
        </span>
        <span className="tabular-nums text-[var(--am-text-muted)]">
          {progress}%
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--am-border)]"
        role="progressbar"
        aria-label="Assessment progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div
          className="am-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
