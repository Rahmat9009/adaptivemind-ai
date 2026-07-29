import { describe, expect, it } from "vitest";
import { buildTutorSystemPrompt } from "@/lib/adaptive-prompt";
import {
  parseTutorRequest,
  tutorLessonSchema,
  visualLessonSchema,
} from "@/lib/server/ada/schemas";
import { inspectProviderJson } from "@/lib/server/ada/validation";

const scores = {
  visual: 70,
  examples: 50,
  analogies: 40,
  stories: 30,
  challenges: 60,
};

const processVisual = {
  type: "process",
  title: "A general process",
  summary: "The output of one stage becomes the input to the next.",
  steps: [
    { id: "input", label: "Input", description: "Begin with the input." },
    { id: "transform", label: "Transform", description: "Change the input." },
    { id: "output", label: "Output", description: "Observe the result." },
  ],
  connections: [
    { from: "input", to: "transform" },
    { from: "transform", to: "output" },
  ],
  columns: [],
  series: [],
  captions: ["Start.", "Transform.", "Finish."],
  predictionCheckpoints: [
    { stepId: "transform", question: "What should happen next?" },
  ],
  textAlternative: "Input moves through a transformation to create an output.",
};

describe("structured visual lesson validation", () => {
  it("accepts a bounded process and a lesson containing it", () => {
    expect(visualLessonSchema.safeParse(processVisual).success).toBe(true);
    expect(tutorLessonSchema.safeParse({
      title: "General process",
      coreIdea: "Processes connect stages.",
      explanation: "Follow each stage in order.",
      keyPoints: ["Inputs change.", "Outputs follow."],
      checkQuestion: "Which stage changes the input?",
      stylesUsed: ["visual"],
      visual: processVisual,
    }).success).toBe(true);
  });

  it("rejects duplicate IDs and dangling connections", () => {
    expect(visualLessonSchema.safeParse({
      ...processVisual,
      steps: [
        processVisual.steps[0],
        { ...processVisual.steps[1], id: "input" },
      ],
      connections: [],
      predictionCheckpoints: [],
    }).success).toBe(false);

    expect(visualLessonSchema.safeParse({
      ...processVisual,
      connections: [{ from: "input", to: "missing-node" }],
    }).success).toBe(false);
  });

  it("requires coordinates for every labeled-diagram node", () => {
    expect(visualLessonSchema.safeParse({
      ...processVisual,
      type: "labeled-diagram",
    }).success).toBe(false);

    expect(visualLessonSchema.safeParse({
      ...processVisual,
      type: "labeled-diagram",
      steps: processVisual.steps.map((step, index) => ({
        ...step,
        x: 20 + index * 30,
        y: 50,
      })),
    }).success).toBe(true);
  });

  it("requires real comparison columns and graph series", () => {
    expect(visualLessonSchema.safeParse({
      ...processVisual,
      type: "comparison",
      steps: [],
      connections: [],
      columns: [{ label: "Only one", items: ["A single side"] }],
      predictionCheckpoints: [],
    }).success).toBe(false);

    expect(visualLessonSchema.safeParse({
      ...processVisual,
      type: "graph",
      steps: [],
      connections: [],
      series: [],
      predictionCheckpoints: [],
    }).success).toBe(false);
  });

  it("rejects inconsistent or singular simulation bounds", () => {
    const simulation = {
      inputLabel: "Input",
      outputLabel: "Output",
      min: -1,
      max: 1,
      step: 0.1,
      initial: 0.5,
      formula: "inverse",
      coefficient: 1,
      offset: 0,
    };
    expect(visualLessonSchema.safeParse({
      ...processVisual,
      type: "simulation",
      steps: [],
      connections: [],
      predictionCheckpoints: [],
      simulation,
    }).success).toBe(false);

    expect(visualLessonSchema.safeParse({
      ...processVisual,
      type: "simulation",
      steps: [],
      connections: [],
      predictionCheckpoints: [],
      simulation: {
        ...simulation,
        min: 1,
        max: 10,
        initial: 3,
      },
    }).success).toBe(true);
  });

  it("reports bounded schema paths without echoing rejected values", () => {
    const inspection = inspectProviderJson(
      JSON.stringify({
        ...processVisual,
        connections: [{ from: "input", to: "private-value" }],
      }),
      visualLessonSchema,
    );
    expect(inspection.data).toBeNull();
    expect(inspection.issues.join(" ")).toContain("connections.0");
    expect(inspection.issues.join(" ")).not.toContain("private-value");
    expect(inspection.issues.length).toBeLessThanOrEqual(10);
  });
});

describe("visual generation action", () => {
  it("accepts visualize for an arbitrary educational topic", () => {
    const result = parseTutorRequest({
      requestId: "visual-request-123",
      topic: "How a compiler parses source code",
      subject: "Computer science",
      level: "Intermediate",
      scores,
      action: "visualize",
      teachingMode: "visual",
    });
    expect(result.success).toBe(true);
  });

  it("asks the provider for schema data rather than executable drawing code", () => {
    const prompt = buildTutorSystemPrompt({
      topic: "How a compiler parses source code",
      subject: "Computer science",
      level: "Intermediate",
      scores,
      action: "visualize",
      teachingMode: "visual",
    });
    expect(prompt).toContain("visual object is required");
    expect(prompt).toContain(
      "Never return HTML, SVG markup, CSS, JavaScript",
    );
    expect(prompt).toContain('"type": "process|cycle|timeline');
  });
});
