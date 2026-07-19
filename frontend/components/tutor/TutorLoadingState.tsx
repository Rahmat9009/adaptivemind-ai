export function TutorLoadingState() {
  return (
    <div
      className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-8 shadow-[var(--am-shadow-sm)]"
      role="status"
    >
      <div className="flex items-center gap-3">
        {/* DNA pulse */}
        <div
          className="h-8 w-8 animate-pulse rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, #5046e5, #22d3ee, #8b5cf6, #5046e5)",
          }}
        />
        <div>
          <div className="h-3 w-32 rounded bg-[var(--am-border)] animate-pulse" />
          <div className="mt-2 h-4 w-52 rounded bg-[var(--am-border-light)] animate-pulse" />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-3 animate-pulse rounded bg-[var(--am-border-light)]" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-[var(--am-border-light)]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--am-border-light)]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--am-border-light)]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--am-border-light)]" />
      </div>
      <span className="sr-only">
        Ada is preparing your personalized lesson using your Learning DNA
        profile.
      </span>
    </div>
  );
}
