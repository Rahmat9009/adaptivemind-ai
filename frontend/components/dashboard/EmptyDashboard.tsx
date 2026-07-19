import Link from "next/link";

export function EmptyDashboard() {
  return (
    <section className="rounded-[var(--am-radius-2xl)] border border-dashed border-[var(--am-border)] bg-[var(--am-bg-elevated)]/60 p-8 text-center shadow-sm sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-text-muted)]">
        Your journey starts here
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-[var(--am-text-primary)]">
        Your first lesson will give this space momentum.
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--am-text-secondary)]">
        Ask Ada about a topic you are studying, and this dashboard will keep a
        local record of your learning journey.
      </p>
      <Link
        href="/tutor"
        className="am-btn am-btn-primary mt-6 inline-flex"
      >
        Start your first lesson
      </Link>
    </section>
  );
}
