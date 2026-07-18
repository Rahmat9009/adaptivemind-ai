import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import { learningDimensionLabels } from "@/lib/learning-dna";
import type { TutorLesson, TutorRequest } from "./types";

interface DemoTopic {
  title: string;
  coreIdea: string;
  explanation: string;
  example: string;
  analogy: string;
  keyPoints: string[];
  checkQuestion: string;
}

const demoTopics: Record<string, DemoTopic> = {
  photosynthesis: {
    title: "Photosynthesis",
    coreIdea: "Photosynthesis is how plants use light energy to make sugar from water and carbon dioxide.",
    explanation: "Inside a leaf, chlorophyll captures sunlight. That energy helps the plant rearrange water and carbon dioxide into glucose, a stored form of food. Oxygen is released as part of the process.",
    example: "A houseplant near a bright window has more usable light than one in a dark corner, so it has more energy available to make food.",
    analogy: "Think of a leaf as a small solar-powered kitchen: sunlight is the power, water and carbon dioxide are the ingredients, and glucose is the meal it prepares.",
    keyPoints: ["Light supplies energy.", "Plants combine water and carbon dioxide.", "Glucose stores energy and oxygen is released."],
    checkQuestion: "If a plant receives less light for several days, which part of photosynthesis is affected first?",
  },
  "newton's first law": {
    title: "Newton's First Law",
    coreIdea: "An object keeps its current motion unless an unbalanced force changes it.",
    explanation: "A still object stays still, and a moving object keeps moving at the same speed and direction unless a force such as friction, a push, or gravity acts on it. This tendency is called inertia.",
    example: "When a bus stops suddenly, your body keeps moving forward because it was already in motion. The seat belt provides the force that changes that motion.",
    analogy: "It is like a shopping cart: it does not start rolling by itself, and once it is rolling it will keep going until friction or a person changes what it is doing.",
    keyPoints: ["Motion does not need a force to continue.", "A force is needed to change motion.", "Inertia describes resistance to change."],
    checkQuestion: "Why does a hockey puck slow down much more gradually on ice than a ball on grass?",
  },
  "pythagorean theorem": {
    title: "The Pythagorean Theorem",
    coreIdea: "In a right triangle, the squares of the two shorter sides add up to the square of the longest side.",
    explanation: "For a right triangle with shorter sides a and b and longest side c, the relationship is a² + b² = c². It lets you find a missing side when you know the other two.",
    example: "A 3-4-5 triangle works because 3² + 4² equals 9 + 16, which equals 25, or 5².",
    analogy: "Imagine drawing a square on each side of a right triangle. The area of the two smaller squares fits exactly into the area of the largest square.",
    keyPoints: ["It applies only to right triangles.", "The hypotenuse is the longest side.", "Use squared lengths before taking a square root."],
    checkQuestion: "A right triangle has sides 5 and 12. What calculation would you use to find its hypotenuse?",
  },
};

function findDemoTopic(topic: string): DemoTopic | null {
  const normalized = topic.toLowerCase().replace(/[.?!]/g, "").trim();
  if (normalized.includes("photosynthesis")) return demoTopics.photosynthesis;
  if (normalized.includes("newton") && normalized.includes("first")) return demoTopics["newton's first law"];
  if (normalized.includes("pythagorean")) return demoTopics["pythagorean theorem"];
  return null;
}

export function createDemoLesson(request: TutorRequest): TutorLesson | null {
  const topic = findDemoTopic(request.topic);
  if (!topic) return null;

  const profile = buildTeachingProfile(request.scores);
  const alternateStyles = [profile.dominantDimensions[2], profile.dominantDimensions[3]];
  const stylesUsed = request.action === "different"
    ? alternateStyles
    : [profile.primaryDimension, profile.secondaryDimension];
  const alternatePrimary = learningDimensionLabels[alternateStyles[0]].toLowerCase();
  const alternateSecondary = learningDimensionLabels[alternateStyles[1]].toLowerCase();
  const actionAdditions = {
    initial: "",
    simpler: " Here is the short version: focus on the main relationship first, then add details one at a time.",
    different: ` This time, approach it through ${alternatePrimary} and ${alternateSecondary} rather than repeating the same path.`,
    example: ` Let us keep the focus on this concrete example, then connect it back to the main idea.`,
    challenge: " Start by making a prediction before you read the explanation, then use the check below to test your reasoning.",
  } as const;

  return {
    ...topic,
    explanation: `${topic.explanation}${actionAdditions[request.action]}`,
    example: stylesUsed.includes("examples") || request.action === "example" ? topic.example : undefined,
    analogy: stylesUsed.includes("analogies") ? topic.analogy : undefined,
    checkQuestion: request.action === "challenge"
      ? `Challenge: ${topic.checkQuestion} Work it out before checking any notes.`
      : topic.checkQuestion,
    stylesUsed,
  };
}
