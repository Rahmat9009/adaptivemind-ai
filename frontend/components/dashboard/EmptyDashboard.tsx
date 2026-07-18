import Link from "next/link";

export function EmptyDashboard() {
  return <section className="rounded-3xl border border-dashed border-indigo-200 bg-white/80 p-8 text-center shadow-sm sm:p-10"><p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Your journey starts here</p><h2 className="mt-3 text-2xl font-semibold text-slate-950">Your first lesson will give this space momentum.</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">Ask Ada about a topic you are studying, and this dashboard will keep a local record of your learning journey.</p><Link href="/tutor" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-3">Start your first lesson</Link></section>;
}
