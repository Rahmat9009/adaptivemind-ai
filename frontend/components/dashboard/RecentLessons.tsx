"use client";

import Link from "next/link";
import { learningDimensionLabels } from "@/lib/learning-dna";
import { historyRestoreStorageKey, type LessonHistoryEntry } from "@/lib/dashboard-storage";

function formatDate(date: string): string {
  const today = new Date();
  const lessonDate = new Date(date);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (lessonDate.toDateString() === today.toDateString()) return "Today";
  if (lessonDate.toDateString() === yesterday.toDateString()) return "Yesterday";
  return lessonDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RecentLessons({ history }: { history: LessonHistoryEntry[] }) {
  return <section aria-labelledby="recent-lessons-title" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><h2 id="recent-lessons-title" className="text-xl font-semibold text-slate-950">Recent lessons</h2><span className="text-sm text-slate-500">Latest five</span></div><div className="mt-4 divide-y divide-slate-100">{history.slice(0, 5).map((entry) => <Link key={entry.id} href="/tutor" onClick={() => sessionStorage.setItem(historyRestoreStorageKey, entry.id)} className="block py-4 first:pt-1 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700" aria-hidden="true">✓</span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{entry.topic}</p><p className="mt-1 text-sm text-slate-600">{entry.teachingMode === "adaptive" ? `Adaptive: ${entry.stylesUsed.map((style) => learningDimensionLabels[style]).join(" + ")}` : `${entry.teachingMode[0].toUpperCase()}${entry.teachingMode.slice(1)} mode`}</p></div><span className="text-sm text-slate-500">{formatDate(entry.date)}</span></div></Link>)}</div></section>;
}
