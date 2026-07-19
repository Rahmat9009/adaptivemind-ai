import { learningDimensionLabels, learningDimensions, type LearningScores } from "@/lib/learning-dna";

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

export function SceneFallback({ scores, compact = false }: { scores: LearningScores; compact?: boolean }) {
  return (
    <div
      className="relative min-h-80 overflow-hidden rounded-[var(--am-radius-2xl)]"
      style={{
        background: "linear-gradient(145deg, #080c1b 0%, #0e1428 50%, #0a0f20 100%)",
      }}
      aria-label="Learning DNA constellation — visual representation of your learning preferences"
    >
      {/* Atmospheric glow */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(80,70,229,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(139,92,246,0.1) 0%, transparent 50%)",
        }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {connectionPairs.map(([from, to]) => {
          const fromPos = positions[from];
          const toPos = positions[to];
          if (!fromPos || !toPos) return null;
          return (
            <line
              key={`${from}-${to}`}
              x1={`${fromPos.left}%`}
              y1={`${fromPos.top}%`}
              x2={`${toPos.left}%`}
              y2={`${toPos.top}%`}
              stroke={dnaColors[from]}
              strokeWidth="0.5"
              opacity={0.25}
              strokeDasharray={compact ? "" : "3 3"}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {learningDimensions.map((dimension) => {
        const pos = positions[dimension];
        if (!pos) return null;
        return (
          <div
            key={dimension}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            <div
              className="rounded-full border-2 border-white/30"
              style={{
                width: `${Math.max(12, 10 + scores[dimension] / 6)}px`,
                height: `${Math.max(12, 10 + scores[dimension] / 6)}px`,
                backgroundColor: dnaColors[dimension],
                boxShadow: `0 0 16px ${dnaColors[dimension]}44, 0 0 48px ${dnaColors[dimension]}22`,
              }}
            />
            {!compact && (
              <span className="whitespace-nowrap rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                {learningDimensionLabels[dimension]} {scores[dimension]}%
              </span>
            )}
          </div>
        );
      })}

      {/* Center ambient DOT */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <div
          className="h-1 w-1 rounded-full opacity-40"
          style={{ backgroundColor: "#5046e5", boxShadow: "0 0 20px #5046e5, 0 0 60px #5046e544" }}
        />
      </div>

      {/* Screen-reader text */}
      {!compact && (
        <div className="sr-only">
          <p>Learning DNA profile scores:</p>
          <ul>
            {learningDimensions.map((dim) => (
              <li key={dim}>
                {learningDimensionLabels[dim]}: {scores[dim]}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
