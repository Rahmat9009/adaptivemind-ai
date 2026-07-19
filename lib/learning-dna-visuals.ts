import type { LearningDimension, LearningScores } from "@/lib/learning-dna";

/**
 * Single source of truth for the Learning DNA visual identity.
 * Colors map 1:1 to the CSS custom properties in globals.css.
 */
export const dnaHex: Record<LearningDimension, string> = {
  visual: "#2dd4bf",
  examples: "#fbbf24",
  analogies: "#a78bfa",
  stories: "#fb7185",
  challenges: "#ff6b5b",
};

export const dnaHexSoft: Record<LearningDimension, string> = {
  visual: "#5eead4",
  examples: "#fcd34d",
  analogies: "#c4b5fd",
  stories: "#fda4af",
  challenges: "#ff8a7e",
};

/**
 * 3D constellation node positions — arranged as a loose, asymmetric network
 * (not a perfect polygon) to feel organic and "alive".
 */
export const dnaPositions: Record<LearningDimension, [number, number, number]> = {
  visual: [-1.5, 0.9, 0.2],
  examples: [1.35, 1.05, -0.3],
  analogies: [1.7, -0.65, 0.35],
  stories: [-0.5, -1.3, -0.2],
  challenges: [-1.8, -0.55, 0.28],
};

/**
 * 2D projection percentages (for the static SVG fallback and overlaid labels).
 * Match dnaPositions roughly — these are the same nodes seen from the front.
 */
export const dnaProjection2D: Record<LearningDimension, { x: number; y: number }> = {
  visual: { x: 22, y: 22 },
  examples: { x: 74, y: 28 },
  analogies: { x: 80, y: 70 },
  stories: { x: 42, y: 84 },
  challenges: { x: 14, y: 62 },
};

export function getConstellationRadius(scores: LearningScores, dimension: LearningDimension): number {
  return 0.14 + (scores[dimension] / 100) * 0.22;
}

/** Edges of the network — every node connects to two others, forming a ring with diagonals. */
export const dnaEdges: ReadonlyArray<[LearningDimension, LearningDimension]> = [
  ["visual", "examples"],
  ["examples", "analogies"],
  ["analogies", "stories"],
  ["stories", "challenges"],
  ["challenges", "visual"],
  ["visual", "analogies"],
  ["examples", "stories"],
];

/** Map any dimension to its theme color classes (Tailwind v4 arbitrary values via CSS vars) */
export const dnaVar: Record<LearningDimension, string> = {
  visual: "var(--color-dna-visual)",
  examples: "var(--color-dna-examples)",
  analogies: "var(--color-dna-analogies)",
  stories: "var(--color-dna-stories)",
  challenges: "var(--color-dna-challenges)",
};
