"use client";

import type { VisualRendererProps } from "./types";
import { clampActiveIndex, visualColor } from "./types";

export function LabeledDiagramVisual({
  visual,
  activeStep,
  interactive,
  onSelectStep,
}: VisualRendererProps) {
  const selected = clampActiveIndex(activeStep, visual.steps.length);
  const stepById = new Map(visual.steps.map((step) => [step.id, step]));

  return (
    <div>
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-labelledby="diagram-title diagram-description"
        className="mx-auto aspect-[4/3] w-full max-w-2xl rounded-sm bg-[var(--am-bg-reading)]"
      >
        <title id="diagram-title">{visual.title}</title>
        <desc id="diagram-description">{visual.textAlternative}</desc>
        {visual.connections.map((connection, index) => {
          const from = stepById.get(connection.from);
          const to = stepById.get(connection.to);
          if (
            from?.x === undefined
            || from.y === undefined
            || to?.x === undefined
            || to.y === undefined
          ) {
            return null;
          }
          return (
            <line
              key={`${connection.from}-${connection.to}-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#AAA59E"
              strokeWidth="0.75"
              strokeDasharray={connection.label ? "2 1.5" : undefined}
            />
          );
        })}
        {visual.steps.map((step, index) => (
          <g
            key={step.id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`${step.label}: ${step.description}`}
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
              cx={step.x}
              cy={step.y}
              r={index === selected ? 5.25 : 4.25}
              fill={visualColor(index)}
              stroke={index === selected ? "#24211D" : "#FFFFFF"}
              strokeWidth={index === selected ? 1 : 0.6}
            />
            <text
              x={step.x}
              y={(step.y ?? 0) + 1.7}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="4.5"
              fontWeight="700"
              pointerEvents="none"
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {visual.steps.map((step, index) => (
          <li
            key={step.id}
            className={`border-l-2 px-3 py-2 ${
              index === selected ? "bg-[var(--am-primary-ghost)]" : ""
            }`}
            style={{ borderLeftColor: visualColor(index) }}
          >
            <button
              type="button"
              disabled={!interactive}
              onClick={() => onSelectStep(index)}
              className={`w-full text-left ${
                interactive ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <span className="text-sm font-semibold text-[var(--am-text-primary)]">
                {index + 1}. {step.label}
              </span>
              {index === selected && (
                <span className="mt-1 block text-xs leading-5 text-[var(--am-text-secondary)]">
                  {step.description}
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
