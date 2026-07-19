interface ProgressCardProps {
  lessonsCompleted: number;
  topicsExplored: number;
  streak: number;
  lastLessonDate: string | null;
}

export function ProgressCard({
  lessonsCompleted,
  topicsExplored,
  streak,
  lastLessonDate,
}: ProgressCardProps) {
  return (
    <section
      aria-labelledby="progress-title"
      className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)]"
    >
      <h2
        id="progress-title"
        className="text-xl font-semibold text-[var(--am-text-primary)]"
      >
        Your progress
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
        <div>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Lessons completed
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {lessonsCompleted}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Topics explored
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {topicsExplored}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Current streak
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
            {streak}{" "}
            <span className="text-sm font-normal text-[var(--am-text-muted)]">
              day{streak === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-[var(--am-text-muted)]">
            Last lesson
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--am-text-secondary)]">
            {lastLessonDate ?? "Not yet started"}
          </p>
        </div>
      </div>
    </section>
  );
}
