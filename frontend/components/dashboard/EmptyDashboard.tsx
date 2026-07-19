import Link from "next/link";

export function EmptyDashboard() {
  return (
    <section className="rounded-[2rem] border border-dashed border-ink-900/15 bg-paper-100/60 p-8 text-center sm:p-10">
      <p className="eyebrow-num text-ink-500">Your journey starts here</p>
      <h2 className="font-display mt-3 text-3xl text-ink-950">Your first lesson gives this space momentum.</h2>
      <p className="mx-auto mt-3 max-w-lg leading-7 text-ink-600">
        Ask Ada about a topic you are studying, and this dashboard keeps a local
        record of your learning journey.
      </p>
      <Link
        href="/tutor"
        className="mt-6 inline-flex rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-paper-50 transition hover:-translate-y-0.5 hover:bg-ink-800"
      >
        Start your first lesson →
      </Link>
    </section>
  );
}
