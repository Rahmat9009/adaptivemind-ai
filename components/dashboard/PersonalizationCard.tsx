import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import { learningDimensionLabels, type LearningScores } from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";

export function PersonalizationCard({ scores }: { scores: LearningScores }) {
  const profile = buildTeachingProfile(scores);
  const p = profile.primaryDimension;
  const s = profile.secondaryDimension;
  return (
    <section
      aria-labelledby="personalization-title"
      className="surface-midnight relative overflow-hidden rounded-[2rem] p-6 text-paper-50 sm:p-7"
    >
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-40" />
      <p className="eyebrow-num text-midnight-300">How Ada adapts</p>
      <h2 id="personalization-title" className="font-display mt-3 text-2xl text-paper-50">
        Your lesson is weighted toward two dimensions.
      </h2>

      <ul className="mt-6 space-y-3">
        {[p, s].map((dim, i) => (
          <li key={dim} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full" style={{ background: dnaHex[dim], boxShadow: `0 0 12px -1px ${dnaHex[dim]}` }} />
            <span className="font-medium">{learningDimensionLabels[dim]}</span>
            <span className="font-mono text-sm text-midnight-300">{scores[dim]}%</span>
            <span className="ml-auto eyebrow-num text-midnight-400">{i === 0 ? "lead" : "support"}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 border-t border-midnight-700/50 pt-5 text-sm leading-6 text-midnight-200">
        Ada starts with {learningDimensionLabels[p].toLowerCase()} and weaves in
        {" "}{learningDimensionLabels[s].toLowerCase()} when it helps. These are
        current preferences — not fixed labels.
      </p>
    </section>
  );
}
