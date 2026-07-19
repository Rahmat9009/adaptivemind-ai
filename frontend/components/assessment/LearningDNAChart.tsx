import {
  learningDimensionLabels,
  learningDimensions,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";

interface LearningDNAChartProps {
  scores: LearningScores;
  isVisible: boolean;
}

function DimensionMark({ dimension }: { dimension: LearningDimension }) {
  const shared = { className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.6, viewBox: "0 0 24 24", "aria-hidden": true };
  if (dimension === "visual") return <svg {...shared}><path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
  if (dimension === "examples") return <svg {...shared}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h5M8 17h3" /></svg>;
  if (dimension === "analogies") return <svg {...shared}><path d="M7 12h10M7 8h4M13 16h4" /><circle cx="5" cy="8" r="2" /><circle cx="19" cy="16" r="2" /></svg>;
  if (dimension === "stories") return <svg {...shared}><path d="M5 5.5A3.5 3.5 0 0 1 9 6v13a3.5 3.5 0 0 0-4-0.5V5.5ZM19 5.5A3.5 3.5 0 0 0 15 6v13a3.5 3.5 0 0 1 4-0.5V5.5Z" /><path d="M9 6h6" /></svg>;
  return <svg {...shared}><path d="m12 3 1.9 5.8H20l-5 3.6 1.9 5.8-4.9-3.6-4.9 3.6 1.9-5.8-5-3.6h6.1L12 3Z" /></svg>;
}

export function LearningDNAChart({ scores, isVisible }: LearningDNAChartProps) {
  const ranked = [...learningDimensions].sort((a, b) => scores[b] - scores[a]);
  return (
    <section aria-labelledby="dna-chart-title" className="surface-paper rounded-[2rem] p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="dna-chart-title" className="font-display text-2xl text-ink-950">All five dimensions</h2>
        <span className="font-mono text-xs uppercase tracking-wider text-ink-500">Initial profile</span>
      </div>
      <div className="mt-8 space-y-7">
        {ranked.map((dimension, i) => (
          <div key={dimension} className="dna-visual" style={{ ["--dna" as string]: dnaHex[dimension] }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-ink-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl dna-text" style={{ background: `${dnaHex[dimension]}1a` }}>
                  <DimensionMark dimension={dimension} />
                </span>
                <span className="font-medium text-ink-900">{learningDimensionLabels[dimension]}</span>
                <span className="font-mono text-[0.7rem] text-ink-500">0{i + 1}</span>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-ink-950">{scores[dimension]}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-900/8">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: isVisible ? `${scores[dimension]}%` : "0%",
                  background: `linear-gradient(90deg, ${dnaHex[dimension]}, ${dnaHex[dimension]}cc)`,
                  boxShadow: `0 0 12px -2px ${dnaHex[dimension]}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
