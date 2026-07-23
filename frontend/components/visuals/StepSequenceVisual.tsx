"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import type { VisualRendererProps } from "./types";
import { clampActiveIndex, visualColor } from "./types";

export function StepSequenceVisual({
  visual,
  activeStep,
  interactive,
  onSelectStep,
}: VisualRendererProps) {
  const selected = clampActiveIndex(activeStep, visual.steps.length);

  return (
    <ol
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-label={`${visual.title} steps`}
    >
      {visual.steps.map((step, index) => {
        const active = index === selected;
        const complete = index < selected;
        const color = visualColor(index);
        return (
          <li key={step.id} className="relative min-w-0">
            <button
              type="button"
              disabled={!interactive}
              onClick={() => onSelectStep(index)}
              aria-current={active ? "step" : undefined}
              className={`h-full min-h-32 w-full border-l-4 p-4 text-left transition ${
                active
                  ? "bg-[var(--am-primary-ghost)] shadow-sm"
                  : "bg-[var(--am-bg-reading)]"
              } ${interactive ? "cursor-pointer hover:bg-[var(--am-warm-bg)]" : "cursor-default"}`}
              style={{ borderLeftColor: color }}
            >
              <span className="flex items-center justify-between gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {index + 1}
                </span>
                {complete && (
                  <span className="text-xs font-medium text-[var(--am-text-muted)]">
                    Viewed
                  </span>
                )}
              </span>
              <span className="mt-3 block text-sm font-semibold text-[var(--am-text-primary)]">
                {step.label}
              </span>
              <span className="mt-1 block text-sm leading-6 text-[var(--am-text-secondary)]">
                {step.description}
              </span>
            </button>
            {index < visual.steps.length - 1 && (
              <>
                <ArrowDown
                  size={16}
                  className="mx-auto mt-2 text-[var(--am-text-muted)] sm:hidden"
                  aria-hidden="true"
                />
                <ArrowRight
                  size={16}
                  className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-[var(--am-text-muted)] sm:block sm:[&:nth-child(2n)]:hidden lg:block"
                  aria-hidden="true"
                />
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
