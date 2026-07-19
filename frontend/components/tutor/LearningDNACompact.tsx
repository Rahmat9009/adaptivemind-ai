import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import {
  learningDimensionLabels,
  type LearningScores,
} from "@/lib/learning-dna";
import { LearningDNAConstellation } from "@/components/three/LearningDNAConstellation";

interface LearningDNACompactProps {
  scores: LearningScores;
  isBalanced?: boolean;
}

export function LearningDNACompact({
  scores,
  isBalanced = false,
}: LearningDNACompactProps) {
  const profile = buildTeachingProfile(scores);
  const [primary, secondary] = profile.dominantDimensions;

  return (
    <aside
      className="rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-5 shadow-[var(--am-shadow-sm)]"
      aria-label="Current learning profile"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--am-text-muted)]">
        Learning DNA active
      </p>
      <p className="mt-1.5 text-base font-semibold text-[var(--am-text-primary)]">
        {isBalanced
          ? "Balanced starting profile"
          : `${learningDimensionLabels[primary]} + ${learningDimensionLabels[secondary]}`}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--am-text-secondary)]">
        {isBalanced
          ? "A balanced explanation will be used until you complete the assessment."
          : `Personalized using ${learningDimensionLabels[primary]} + ${learningDimensionLabels[secondary]}.`}
      </p>
      <div className="mt-3">
        <LearningDNAConstellation
          scores={scores}
          activeDimension={primary}
          compact
        />
      </div>
    </aside>
  );
}
