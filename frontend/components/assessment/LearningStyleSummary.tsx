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

  return (
    <section className="rounded-3xl border border-teal-100 bg-[linear-gradient(145deg,#ecfdf5,#eff6ff)] p-6 shadow-lg shadow-teal-950/5 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Primary learning preference</p>
      <div className="mt-3 flex items-end gap-3"><h2 className="text-3xl font-semibold tracking-tight text-slate-950">{learningDimensionLabels[primaryStyle]}</h2><span className="pb-1 text-lg font-semibold text-teal-800">{scores[primaryStyle]}%</span></div>
      <p className="mt-4 leading-7 text-slate-700">Based on your current assessment preferences, you currently respond best to {guidance[primaryStyle]}.</p>
      <div className="mt-6 border-t border-teal-200/80 pt-5"><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Recommended approach</p><p className="mt-2 text-sm leading-6 text-slate-700">{approach[primaryStyle]}</p></div>
      {supportingStyle ? <p className="mt-5 text-sm leading-6 text-slate-600"><span className="font-semibold text-slate-800">Strongest supporting preference:</span> {learningDimensionLabels[supportingStyle]} ({scores[supportingStyle]}%).</p> : null}
    </section>
  );
}
