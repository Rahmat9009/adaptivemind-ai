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
  return <section aria-labelledby="recent-lessons-title" className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)]"><div className="flex items-center justify-between gap-4"><h2 id="recent-lessons-title" className="text-xl font-semibold text-[var(--am-text-primary)]">Recent lessons</h2><span className="text-sm text-[var(--am-text-muted)]">Latest five</span></div><div className="mt-4 divide-y divide-[var(--am-border-light)]">{history.slice(0, 5).map((entry) => <Link key={entry.id} href="/tutor" onClick={() => sessionStorage.setItem(historyRestoreStorageKey, entry.id)} className="block py-4 first:pt-1 transition hover:bg-[var(--am-border-light)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--am-primary)] focus-visible:ring-offset-2"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--am-success-light)] text-sm font-semibold text-[var(--am-success)]" aria-hidden="true">✓</span><div className="min-w-0 flex-1"><p className="font-semibold text-[var(--am-text-primary)]">{entry.topic}</p><p className="mt-1 text-sm text-[var(--am-text-secondary)]">{entry.teachingMode === "adaptive" ? `Adaptive: ${entry.stylesUsed.map((style) => learningDimensionLabels[style]).join(" + ")}` : `${entry.teachingMode[0].toUpperCase()}${entry.teachingMode.slice(1)} mode`}</p></div><span className="text-sm text-[var(--am-text-muted)]">{formatDate(entry.date)}</span></div></Link>)}</div></section>;
}
