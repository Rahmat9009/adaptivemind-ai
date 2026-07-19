import { learningDimensionLabels, learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";

interface SceneFallbackProps {
  scores: LearningScores;
  compact?: boolean;
  activeDimension?: LearningDimension;
}

const positions: Record<string, { left: number; top: number }> = {
  visual: { left: 18, top: 20 },
  examples: { left: 72, top: 22 },
  analogies: { left: 82, top: 70 },
  stories: { left: 42, top: 82 },
  challenges: { left: 12, top: 68 },
};

const connectionPairs = [
  ["visual", "examples"],
  ["examples", "analogies"],
  ["analogies", "stories"],
  ["stories", "challenges"],
  ["challenges", "visual"],
  ["visual", "analogies"],
  ["examples", "stories"],
];

const dnaColors: Record<string, string> = {
  visual: "#22d3ee",
  examples: "#f59e0b",
  analogies: "#8b5cf6",
  stories: "#fb7185",
  challenges: "#fb6a4a",
};

function getRadius(score: number) {
  return Math.max(10, 8 + score / 5);
}

export function SceneFallback({ scores, compact = false, activeDimension }: SceneFallbackProps) {
  return (
    <div
      className="relative min-h-80 overflow-hidden rounded-[var(--am-radius-2xl)]"
      style={{
        background: "radial-gradient(ellipse at 30% 20%, rgba(80,70,229,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.08) 0%, transparent 50%), linear-gradient(145deg, #080c1b 0%, #0e1428 50%, #0a0f20 100%)",
      }}
      role="figure"
      aria-label={`Learning DNA constellation — ${learningDimensions.map(d => `${learningDimensionLabels[d]}: ${scores[d]}%`).join(", ")}`}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Connection lines SVG */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <filter id="glow-svg">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {connectionPairs.map(([from, to]) => {
          const fromPos = positions[from];
          const toPos = positions[to];
          if (!fromPos || !toPos) return null;
          const isActive = activeDimension === from || activeDimension === to;
          return (
            <line
              key={`${from}-${to}`}
              x1={`${fromPos.left}%`}
              y1={`${fromPos.top}%`}
              x2={`${toPos.left}%`}
              y2={`${toPos.top}%`}
              stroke={dnaColors[from]}
              strokeWidth={isActive ? "1.2" : "0.5"}
              opacity={isActive ? 0.5 : 0.2}
              strokeDasharray={compact ? "" : "3 4"}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {learningDimensions.map((dimension) => {
        const pos = positions[dimension];
        if (!pos) return null;
        const isActive = activeDimension === dimension;
        const score = scores[dimension];
        const radius = getRadius(score);
        const color = dnaColors[dimension];

        return (
          <div
            key={dimension}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            {/* Active ring */}
            {isActive && (
              <div
                className="absolute rounded-full animate-pulse"
                style={{
                  width: radius + 10,
                  height: radius + 10,
                  border: `2px solid ${color}`,
                  opacity: 0.4,
                }}
              />
            )}
            {/* Core node */}
            <div
              className="rounded-full border-2"
              style={{
                width: radius,
                height: radius,
                backgroundColor: color,
                borderColor: isActive ? color : "rgba(255,255,255,0.2)",
                boxShadow: `0 0 ${isActive ? 20 : 12}px ${color}44, 0 0 ${isActive ? 60 : 30}px ${color}22`,
              }}
            />
            {!compact && (
              <span className="whitespace-nowrap rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                {learningDimensionLabels[dimension]} {score}%
              </span>
            )}
          </div>
        );
      })}

      {/* Center ambient glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
        <div className="h-1 w-1 rounded-full opacity-30" style={{ backgroundColor: "#5046e5", boxShadow: "0 0 20px #5046e5, 0 0 60px #5046e544" }} />
      </div>

      {/* Screen-reader accessible data */}
      <div className="sr-only">
        <p>Learning DNA profile:</p>
        <ul>
          {learningDimensions.map((dim) => (
            <li key={dim}>
              {learningDimensionLabels[dim]}: {scores[dim]}%
              {activeDimension === dim ? " (active)" : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
