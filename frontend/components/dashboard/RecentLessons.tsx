"use client";

import Link from "next/link";
import { learningDimensionLabels } from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";
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
  return (
    <section aria-labelledby="recent-lessons-title" className="surface-paper rounded-[2rem] p-6 sm:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="recent-lessons-title" className="font-display text-2xl text-ink-950">Recent lessons</h2>
        <span className="font-mono text-xs uppercase tracking-wider text-ink-500">Latest five</span>
      </div>
      <ol className="mt-5 divide-y divide-ink-900/8">
        {history.slice(0, 5).map((entry) => (
          <li key={entry.id}>
            <Link
              href="/tutor"
              onClick={() => sessionStorage.setItem(historyRestoreStorageKey, entry.id)}
              className="group flex items-start gap-4 py-4 transition hover:bg-paper-100/60 -mx-2 px-2 rounded-lg"
            >
              <span className="font-mono text-xs text-ink-400 pt-1">{String(history.indexOf(entry) + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg text-ink-950">{entry.topic}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">
                  {entry.stylesUsed.slice(0, 2).map((style) => (
                    <span key={style} className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/5 px-2 py-0.5 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dnaHex[style] }} />
                      {learningDimensionLabels[style]}
                    </span>
                  ))}
                  <span className="text-ink-400">·</span>
                  <span>{entry.teachingMode === "adaptive" ? "Adaptive" : entry.teachingMode}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-ink-500">{formatDate(entry.date)}</span>
                <span className="text-sm font-medium text-ink-700 transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
