"use client";

import { ArrowRight } from "lucide-react";
import type { VisualRendererProps } from "./types";
import { clampActiveIndex, visualColor } from "./types";

export function FlowchartVisual({
  visual,
  activeStep,
  interactive,
  onSelectStep,
}: VisualRendererProps) {
  const selected = clampActiveIndex(activeStep, visual.steps.length);
  const stepById = new Map(visual.steps.map((step) => [step.id, step]));

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {visual.steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            disabled={!interactive}
            onClick={() => onSelectStep(index)}
            aria-current={index === selected ? "step" : undefined}
            className={`min-h-28 border-l-4 p-4 text-left ${
              index === selected
                ? "bg-[var(--am-primary-ghost)] shadow-sm"
                : "bg-[var(--am-bg-reading)]"
            } ${interactive ? "cursor-pointer hover:bg-[var(--am-warm-bg)]" : "cursor-default"}`}
            style={{ borderLeftColor: visualColor(index) }}
          >
            {step.group && (
              <span className="block text-xs font-semibold uppercase text-[var(--am-text-muted)]">
                {step.group}
              </span>
            )}
            <span className="mt-1 block font-semibold text-[var(--am-text-primary)]">
              {step.label}
            </span>
            <span className="mt-1 block text-sm leading-6 text-[var(--am-text-secondary)]">
              {step.description}
            </span>
          </button>
        ))}
      </div>

      {visual.connections.length > 0 && (
        <section className="mt-5" aria-label="Connections between concepts">
          <h4 className="text-xs font-semibold uppercase text-[var(--am-text-muted)]">
            Connections
          </h4>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {visual.connections.map((connection, index) => (
              <li
                key={`${connection.from}-${connection.to}-${index}`}
                className="flex min-w-0 items-center gap-2 border-b border-[var(--am-border-light)] py-2 text-xs text-[var(--am-text-secondary)]"
              >
                <span className="min-w-0 truncate font-medium text-[var(--am-text-primary)]">
                  {stepById.get(connection.from)?.label ?? connection.from}
                </span>
                <ArrowRight size={15} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate font-medium text-[var(--am-text-primary)]">
                  {stepById.get(connection.to)?.label ?? connection.to}
                </span>
                {connection.label && (
                  <span className="ml-auto hidden text-[var(--am-text-muted)] lg:inline">
                    {connection.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
