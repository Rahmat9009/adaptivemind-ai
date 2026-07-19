import type { TopicMastery } from "@/lib/mastery";

const masteryColor: Record<TopicMastery["masteryLevel"], string> = {
  new: "#9a8b78",
  developing: "#fbbf24",
  proficient: "#2dd4bf",
  mastered: "#0d9488",
  "needs-review": "#ff6b5b",
};

const masteryLabel: Record<TopicMastery["masteryLevel"], string> = {
  new: "New",
  developing: "Developing",
  proficient: "Proficient",
  mastered: "Mastered",
  "needs-review": "Needs review",
};

export function MasteryOverview({
  entries,
  mastered,
  developing,
  needsReview,
  averageRecentScore,
}: {
  entries: TopicMastery[];
  mastered: number;
  developing: number;
  needsReview: number;
  averageRecentScore: number | null;
}) {
  return (
    <section aria-labelledby="mastery-title" className="surface-paper rounded-[2rem] p-6 sm:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="mastery-title" className="font-display text-2xl text-ink-950">Mastery</h2>
        {averageRecentScore !== null ? (
          <span className="font-mono text-sm text-ink-500">recent avg · <span className="font-semibold text-ink-950">{averageRecentScore}%</span></span>
        ) : null}
      </div>

      {entries.length ? (
        <>
          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-ink-900/8 bg-ink-900/8 text-center">
            <div className="bg-paper-50 p-4">
              <p className="font-display text-2xl text-ink-950">{mastered}</p>
              <p className="mt-1 eyebrow-num" style={{ color: masteryColor.mastered }}>Mastered</p>
            </div>
            <div className="bg-paper-50 p-4">
              <p className="font-display text-2xl text-ink-950">{developing}</p>
              <p className="mt-1 eyebrow-num" style={{ color: masteryColor.developing }}>Developing</p>
            </div>
            <div className="bg-paper-50 p-4">
              <p className="font-display text-2xl text-ink-950">{needsReview}</p>
              <p className="mt-1 eyebrow-num" style={{ color: masteryColor["needs-review"] }}>Review</p>
            </div>
          </div>

          <ul className="mt-6 divide-y divide-ink-900/8">
            {entries.slice(0, 6).map((entry) => {
              const color = masteryColor[entry.masteryLevel];
              return (
                <li key={entry.topicId} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{entry.topic}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {entry.attempts} {entry.attempts === 1 ? "attempt" : "attempts"} · best {entry.bestScore}%
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-ink-900/8 sm:block">
                      <div className="h-full rounded-full" style={{ width: `${entry.latestScore}%`, background: color }} />
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: `${color}1a`, color }}
                    >
                      {masteryLabel[entry.masteryLevel]}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-sm leading-6 text-ink-600">
          Complete an understanding check after a lesson to begin tracking mastery.
          Each topic you study earns a mastery estimate that shapes future recommendations.
        </p>
      )}
    </section>
  );
}
