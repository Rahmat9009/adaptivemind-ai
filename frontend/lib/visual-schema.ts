export type VisualLessonType =
  | "process"
  | "cycle"
  | "timeline"
  | "comparison"
  | "flowchart"
  | "graph"
  | "labeled-diagram"
  | "step-sequence"
  | "cause-effect"
  | "simulation";

export interface VisualStep {
  id: string;
  label: string;
  description: string;
  x?: number;
  y?: number;
  group?: string;
}

export interface VisualConnection {
  from: string;
  to: string;
  label?: string;
}

export interface VisualComparisonColumn {
  label: string;
  items: string[];
}

export interface VisualGraphPoint {
  x: number;
  y: number;
  label?: string;
}

export interface VisualGraphSeries {
  label: string;
  points: VisualGraphPoint[];
}

export interface VisualPredictionCheckpoint {
  stepId: string;
  question: string;
}

export interface VisualSimulation {
  inputLabel: string;
  outputLabel: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  unit?: string;
  formula: "linear" | "inverse" | "quadratic";
  coefficient: number;
  offset: number;
}

export interface VisualLessonData {
  type: VisualLessonType;
  title: string;
  summary: string;
  steps: VisualStep[];
  connections: VisualConnection[];
  columns: VisualComparisonColumn[];
  series: VisualGraphSeries[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  captions: string[];
  predictionCheckpoints: VisualPredictionCheckpoint[];
  simulation?: VisualSimulation;
  textAlternative: string;
}
