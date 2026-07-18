import Link from "next/link";

interface TutorEmptyStateProps {
  onUseBalancedProfile: () => void;
}

export function TutorEmptyState({ onUseBalancedProfile }: TutorEmptyStateProps) {
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-white/80 bg-white/80 p-7 text-center shadow-xl shadow-slate-900/6 backdrop-blur sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Learning DNA needed</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Your tutor works best after the assessment.</h1>
      <p className="mt-4 leading-7 text-slate-600">Your assessment gives AdaptiveMind a starting point for shaping explanations. You can take it now or continue with a balanced profile.</p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/assessment" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4">Take assessment</Link><button type="button" onClick={onUseBalancedProfile} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4">Continue with balanced profile</button></div>
    </section>
  );
}
