"use client";

import { Check } from "lucide-react";
import type { VisualRendererProps } from "./types";
import { clampActiveIndex, visualColor } from "./types";

export function ComparisonVisual({
  visual,
  activeStep,
  interactive,
  onSelectStep,
}: VisualRendererProps) {
  const selected = clampActiveIndex(activeStep, visual.columns.length);

  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      aria-label={`${visual.title} comparison`}
    >
      {visual.columns.map((column, index) => (
        <section
          key={column.label}
          className={`border-t-4 bg-[var(--am-bg-reading)] p-4 ${
            index === selected ? "shadow-sm ring-2 ring-[var(--am-primary)]/25" : ""
          }`}
          style={{ borderTopColor: visualColor(index) }}
          aria-current={index === selected ? "true" : undefined}
        >
          <button
            type="button"
            disabled={!interactive}
            onClick={() => onSelectStep(index)}
            className={`min-h-11 w-full text-left text-base font-semibold text-[var(--am-text-primary)] ${
              interactive ? "cursor-pointer" : "cursor-default"
            }`}
          >
            {column.label}
          </button>
          <ul className="mt-2 space-y-3">
            {column.items.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm leading-6 text-[var(--am-text-secondary)]"
              >
                <Check
                  size={16}
                  className="mt-1 shrink-0"
                  style={{ color: visualColor(index) }}
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
