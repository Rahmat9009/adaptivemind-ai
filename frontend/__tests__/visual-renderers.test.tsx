import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VisualLessonEngine } from "@/components/visuals/VisualLessonEngine";
import type {
  VisualLessonData,
  VisualLessonType,
} from "@/lib/visual-schema";

const steps = [
  {
    id: "first",
    label: "First stage",
    description: "The process begins.",
    x: 20,
    y: 50,
  },
  {
    id: "second",
    label: "Second stage",
    description: "The process changes.",
    x: 50,
    y: 25,
  },
  {
    id: "third",
    label: "Third stage",
    description: "The process finishes.",
    x: 80,
    y: 60,
  },
];

function createVisual(type: VisualLessonType): VisualLessonData {
  const visual: VisualLessonData = {
    type,
    title: `Rendered ${type}`,
    summary: "A bounded visual summary.",
    steps,
    connections: [
      { from: "first", to: "second" },
      { from: "second", to: "third" },
    ],
    columns: [],
    series: [],
    captions: ["Begin.", "Change.", "Finish."],
    predictionCheckpoints: [],
    textAlternative: "First, the process begins. Then it changes and finishes.",
  };

  if (type === "comparison") {
    return {
      ...visual,
      steps: [],
      connections: [],
      columns: [
        { label: "Option A", items: ["First characteristic"] },
        { label: "Option B", items: ["Second characteristic"] },
      ],
    };
  }
  if (type === "graph") {
    return {
      ...visual,
      steps: [],
      connections: [],
      xAxisLabel: "Input",
      yAxisLabel: "Output",
      series: [{
        label: "Relationship",
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 4 },
        ],
      }],
    };
  }
  if (type === "simulation") {
    return {
      ...visual,
      steps: [],
      connections: [],
      simulation: {
        inputLabel: "Time",
        outputLabel: "Distance",
        min: 0,
        max: 10,
        step: 1,
        initial: 2,
        unit: "s",
        formula: "linear",
        coefficient: 3,
        offset: 0,
      },
    };
  }
  return visual;
}

describe("visual lesson renderers", () => {
  it.each([
    "process",
    "cycle",
    "timeline",
    "comparison",
    "flowchart",
    "graph",
    "labeled-diagram",
    "step-sequence",
    "cause-effect",
    "simulation",
  ] satisfies VisualLessonType[])("renders %s without browser APIs", (type) => {
    const visual = createVisual(type);
    const markup = renderToStaticMarkup(
      <VisualLessonEngine visual={visual} />,
    );
    expect(markup).toContain(`Rendered ${type}`);
    expect(markup).toContain("Full text alternative");
  });

  it("escapes visual labels instead of rendering provider markup", () => {
    const visual = createVisual("process");
    visual.steps[0] = {
      ...visual.steps[0],
      label: "<img src=x onerror=alert(1)>",
    };
    const markup = renderToStaticMarkup(
      <VisualLessonEngine visual={visual} />,
    );
    expect(markup).not.toContain("<img src=x");
    expect(markup).toContain("&lt;img");
  });
});
