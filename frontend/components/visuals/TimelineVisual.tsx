"use client";

import type { VisualRendererProps } from "./types";
import { clampActiveIndex, visualColor } from "./types";

export function TimelineVisual({
  visual,
  activeStep,
  interactive,
  onSelectStep,
}: VisualRendererProps) {
  const selected = clampActiveIndex(activeStep, visual.steps.length);

  return (
    <ol className="relative ml-3 border-l-2 border-[var(--am-border)] pl-7">
      {visual.steps.map((step, index) => (
        <li key={step.id} className="relative pb-6 last:pb-0">
          <span
            className={`absolute -left-[2.35rem] top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
              index === selected ? "scale-125" : ""
            }`}
            style={{ backgroundColor: visualColor(index) }}
            aria-hidden="true"
          />
          <button
            type="button"
            disabled={!interactive}
            onClick={() => onSelectStep(index)}
            aria-current={index === selected ? "step" : undefined}
            className={`min-h-20 w-full border-b border-[var(--am-border-light)] px-1 py-2 text-left ${
              index === selected ? "bg-[var(--am-primary-ghost)]" : ""
            } ${interactive ? "cursor-pointer" : "cursor-default"}`}
          >
            <span className="block text-xs font-semibold uppercase text-[var(--am-text-muted)]">
              {step.group ?? `Stage ${index + 1}`}
            </span>
            <span className="mt-1 block font-semibold text-[var(--am-text-primary)]">
              {step.label}
            </span>
            <span className="mt-1 block text-sm leading-6 text-[var(--am-text-secondary)]">
              {step.description}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
