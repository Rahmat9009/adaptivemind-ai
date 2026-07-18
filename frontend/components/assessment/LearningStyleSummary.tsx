import { learningDimensionLabels, type LearningDimension, type LearningScores } from "@/lib/learning-dna";

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

export function LearningStyleSummary({ primaryStyle, scores }: LearningStyleSummaryProps) {
  const supportingStyle = (Object.keys(scores) as LearningDimension[])
    .filter((dimension) => dimension !== primaryStyle)
    .sort((first, second) => scores[second] - scores[first])[0];

  return (
    <section className="rounded-3xl border border-teal-100 bg-[linear-gradient(145deg,#ecfdf5,#eff6ff)] p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Primary learning style</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{learningDimensionLabels[primaryStyle]}</h2>
      <p className="mt-4 leading-7 text-slate-700">You learn especially well through {guidance[primaryStyle]}. {supportingStyle ? `AdaptiveMind will also weave in ${learningDimensionLabels[supportingStyle].toLowerCase()} to make each lesson feel more natural.` : ""}</p>
    </section>
  );
}
