"use client";

import type { VisualRendererProps } from "./types";
import { visualColor } from "./types";

const width = 640;
const height = 360;
const padding = 52;

function formatValue(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 10_000 || (absolute > 0 && absolute < 0.01)) {
    return value.toExponential(1);
  }
  return Number(value.toFixed(2)).toString();
}

export function GraphVisual({
  visual,
  activeStep,
}: VisualRendererProps) {
  const allPoints = visual.series.flatMap((series) => series.points);
  const xValues = allPoints.map((point) => point.x);
  const yValues = allPoints.map((point) => point.y);
  let minX = Math.min(...xValues);
  let maxX = Math.max(...xValues);
  let minY = Math.min(...yValues);
  let maxY = Math.max(...yValues);
  if (minX === maxX) {
    minX -= 1;
    maxX += 1;
  }
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }

  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const scaleX = (value: number) =>
    padding + ((value - minX) / (maxX - minX)) * plotWidth;
  const scaleY = (value: number) =>
    height - padding - ((value - minY) / (maxY - minY)) * plotHeight;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby="graph-title graph-description"
        className="aspect-[16/9] w-full"
      >
        <title id="graph-title">{visual.title}</title>
        <desc id="graph-description">{visual.textAlternative}</desc>
        <rect
          x={padding}
          y={padding}
          width={plotWidth}
          height={plotHeight}
          fill="#F7F5F2"
        />
        {[0, 1, 2, 3, 4].map((tick) => {
          const x = padding + (plotWidth * tick) / 4;
          const y = padding + (plotHeight * tick) / 4;
          return (
            <g key={tick}>
              <line
                x1={x}
                y1={padding}
                x2={x}
                y2={height - padding}
                stroke="#E2DFDA"
              />
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#E2DFDA"
              />
            </g>
          );
        })}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#6F6A63"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#6F6A63"
          strokeWidth="2"
        />
        <text x={padding} y={height - 20} fill="#6F6A63" fontSize="13">
          {formatValue(minX)}
        </text>
        <text
          x={width - padding}
          y={height - 20}
          textAnchor="end"
          fill="#6F6A63"
          fontSize="13"
        >
          {formatValue(maxX)}
        </text>
        {visual.xAxisLabel && (
          <text
            x={width / 2}
            y={height - 12}
            textAnchor="middle"
            fill="#24211D"
            fontSize="14"
            fontWeight="600"
          >
            {visual.xAxisLabel}
          </text>
        )}
        {visual.yAxisLabel && (
          <text
            x="16"
            y={height / 2}
            textAnchor="middle"
            fill="#24211D"
            fontSize="14"
            fontWeight="600"
            transform={`rotate(-90 16 ${height / 2})`}
          >
            {visual.yAxisLabel}
          </text>
        )}
        <text
          x={padding - 10}
          y={height - padding}
          textAnchor="end"
          fill="#6F6A63"
          fontSize="13"
        >
          {formatValue(minY)}
        </text>
        <text
          x={padding - 10}
          y={padding + 5}
          textAnchor="end"
          fill="#6F6A63"
          fontSize="13"
        >
          {formatValue(maxY)}
        </text>
        {visual.series.map((series, seriesIndex) => {
          const visiblePoints = series.points.slice(
            0,
            Math.min(activeStep + 1, series.points.length),
          );
          return (
            <g key={series.label}>
              <polyline
                points={visiblePoints
                  .map((point) => `${scaleX(point.x)},${scaleY(point.y)}`)
                  .join(" ")}
                fill="none"
                stroke={visualColor(seriesIndex)}
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {visiblePoints.map((point, pointIndex) => (
                <circle
                  key={`${point.x}-${point.y}-${pointIndex}`}
                  cx={scaleX(point.x)}
                  cy={scaleY(point.y)}
                  r={pointIndex === visiblePoints.length - 1 ? 6 : 4}
                  fill={visualColor(seriesIndex)}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                >
                  <title>
                    {point.label
                      ? `${point.label}: `
                      : ""}
                    x {formatValue(point.x)}, y {formatValue(point.y)}
                  </title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2" aria-label="Graph legend">
        {visual.series.map((series, index) => (
          <li
            key={series.label}
            className="flex items-center gap-2 text-xs font-medium text-[var(--am-text-secondary)]"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: visualColor(index) }}
              aria-hidden="true"
            />
            {series.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
