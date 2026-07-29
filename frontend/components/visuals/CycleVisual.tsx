"use client";

import { useId } from "react";
import type { VisualRendererProps } from "./types";
import { clampActiveIndex, visualColor } from "./types";

export function CycleVisual({
  visual,
  activeStep,
  interactive,
  onSelectStep,
}: VisualRendererProps) {
  const markerId = useId().replaceAll(":", "");
  const selected = clampActiveIndex(activeStep, visual.steps.length);
  const count = visual.steps.length;
  const positions = visual.steps.map((_, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: 200 + Math.cos(angle) * 132,
      y: 150 + Math.sin(angle) * 96,
    };
  });

  return (
    <div>
      <svg
        viewBox="0 0 400 300"
        role="img"
        aria-labelledby="cycle-visual-title cycle-visual-description"
        className="mx-auto aspect-[4/3] w-full max-w-xl"
      >
        <title id="cycle-visual-title">{visual.title}</title>
        <desc id="cycle-visual-description">{visual.textAlternative}</desc>
        <defs>
          <marker
            id={`${markerId}-cycle-arrow`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#77736C" />
          </marker>
        </defs>
        {positions.map((position, index) => {
          const next = positions[(index + 1) % count];
          return (
            <line
              key={`${visual.steps[index].id}-connection`}
              x1={position.x}
              y1={position.y}
              x2={next.x}
              y2={next.y}
              stroke="#D4D2CC"
              strokeWidth="3"
              markerEnd={`url(#${markerId}-cycle-arrow)`}
            />
          );
        })}
        <circle cx="200" cy="150" r="48" fill="#F7F5F2" stroke="#D4D2CC" />
        <text
          x="200"
          y="146"
          textAnchor="middle"
          fill="#24211D"
          fontSize="14"
          fontWeight="700"
        >
          Repeats
        </text>
        <text
          x="200"
          y="166"
          textAnchor="middle"
          fill="#6F6A63"
          fontSize="11"
        >
          as a cycle
        </text>
        {positions.map((position, index) => (
          <g
            key={visual.steps[index].id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`Step ${index + 1}: ${visual.steps[index].label}`}
            aria-current={index === selected ? "step" : undefined}
            onClick={() => interactive && onSelectStep(index)}
            onKeyDown={(event) => {
              if (
                interactive
                && (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                onSelectStep(index);
              }
            }}
            className={interactive ? "cursor-pointer outline-none" : undefined}
          >
            <circle
              cx={position.x}
              cy={position.y}
              r={index === selected ? 25 : 21}
              fill={visualColor(index)}
              opacity={index === selected ? 1 : 0.8}
              stroke={index === selected ? "#24211D" : "#FFFFFF"}
              strokeWidth={index === selected ? 3 : 2}
            />
            <text
              x={position.x}
              y={position.y + 5}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="14"
              fontWeight="700"
              pointerEvents="none"
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>

      <ol className="mt-2 grid gap-2 sm:grid-cols-2">
        {visual.steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              disabled={!interactive}
              onClick={() => onSelectStep(index)}
              aria-current={index === selected ? "step" : undefined}
              className={`flex min-h-14 w-full items-start gap-3 border-l-2 px-3 py-2 text-left ${
                index === selected
                  ? "bg-[var(--am-primary-ghost)]"
                  : "bg-transparent"
              } ${interactive ? "cursor-pointer" : "cursor-default"}`}
              style={{ borderLeftColor: visualColor(index) }}
            >
              <span className="text-xs font-bold text-[var(--am-text-muted)]">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--am-text-primary)]">
                  {step.label}
                </span>
                {index === selected && (
                  <span className="mt-1 block text-xs leading-5 text-[var(--am-text-secondary)]">
                    {step.description}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
