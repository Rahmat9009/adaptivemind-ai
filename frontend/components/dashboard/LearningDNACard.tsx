import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import { learningDimensionLabels, learningDimensions, type LearningScores } from "@/lib/learning-dna";
import { LearningDNAConstellation } from "@/components/three/LearningDNAConstellation";
import { dnaHex } from "@/lib/learning-dna-visuals";

export function LearningDNACard({ scores }: { scores: LearningScores }) {
  const profile = buildTeachingProfile(scores);
  const primary = profile.primaryDimension;
  return (
    <section aria-labelledby="learning-dna-card-title" className="surface-paper rounded-[2rem] p-6 sm:p-7">
      <p className="eyebrow-num text-ink-500">Current profile</p>
      <div className="mt-3 flex items-baseline gap-3">
        <h2 id="learning-dna-card-title" className="font-display text-3xl text-ink-950">{learningDimensionLabels[primary]}</h2>
        <span className="font-mono text-sm font-semibold" style={{ color: dnaHex[primary] }}>{scores[primary]}%</span>
      </div>
      <p className="mt-1 text-sm text-ink-600">Supporting: {learningDimensionLabels[profile.secondaryDimension]} · {scores[profile.secondaryDimension]}%</p>

      <div className="mt-5">
        <LearningDNAConstellation scores={scores} activeDimension={primary} variant="compact" interactive />
      </div>

      <div className="mt-6 space-y-3.5">
        {learningDimensions.map((dimension) => (
          <div key={dimension}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 font-medium text-ink-700">
                <span className="h-2 w-2 rounded-full" style={{ background: dnaHex[dimension] }} />
                {learningDimensionLabels[dimension]}
              </span>
              <span className="font-mono font-semibold tabular-nums text-ink-950">{scores[dimension]}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-900/8">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${scores[dimension]}%`,
                  background: `linear-gradient(90deg, ${dnaHex[dimension]}, ${dnaHex[dimension]}aa)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
