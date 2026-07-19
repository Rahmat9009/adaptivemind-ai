import Link from "next/link";
import type { LessonRecommendation } from "@/lib/recommendations";

export function RecommendationCard({ recommendation }: { recommendation: LessonRecommendation | null }) {
  if (!recommendation) return null;
  const href = `/tutor?topic=${encodeURIComponent(recommendation.topic)}&subject=${encodeURIComponent(recommendation.subject)}&level=${encodeURIComponent(recommendation.level)}`;
  return (
    <section
      aria-labelledby="recommendation-title"
      className="relative overflow-hidden rounded-[2rem] p-6 sm:p-7"
      style={{
        background: "linear-gradient(160deg, rgba(45,212,191,0.10), var(--color-paper-50) 70%)",
        border: "1px solid rgba(45,212,191,0.25)",
      }}
    >
      <p className="eyebrow-num text-accent-700">A thoughtful next step</p>
      <h2 id="recommendation-title" className="font-display mt-3 text-3xl text-ink-950">
        Try {recommendation.topic} next
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">{recommendation.reason}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-ink-500">
        <span className="rounded-full bg-ink-900/5 px-2.5 py-1">{recommendation.subject}</span>
        <span className="rounded-full bg-ink-900/5 px-2.5 py-1">{recommendation.level}</span>
      </div>
      <Link
        href={href}
        className="mt-6 inline-flex rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-paper-50 transition hover:-translate-y-0.5 hover:bg-ink-800"
      >
        Start this lesson →
      </Link>
    </section>
  );
}
