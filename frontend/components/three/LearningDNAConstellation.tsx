"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { learningDimensionLabels, learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { dnaHex, dnaProjection2D } from "@/lib/learning-dna-visuals";
import { SceneFallback } from "./SceneFallback";

const AdaptiveScene = dynamic(() => import("./AdaptiveScene"), {
  ssr: false,
  loading: () => null,
});

type Variant = "signature" | "compact" | "minimal";

interface LearningDNAConstellationProps {
  scores: LearningScores;
  activeDimension?: LearningDimension;
  variant?: Variant;
  onDimensionSelect?: (dimension: LearningDimension) => void;
  caption?: string;
  interactive?: boolean;
}

const variantSizes: Record<Variant, string> = {
  signature: "min-h-[460px] sm:min-h-[520px]",
  compact: "min-h-[240px]",
  minimal: "min-h-[180px]",
};

/**
 * The signature Learning DNA visualization — a connected-node constellation
 * rendered in 3D (with an accessible SVG fallback). Five nodes, one per
 * learning dimension, colored with the stable DNA palette. The active
 * dimension breathes and brightens. Selecting a node is optional.
 */
export function LearningDNAConstellation({
  scores,
  activeDimension,
  variant = "signature",
  onDimensionSelect,
  caption,
  interactive = true,
}: LearningDNAConstellationProps) {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <figure
      className={`surface-midnight bg-grain relative isolate overflow-hidden rounded-[2rem] ${variantSizes[variant]}`}
      aria-label="Learning DNA constellation"
    >
      {/* Ambient backdrop tint from the active dimension */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-700"
        style={{
          background: activeDimension
            ? `radial-gradient(circle at 50% 45%, ${dnaHex[activeDimension]}22, transparent 55%)`
            : "radial-gradient(circle at 50% 45%, rgba(196,202,237,0.08), transparent 55%)",
        }}
      />

      {/* The 3D scene or its fallback */}
      <div className="absolute inset-0" aria-hidden={reducedMotion ? undefined : true}>
        {reducedMotion ? (
          <SceneFallback scores={scores} activeDimension={activeDimension} compact={variant !== "signature"} />
        ) : (
          <AdaptiveScene scores={scores} activeDimension={activeDimension} />
        )}
      </div>

      {/* Vignette so labels read clearly */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 30%, rgba(7,11,24,0.55) 100%)",
        }}
      />

      {/* Dimension labels — positioned around the constellation using the 2D projection */}
      <div className="pointer-events-none absolute inset-0">
        {learningDimensions.map((dimension) => {
          const p = dnaProjection2D[dimension];
          const isActive = activeDimension === dimension;
          return (
            <button
              key={dimension}
              type="button"
              disabled={!interactive}
              onClick={() => onDimensionSelect?.(dimension)}
              aria-pressed={isActive}
              className={`group pointer-events-auto absolute flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all duration-300 ${
                isActive
                  ? "border-white/30 bg-white/12 text-white"
                  : "border-white/10 bg-midnight-950/40 text-midnight-200 hover:border-white/30"
              } ${interactive ? "cursor-pointer" : "cursor-default"}`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: dnaHex[dimension],
                  boxShadow: `0 0 10px ${dnaHex[dimension]}`,
                }}
              />
              <span>{learningDimensionLabels[dimension]}</span>
              <motion.span
                className="font-mono text-[0.7rem] tabular-nums"
                style={{ color: dnaHex[dimension] }}
                key={scores[dimension]}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {scores[dimension]}
              </motion.span>
            </button>
          );
        })}
      </div>

      {caption ? (
        <figcaption className="absolute inset-x-0 bottom-0 px-6 pb-5 text-center">
          <p className="mx-auto max-w-md text-xs leading-5 text-midnight-200/80">
            {caption}
          </p>
        </figcaption>
      ) : null}

      <p className="sr-only">
        Learning DNA scores: {learningDimensions
          .map((d) => `${learningDimensionLabels[d]} ${scores[d]} percent`)
          .join(", ")}.
      </p>
    </figure>
  );
}
