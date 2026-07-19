"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { learningDimensionLabels, learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { learningDNAVisuals } from "@/lib/learning-dna-visuals";
import { SceneFallback } from "./SceneFallback";

const AdaptiveScene = dynamic(() => import("./AdaptiveScene"), { ssr: false });

interface LearningDNAConstellationProps {
  scores: LearningScores;
  activeDimension?: LearningDimension;
  compact?: boolean;
  onDimensionSelect?: (dimension: LearningDimension) => void;
}

export function LearningDNAConstellation({ scores, activeDimension, compact = false, onDimensionSelect }: LearningDNAConstellationProps) {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hasWebGL] = useState(() => {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch { return false; }
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const use3D = hasWebGL && !reducedMotion;
  const heightClass = compact ? "min-h-44" : "min-h-72 sm:min-h-96";

  return (
    <div
      className={`relative isolate overflow-hidden rounded-[var(--am-radius-2xl)] ${heightClass}`}
      style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(80,70,229,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.08) 0%, transparent 50%), linear-gradient(145deg, #080c1b 0%, #0e1428 50%, #0a0f20 100%)" }}
      role="region"
      aria-label={`Interactive Learning DNA constellation showing your learning preferences: ${learningDimensions.map(d => `${learningDimensionLabels[d]}: ${scores[d]}%`).join(", ")}`}
    >
      {use3D ? (
        <div className="absolute inset-0" aria-hidden="true">
          <AdaptiveScene scores={scores} activeDimension={activeDimension} />
        </div>
      ) : (
        <div className="absolute inset-0" aria-hidden="true">
          <SceneFallback scores={scores} compact={compact} activeDimension={activeDimension} />
        </div>
      )}

      {/* Vignette overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true"
        style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(8,12,27,0.7) 100%)" }}
      />

      {/* Accessible dimension buttons */}
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-1.5">
          {learningDimensions.map((dimension) => (
            <button
              key={dimension}
              type="button"
              onClick={() => onDimensionSelect?.(dimension)}
              className={`inline-flex items-center gap-1.5 rounded-[var(--am-radius-md)] px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--am-primary)] ${
                activeDimension === dimension
                  ? "bg-white/15 text-white border"
                  : "border border-white/10 bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
              }`}
              style={{ borderColor: activeDimension === dimension ? learningDNAVisuals[dimension].color : undefined }}
              aria-label={`${learningDimensionLabels[dimension]}: ${scores[dimension]}%. Click to highlight.`}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: learningDNAVisuals[dimension].color }} />
              <span className="hidden sm:inline">{learningDimensionLabels[dimension]}</span>
              <span>{scores[dimension]}%</span>
            </button>
          ))}
        </div>
      )}

      {/* Screen-reader fallback for compact */}
      {compact && (
        <div className="sr-only">
          {learningDimensions.map(d => `${learningDimensionLabels[d]}: ${scores[d]}%`).join(", ")}
        </div>
      )}
    </div>
  );
}
