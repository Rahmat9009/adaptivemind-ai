import Link from "next/link";
import type { LessonRecommendation } from "@/lib/recommendations";

export function RecommendationCard({ recommendation }: { recommendation: LessonRecommendation | null }) {
  if (!recommendation) return null;
  const href = `/tutor?topic=${encodeURIComponent(recommendation.topic)}&subject=${encodeURIComponent(recommendation.subject)}&level=${encodeURIComponent(recommendation.level)}`;
  return <section aria-labelledby="recommendation-title" className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,#eff6ff,#eef2ff)] p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">A thoughtful next step</p><h2 id="recommendation-title" className="mt-2 text-2xl font-semibold text-slate-950">Try {recommendation.topic} next</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{recommendation.reason}</p><Link href={href} className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Start this lesson</Link></section>;
}
