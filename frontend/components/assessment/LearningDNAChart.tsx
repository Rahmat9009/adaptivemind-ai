import {
  learningDimensionLabels,
  learningDimensions,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";

interface LearningDNAChartProps {
  scores: LearningScores;
  isVisible: boolean;
}

function DimensionIcon({ dimension }: { dimension: LearningDimension }) {
  const shared = { className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24", "aria-hidden": true };
  if (dimension === "visual") return <svg {...shared}><path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
  if (dimension === "examples") return <svg {...shared}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h5M8 17h3" /></svg>;
  if (dimension === "analogies") return <svg {...shared}><path d="M7 12h10M7 8h4M13 16h4" /><circle cx="5" cy="8" r="2" /><circle cx="19" cy="16" r="2" /></svg>;
  if (dimension === "stories") return <svg {...shared}><path d="M5 5.5A3.5 3.5 0 0 1 9 6v13a3.5 3.5 0 0 0-4-0.5V5.5ZM19 5.5A3.5 3.5 0 0 0 15 6v13a3.5 3.5 0 0 1 4-0.5V5.5Z" /><path d="M9 6h6" /></svg>;
  return <svg {...shared}><path d="m12 3 1.9 5.8H20l-5 3.6 1.9 5.8-4.9-3.6-4.9 3.6 1.9-5.8-5-3.6h6.1L12 3Z" /></svg>;
}

export function LearningDNAChart({ scores, isVisible }: LearningDNAChartProps) {
  return (
    <section aria-labelledby="dna-chart-title" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 id="dna-chart-title" className="text-xl font-semibold text-slate-950">Your learning preferences</h2>
        <span className="text-sm text-slate-500">Initial profile</span>
      </div>
      <div className="mt-7 space-y-6">
        {learningDimensions.map((dimension) => (
          <div key={dimension}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-slate-700"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><DimensionIcon dimension={dimension} /></span><span className="font-medium">{learningDimensionLabels[dimension]}</span></div>
              <span className="text-sm font-semibold tabular-nums text-slate-950">{scores[dimension]}%</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#38bdf8,#6366f1)] transition-all duration-700 ease-out" style={{ width: isVisible ? `${scores[dimension]}%` : "0%" }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
