"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  learningDimensionLabels,
  learningDimensions,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
import { learningDNAVisuals } from "@/lib/learning-dna-visuals";
import { SceneFallback } from "./SceneFallback";

const AdaptiveScene = dynamic(() => import("./AdaptiveScene"), {
  ssr: false,
});

interface LearningDNAConstellationProps {
  scores: LearningScores;
  activeDimension?: LearningDimension;
  compact?: boolean;
  onDimensionSelect?: (dimension: LearningDimension) => void;
}

export function LearningDNAConstellation({
  scores,
  activeDimension,
  compact = false,
  onDimensionSelect,
}: LearningDNAConstellationProps) {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hasWebGL] = useState(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Detect reduced motion preference
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  const heightClass = compact
    ? "min-h-44"
    : "min-h-72 sm:min-h-96";

  return (
    <div
      className={`relative isolate overflow-hidden rounded-[var(--am-radius-2xl)] ${heightClass}`}
      style={{
        background:
          "linear-gradient(145deg, #080c1b 0%, #0e1428 50%, #0a0f20 100%)",
      }}
      aria-label={
        compact
          ? "Learning DNA visualization"
          : `Interactive Learning DNA constellation showing your learning preferences. ${learningDimensions
              .map(
                (dim) =>
                  `${learningDimensionLabels[dim]}: ${scores[dim]} percent`,
              )
              .join(", ")}`
      }
      role={compact ? "img" : "region"}
    >
      {/* 3D Scene or Fallback */}
      {hasWebGL && !reducedMotion ? (
        <div className="absolute inset-0" aria-hidden="true">
          <AdaptiveScene scores={scores} activeDimension={activeDimension} />
        </div>
      ) : (
        <div className="absolute inset-0" aria-hidden="true">
          <SceneFallback scores={scores} compact={compact} />
        </div>
      )}

      {/* Ambient gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(8,12,27,0.6) 100%)",
        }}
      />

      {/* Accessible text labels */}
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-2">
          {learningDimensions.map((dimension) => (
            <button
              key={dimension}
              type="button"
              onClick={() => onDimensionSelect?.(dimension)}
              className={`inline-flex items-center gap-1.5 rounded-[var(--am-radius-md)] px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--am-primary)] ${
                activeDimension === dimension
                  ? "border bg-white/15 text-white"
                  : "border border-white/10 bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
              }`}
              style={{
                borderColor:
                  activeDimension === dimension
                    ? learningDNAVisuals[dimension].color
                    : undefined,
              }}
              aria-label={`${learningDimensionLabels[dimension]}: ${scores[dimension]}%. Click to highlight this dimension.`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: learningDNAVisuals[dimension].color,
                }}
              />
              {learningDimensionLabels[dimension]} {scores[dimension]}%
            </button>
          ))}
        </div>
      )}

      {/* Screen-reader text for compact mode */}
      {compact && (
        <div className="sr-only">
          {learningDimensions
            .map(
              (dim) =>
                `${learningDimensionLabels[dim]}: ${scores[dim]}%`,
            )
            .join(", ")}
        </div>
      )}
    </div>
  );
}
