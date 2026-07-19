import { learningDimensionLabels, learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { dnaHex, dnaProjection2D } from "@/lib/learning-dna-visuals";

const edges: ReadonlyArray<[LearningDimension, LearningDimension]> = [
  ["visual", "examples"],
  ["examples", "analogies"],
  ["analogies", "stories"],
  ["stories", "challenges"],
  ["challenges", "visual"],
  ["visual", "analogies"],
  ["examples", "stories"],
];

/**
 * Static, accessible 2D projection of the constellation.
 * Renders the same five-node network as the 3D scene, drawn as an SVG.
 * Used as a WebGL fallback and under prefers-reduced-motion.
 */
export function SceneFallback({
  scores,
  activeDimension,
  compact = false,
}: {
  scores: LearningScores;
  activeDimension?: LearningDimension;
  compact?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label={`Learning DNA constellation. ${learningDimensions
        .map((d) => `${learningDimensionLabels[d]} ${scores[d]} percent`)
        .join(". ")}.`}
    >
      <defs>
        <radialGradient id="dna-fallback-bg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#141b3a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#070b18" stopOpacity="0" />
        </radialGradient>
        {learningDimensions.map((d) => (
          <radialGradient id={`dna-node-${d}`} key={d} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={dnaHex[d]} stopOpacity="1" />
            <stop offset="100%" stopColor={dnaHex[d]} stopOpacity="0.55" />
          </radialGradient>
        ))}
      </defs>

      <rect x="0" y="0" width="100" height="100" fill="url(#dna-fallback-bg)" />

      {/* edges */}
      {edges.map(([a, b], i) => {
        const pa = dnaProjection2D[a];
        const pb = dnaProjection2D[b];
        const isActive = activeDimension === a || activeDimension === b;
        return (
          <line
            key={i}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={isActive ? "#c4caed" : "#5a6498"}
            strokeWidth={isActive ? 0.45 : 0.28}
            strokeOpacity={isActive ? 0.7 : 0.35}
          />
        );
      })}

      {/* nodes */}
      {learningDimensions.map((d) => {
        const p = dnaProjection2D[d];
        const isActive = activeDimension === d;
        const baseR = compact ? 1.6 : 2.4;
        const r = baseR + (scores[d] / 100) * (compact ? 1.1 : 1.7) + (isActive ? 0.7 : 0);
        return (
          <g key={d}>
            {isActive ? <circle cx={p.x} cy={p.y} r={r + 1.8} fill={dnaHex[d]} opacity={0.18} /> : null}
            <circle cx={p.x} cy={p.y} r={r} fill={`url(#dna-node-${d})`} />
            {!compact ? (
              <text
                x={p.x}
                y={p.y + r + 3.2}
                textAnchor="middle"
                fontSize="2.6"
                fill="#c4caed"
                fontWeight="500"
                opacity={isActive ? 0.95 : 0.55}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {scores[d]}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
