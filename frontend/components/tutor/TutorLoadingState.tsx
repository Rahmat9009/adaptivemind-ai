export function TutorLoadingState() {
  return (
    <div className="surface-paper rounded-[2rem] p-8" role="status">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse-soft rounded-full bg-dna-visual" />
        <span className="eyebrow-num text-ink-500">Ada is preparing your lesson</span>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-ink-900/8" />
        <div className="h-4 animate-pulse rounded bg-ink-900/6" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-ink-900/6" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-ink-900/6" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-900/5" />
        ))}
      </div>
      <span className="sr-only">Preparing your personalized lesson.</span>
    </div>
  );
}
