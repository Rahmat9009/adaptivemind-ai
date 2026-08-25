"use client";

import { useEffect, useId, useState } from "react";
import type { TeachingMode } from "@/lib/ai/types";
import { loadLearningDNA2, type LearningDNA2 } from "@/lib/learning-dna-v2";
import { buildLessonRationale } from "@/lib/lesson-rationale";

const dnaColors: Record<string, string> = {
  visual: "#0891B2",
  examples: "#B45309",
  analogies: "#7C3AED",
  stories: "#BE185D",
  challenges: "#DC2626",
};

/**
 * One line explaining why this lesson is taught the way it is, with a
 * "Why?" disclosure for the detail. Derived entirely from local Learning
 * DNA data — no additional AI request is made.
 *
 * Learning DNA is read after mount so the first paint matches the server
 * render. With no stored DNA the rationale is still complete and truthful.
 */
export function LessonRationale({
  teachingMode,
}: {
  teachingMode: TeachingMode;
}) {
  const [dna, setDna] = useState<LearningDNA2 | null>(null);
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setDna(loadLearningDNA2());
      } catch {
        // The rationale still renders from the teaching mode alone.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const rationale = buildLessonRationale(dna, teachingMode);
  const accent = dnaColors[rationale.dimension] ?? "#0891B2";

  return (
    <div className="mt-4 rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-2 text-sm text-[var(--am-text-secondary)]">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          {rationale.headline}
        </span>

        <span className="text-xs text-[var(--am-text-muted)]">
          {rationale.evidenceLabel}
        </span>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={detailId}
          className="ml-auto rounded-[var(--am-radius-md)] px-2 py-1 text-xs font-semibold text-[var(--am-primary)] underline underline-offset-2 transition-colors hover:bg-[var(--am-primary-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--am-primary)]"
        >
          {expanded ? "Hide" : "Why?"}
        </button>
      </div>

      {expanded && (
        <p
          id={detailId}
          className="mt-2 border-t border-[var(--am-border-light)] pt-2 text-sm leading-6 text-[var(--am-text-secondary)]"
        >
          {rationale.detail}
        </p>
      )}
    </div>
  );
}
