interface DashboardHeaderProps {
  streak: number;
  lessonsCompleted: number;
  primaryLabel: string;
}

export function DashboardHeader({ streak, lessonsCompleted, primaryLabel }: DashboardHeaderProps) {
  return (
    <header className="surface-paper rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow-num text-ink-500">Your learning space</p>
          <h1 className="font-display mt-3 text-4xl leading-tight tracking-tight text-ink-950 sm:text-5xl">
            Welcome back.
          </h1>
          <p className="mt-2 text-base text-ink-700">Ready for today&apos;s lesson?</p>
        </div>
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-ink-900/8 bg-ink-900/8 text-center">
          <div className="bg-paper-50 px-4 py-3">
            <dt className="eyebrow-num text-ink-500">Streak</dt>
            <dd className="mt-1 font-display text-2xl text-ink-950">{streak}<span className="ml-1 text-sm text-ink-500">d</span></dd>
          </div>
          <div className="bg-paper-50 px-4 py-3">
            <dt className="eyebrow-num text-ink-500">Lessons</dt>
            <dd className="mt-1 font-display text-2xl text-ink-950">{lessonsCompleted}</dd>
          </div>
          <div className="bg-paper-50 px-4 py-3">
            <dt className="eyebrow-num text-ink-500">DNA</dt>
            <dd className="mt-1 text-sm font-semibold text-ink-950">{primaryLabel}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
