interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = Math.round((current / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium text-slate-600">
        <span>Question {current} of {total}</span>
        <span>{progress}% complete</span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="Assessment progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#38bdf8,#6366f1)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
