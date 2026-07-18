import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import { learningDimensionLabels, type LearningScores } from "@/lib/learning-dna";

interface LearningDNACompactProps {
  scores: LearningScores;
  isBalanced?: boolean;
}

export function LearningDNACompact({ scores, isBalanced = false }: LearningDNACompactProps) {
  const profile = buildTeachingProfile(scores);
  const [primary, secondary] = profile.dominantDimensions;

  return (
    <aside className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur" aria-label="Current learning profile">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Learning DNA</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">
        {isBalanced ? "Balanced starting profile" : `${learningDimensionLabels[primary]} + ${learningDimensionLabels[secondary]}`}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {isBalanced
          ? "A balanced explanation will be used until you complete the assessment."
          : `Personalized using ${learningDimensionLabels[primary]} + ${learningDimensionLabels[secondary]}.`}
      </p>
    </aside>
  );
}
