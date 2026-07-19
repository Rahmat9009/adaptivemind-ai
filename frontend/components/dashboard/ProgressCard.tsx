interface ProgressCardProps {
  lessonsCompleted: number;
  topicsExplored: number;
  streak: number;
  lastLessonDate: string | null;
}

export function ProgressCard({ lessonsCompleted, topicsExplored, streak, lastLessonDate }: ProgressCardProps) {
  return (
    <section aria-labelledby="progress-title" className="surface-paper rounded-[2rem] p-6">
      <h2 id="progress-title" className="font-display text-xl text-ink-950">Progress at a glance</h2>
      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-900/8 bg-ink-900/8">
        <div className="bg-paper-50 p-4">
          <dt className="eyebrow-num text-ink-500">Lessons</dt>
          <dd className="mt-1 font-display text-3xl text-ink-950">{lessonsCompleted}</dd>
        </div>
        <div className="bg-paper-50 p-4">
          <dt className="eyebrow-num text-ink-500">Topics</dt>
          <dd className="mt-1 font-display text-3xl text-ink-950">{topicsExplored}</dd>
        </div>
        <div className="bg-paper-50 p-4">
          <dt className="eyebrow-num text-ink-500">Streak</dt>
          <dd className="mt-1 font-display text-3xl text-ink-950">{streak}<span className="ml-1 text-base text-ink-500">d</span></dd>
        </div>
        <div className="bg-paper-50 p-4">
          <dt className="eyebrow-num text-ink-500">Last lesson</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-ink-950">{lastLessonDate ?? "Not yet started"}</dd>
        </div>
      </dl>
    </section>
  );
}
