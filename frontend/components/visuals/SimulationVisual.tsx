"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { VisualRendererProps } from "./types";

function calculateOutput(
  input: number,
  formula: "linear" | "inverse" | "quadratic",
  coefficient: number,
  offset: number,
): number {
  if (formula === "inverse") return coefficient / input + offset;
  if (formula === "quadratic") return coefficient * input * input + offset;
  return coefficient * input + offset;
}

function formatNumber(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 100_000 || (absolute > 0 && absolute < 0.001)) {
    return value.toExponential(2);
  }
  return Number(value.toFixed(3)).toString();
}

export function SimulationVisual({
  visual,
  interactive,
}: VisualRendererProps) {
  const simulation = visual.simulation;
  const [input, setInput] = useState(simulation?.initial ?? 0);
  const output = simulation
    ? calculateOutput(
        input,
        simulation.formula,
        simulation.coefficient,
        simulation.offset,
      )
    : 0;
  const plotPoints = useMemo(() => {
    if (!simulation) return [];
    return Array.from({ length: 41 }, (_, index) => {
      const x =
        simulation.min
        + ((simulation.max - simulation.min) * index) / 40;
      return {
        x,
        y: calculateOutput(
          x,
          simulation.formula,
          simulation.coefficient,
          simulation.offset,
        ),
      };
    });
  }, [simulation]);

  if (!simulation) return null;

  const yValues = plotPoints.map((point) => point.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const xPercent =
    ((input - simulation.min) / (simulation.max - simulation.min)) * 100;
  const yPercent =
    maxY === minY ? 50 : 100 - ((output - minY) / (maxY - minY)) * 100;
  const path = plotPoints
    .map((point) => {
      const x =
        ((point.x - simulation.min) / (simulation.max - simulation.min)) * 100;
      const y =
        maxY === minY
          ? 50
          : 100 - ((point.y - minY) / (maxY - minY)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="border-l-4 border-[#1751EF] bg-[var(--am-bg-reading)] p-4">
          <p className="text-xs font-semibold text-[var(--am-text-muted)]">
            {simulation.inputLabel}
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--am-text-primary)]">
            {formatNumber(input)}
            {simulation.unit ? ` ${simulation.unit}` : ""}
          </p>
        </div>
        <ArrowRight
          className="mx-auto rotate-90 text-[var(--am-text-muted)] sm:rotate-0"
          aria-hidden="true"
        />
        <div className="border-l-4 border-[#15803D] bg-[var(--am-bg-reading)] p-4">
          <p className="text-xs font-semibold text-[var(--am-text-muted)]">
            {simulation.outputLabel}
          </p>
          <output className="mt-1 block text-2xl font-bold text-[var(--am-text-primary)]">
            {formatNumber(output)}
          </output>
        </div>
      </div>

      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${simulation.outputLabel} changes with ${simulation.inputLabel}`}
        className="mt-5 aspect-[16/7] w-full rounded-sm bg-[var(--am-bg-reading)]"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="100" x2="100" y2="100" stroke="#AAA59E" />
        <line x1="0" y1="0" x2="0" y2="100" stroke="#AAA59E" />
        <polyline
          points={path}
          fill="none"
          stroke="#0891B2"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={xPercent}
          cy={yPercent}
          r="3"
          fill="#BE185D"
          stroke="#FFFFFF"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <label className="mt-5 block text-sm font-semibold text-[var(--am-text-primary)]">
        Change {simulation.inputLabel}
        <input
          type="range"
          min={simulation.min}
          max={simulation.max}
          step={simulation.step}
          value={input}
          disabled={!interactive}
          onChange={(event) => setInput(Number(event.target.value))}
          className="mt-3 block min-h-11 w-full"
        />
      </label>
      {!interactive && (
        <p className="mt-2 text-xs text-[var(--am-text-muted)]">
          Open Interact mode to change the input.
        </p>
      )}
    </div>
  );
}
