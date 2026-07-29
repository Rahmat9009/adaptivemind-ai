import type { LearningDimension, LearningScores } from "@/lib/learning-dna";

export const learningDNAVisuals: Record<LearningDimension, { color: string; position: [number, number, number]; shape: "orb" | "diamond" }> = {
  visual: { color: "#0891B2", position: [-1.55, 0.75, 0.15], shape: "orb" },
  examples: { color: "#B45309", position: [1.25, 0.9, -0.25], shape: "diamond" },
  analogies: { color: "#7C3AED", position: [1.65, -0.7, 0.3], shape: "orb" },
  stories: { color: "#BE185D", position: [-0.45, -1.25, -0.18], shape: "diamond" },
  challenges: { color: "#DC2626", position: [-1.75, -0.55, 0.25], shape: "orb" },
};

export function getConstellationRadius(scores: LearningScores, dimension: LearningDimension): number {
  return 0.16 + scores[dimension] / 440;
}
