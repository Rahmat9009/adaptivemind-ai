import type { VisualLessonData } from "@/lib/visual-schema";

export interface VisualRendererProps {
  visual: VisualLessonData;
  activeStep: number;
  interactive: boolean;
  onSelectStep: (index: number) => void;
}

export const visualPalette = [
  "#1751EF",
  "#0891B2",
  "#B45309",
  "#15803D",
  "#BE185D",
  "#7C3AED",
  "#C2410C",
  "#0F766E",
] as const;

export function visualColor(index: number): string {
  return visualPalette[index % visualPalette.length];
}

export function clampActiveIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), Math.max(length - 1, 0));
}
