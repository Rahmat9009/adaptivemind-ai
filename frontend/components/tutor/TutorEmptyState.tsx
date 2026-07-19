import Link from "next/link";

interface TutorEmptyStateProps {
  onUseBalancedProfile: () => void;
}

export function TutorEmptyState({ onUseBalancedProfile }: TutorEmptyStateProps) {
  return (
    <section className="surface-paper mx-auto max-w-xl rounded-[2rem] p-8 text-center sm:p-10">
      <p className="eyebrow-num text-ink-500">Learning DNA needed</p>
      <h1 className="font-display mt-3 text-3xl tracking-tight text-ink-950">
        Your tutor works best after the assessment.
      </h1>
      <p className="mt-4 leading-7 text-ink-600">
        Your assessment gives AdaptiveMind a starting point for shaping
        explanations. Take it now, or continue with a balanced profile.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/assessment" className="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-paper-50 transition hover:-translate-y-0.5 hover:bg-ink-800">
          Take assessment
        </Link>
        <button type="button" onClick={onUseBalancedProfile} className="rounded-full border border-ink-900/15 bg-paper-50 px-5 py-3 text-sm font-semibold text-ink-700 transition hover:-translate-y-0.5 hover:bg-paper-100">
          Continue with balanced profile
        </button>
      </div>
    </section>
  );
}
