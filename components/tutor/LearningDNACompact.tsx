import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import { learningDimensionLabels, type LearningScores } from "@/lib/learning-dna";
import { LearningDNAConstellation } from "@/components/three/LearningDNAConstellation";
import { dnaHex } from "@/lib/learning-dna-visuals";

interface LearningDNACompactProps {
  scores: LearningScores;
  isBalanced?: boolean;
}

export function LearningDNACompact({ scores, isBalanced = false }: LearningDNACompactProps) {
  const profile = buildTeachingProfile(scores);
  const [primary, secondary] = profile.dominantDimensions;
  const color = dnaHex[primary];

  return (
    <aside className="surface-midnight relative overflow-hidden rounded-2xl p-5 text-paper-50" aria-label="Current learning profile">
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-40" />
      <div className="relative">
        <p className="eyebrow-num text-midnight-300">Learning DNA</p>
        <p className="mt-2 font-display text-xl text-paper-50">
          {isBalanced ? "Balanced starting profile" : `${learningDimensionLabels[primary]} + ${learningDimensionLabels[secondary]}`}
        </p>
        <p className="mt-1.5 text-xs leading-5 text-midnight-200">
          {isBalanced
            ? "Balanced explanations until you complete the assessment."
            : `Weighted toward ${learningDimensionLabels[primary].toLowerCase()}.`}
        </p>
        <div className="mt-4">
          <LearningDNAConstellation scores={scores} activeDimension={primary} variant="compact" interactive={false} />
        </div>
        <div className="mt-3 flex gap-1.5">
          {(Object.keys(scores) as (keyof LearningScores)[]).map((dim) => (
            <div key={dim} className="flex-1" title={`${dim} ${scores[dim]}%`}>
              <div className="h-1 overflow-hidden rounded-full bg-midnight-700/60">
                <div className="h-full rounded-full" style={{ width: `${scores[dim]}%`, background: dnaHex[dim] }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 font-mono text-[0.7rem] text-midnight-400" style={{ color }}>
          {scores[primary]}% · {scores[secondary]}% supporting
        </p>
      </div>
    </aside>
  );
}
