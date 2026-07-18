"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { learningDimensionLabels, learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { learningDNAVisuals } from "@/lib/learning-dna-visuals";
import { SceneFallback } from "./SceneFallback";

const AdaptiveScene = dynamic(() => import("./AdaptiveScene"), { ssr: false, loading: () => null });

interface LearningDNAConstellationProps { scores: LearningScores; activeDimension?: LearningDimension; compact?: boolean; onDimensionSelect?: (dimension: LearningDimension) => void; }

export function LearningDNAConstellation({ scores, activeDimension, compact = false, onDimensionSelect }: LearningDNAConstellationProps) {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReducedMotion(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const dimensions = compact ? learningDimensions.slice(0, 3) : learningDimensions;
  return <section className={`relative isolate overflow-hidden rounded-3xl border border-indigo-100 bg-[#0b1020] ${compact ? "min-h-52" : "min-h-96"}`} aria-label="Interactive Learning DNA constellation"><div className="absolute inset-0" aria-hidden="true">{reducedMotion ? <SceneFallback scores={scores} compact={compact} /> : <AdaptiveScene scores={scores} activeDimension={activeDimension} />}</div><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(8,12,27,0.45)_100%)]" />{dimensions.map((dimension, index) => <button key={dimension} type="button" onClick={() => onDimensionSelect?.(dimension)} className={`absolute z-10 rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold text-white backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${activeDimension === dimension ? "border-white bg-white/20" : "border-white/20 bg-slate-950/45 hover:border-white/60"}`} style={{ left: `${[8, 67, 65, 39, 8][index]}%`, top: `${[12, 17, 70, 80, 61][index]}%` }}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: learningDNAVisuals[dimension].color }} />{learningDimensionLabels[dimension]} {scores[dimension]}%</button>)}<p className="sr-only">Learning DNA scores: {learningDimensions.map((dimension) => `${learningDimensionLabels[dimension]} ${scores[dimension]} percent`).join(", ")}.</p></section>;
}
