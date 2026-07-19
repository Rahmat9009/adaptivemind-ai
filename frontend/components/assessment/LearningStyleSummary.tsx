import { learningDimensionLabels, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";

interface LearningStyleSummaryProps {
  primaryStyle: LearningDimension;
  scores: LearningScores;
}

const guidance: Record<LearningDimension, string> = {
  visual: "clear visual structure and diagrams that make relationships easy to see",
  examples: "concrete situations that show how an idea works in practice",
  analogies: "familiar comparisons that connect new ideas to things you already know",
  stories: "connected narratives that give concepts a memorable context",
  challenges: "active practice that lets you test an idea and learn from feedback",
};

const approach: Record<LearningDimension, string> = {
  visual: "Ada will begin by making the structure and relationships easy to see.",
  examples: "Ada will begin with concrete situations before introducing abstract theory.",
  analogies: "Ada will begin by connecting new ideas to familiar ones.",
  stories: "Ada will begin with concise, contextual scenarios that make the idea memorable.",
  challenges: "Ada will begin with a question that invites you to reason through the idea.",
};

export function LearningStyleSummary({ primaryStyle, scores }: LearningStyleSummaryProps) {
  const supportingStyle = (Object.keys(scores) as LearningDimension[])
    .filter((dimension) => dimension !== primaryStyle)
    .sort((first, second) => scores[second] - scores[first])[0];
  const color = dnaHex[primaryStyle];

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
      style={{
        background: `linear-gradient(160deg, ${color}14, var(--color-paper-50) 70%)`,
        border: `1px solid ${color}33`,
      }}
    >
      <p className="eyebrow-num" style={{ color }}>Primary learning dimension</p>
      <div className="mt-4 flex items-end gap-3">
        <h2 className="font-display text-4xl leading-none tracking-tight text-ink-950 sm:text-5xl">
          {learningDimensionLabels[primaryStyle]}
        </h2>
        <span className="pb-1 font-mono text-lg font-semibold" style={{ color }}>
          {scores[primaryStyle]}%
        </span>
      </div>
      <p className="mt-5 leading-7 text-ink-800">
        You currently respond best to {guidance[primaryStyle]}.
      </p>
      <div className="mt-6 border-t pt-5" style={{ borderColor: `${color}33` }}>
        <p className="eyebrow-num text-ink-500">How Ada will start</p>
        <p className="mt-2 text-sm leading-6 text-ink-700">{approach[primaryStyle]}</p>
      </div>
      {supportingStyle ? (
        <p className="mt-5 text-sm leading-6 text-ink-600">
          <span className="font-semibold text-ink-800">Strongest supporting dimension: </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: dnaHex[supportingStyle] }} />
            {learningDimensionLabels[supportingStyle]} ({scores[supportingStyle]}%)
          </span>
        </p>
      ) : null}
    </section>
  );
}
