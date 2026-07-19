interface DashboardHeaderProps {
  streak: number;
  lessonsCompleted: number;
  primaryLabel: string;
}

export function DashboardHeader({
  streak,
  lessonsCompleted,
  primaryLabel,
}: DashboardHeaderProps) {
  return (
    <header className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)] sm:p-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-primary)]/70">
            Your learning space
          </p>
          <h1 className="mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight leading-[1.12]">
            Welcome back.
          </h1>
          <p className="mt-1 text-base text-[var(--am-text-secondary)]">
            Ready for today&apos;s lesson?
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3 text-center">
            <p className="text-xs font-medium text-[var(--am-text-muted)]">
              Streak
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--am-text-primary)]">
              {streak}
              <span className="text-sm font-normal text-[var(--am-text-muted)]">
                d
              </span>
            </p>
          </div>
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3 text-center">
            <p className="text-xs font-medium text-[var(--am-text-muted)]">
              Lessons
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--am-text-primary)]">
              {lessonsCompleted}
            </p>
          </div>
          <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3 text-center">
            <p className="text-xs font-medium text-[var(--am-text-muted)]">
              Style
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--am-primary)]">
              {primaryLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
