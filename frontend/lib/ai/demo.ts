import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import { learningDimensionLabels, type LearningDimension } from "@/lib/learning-dna";
import type { TeachingMode, TutorFollowUpResponse, TutorLesson, TutorRequest, UnderstandingEvaluation, ExplainBackEvaluation, HintResponse } from "./types";
import type { VisualLessonData } from "@/lib/visual-schema";

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

const teachingModeDimensions: Record<Exclude<TeachingMode, "adaptive">, LearningDimension> = {
  visual: "visual",
  example: "examples",
  analogy: "analogies",
  story: "stories",
  challenge: "challenges",
};

function getBaseStyles(request: TutorRequest, profile: ReturnType<typeof buildTeachingProfile>): LearningDimension[] {
  if (request.teachingMode === "adaptive") {
    return [profile.primaryDimension, profile.secondaryDimension];
  }
  return [teachingModeDimensions[request.teachingMode]];
}

function getDifferentStyles(request: TutorRequest, profile: ReturnType<typeof buildTeachingProfile>): LearningDimension[] {
  const previousStyles = new Set(request.previousStyles ?? []);
  const previousModeDimension = request.previousTeachingMode && request.previousTeachingMode !== "adaptive"
    ? teachingModeDimensions[request.previousTeachingMode]
    : undefined;
  const alternatives = profile.dominantDimensions.filter((dimension) => dimension !== previousModeDimension && !previousStyles.has(dimension));
  const fallback = profile.dominantDimensions.filter((dimension) => dimension !== previousModeDimension);
  return (alternatives.length >= 2 ? alternatives : fallback).slice(0, 2);
}

function getReframedExplanation(topic: DemoTopic, styles: LearningDimension[]): string {
  const primaryStyle = styles[0];
  if (primaryStyle === "analogies") return `${topic.analogy} The comparison is useful because it preserves the same relationship without repeating the original explanation.`;
  if (primaryStyle === "stories") return `Picture a short moment where this idea matters: a situation changes, the concept explains why, and the outcome makes the rule easier to remember. ${topic.coreIdea}`;
  if (primaryStyle === "visual") return `Visual structure: first identify the inputs or starting conditions. Next trace the change. Finally notice the outcome. ${topic.coreIdea}`;
  if (primaryStyle === "challenges") return `Before reading further, make a prediction about what should happen. Then test that prediction against this core idea: ${topic.coreIdea}`;
  return `Start with a real situation, identify the important detail, and then connect it to the rule: ${topic.example}`;
}

function createDemoVisual(topic: DemoTopic): VisualLessonData {
  const steps = topic.keyPoints.slice(0, 5).map((description, index) => ({
    id: `step-${index + 1}`,
    label: `Step ${index + 1}`,
    description,
  }));
  return {
    type: "step-sequence",
    title: `${topic.title}: visual sequence`,
    summary: topic.coreIdea,
    steps,
    connections: steps.slice(1).map((step, index) => ({
      from: steps[index].id,
      to: step.id,
    })),
    columns: [],
    series: [],
    captions: steps.map((step) => step.description),
    predictionCheckpoints: [],
    textAlternative: [
      topic.coreIdea,
      ...steps.map((step) => `${step.label}: ${step.description}`),
    ].join(" "),
  };
}

export function createDemoLesson(request: TutorRequest): TutorLesson | null {
  const topic = findDemoTopic(request.topic);
  if (!topic) return null;

  const profile = buildTeachingProfile(request.scores);
  const baseStyles = getBaseStyles(request, profile);

  if (request.action === "visualize") {
    return {
      title: `${topic.title}: visual explanation`,
      coreIdea: topic.coreIdea,
      explanation: "Use the sequence to trace how each part connects to the next.",
      keyPoints: topic.keyPoints.slice(0, 5),
      checkQuestion: topic.checkQuestion,
      stylesUsed: ["visual"],
      visual: createDemoVisual(topic),
    };
  }

  if (request.action === "simpler") {
    return {
      title: `${topic.title}: the short version`,
      coreIdea: topic.coreIdea,
      explanation: `${topic.coreIdea} Think of the main change first. Then add the details only when you need them.`,
      example: topic.example,
      keyPoints: topic.keyPoints.slice(0, 3),
      checkQuestion: `In one sentence, what is the main idea behind ${topic.title}?`,
      stylesUsed: baseStyles,
    };
  }

  if (request.action === "example") {
    return {
      title: `${topic.title}: worked example`,
      coreIdea: topic.coreIdea,
      explanation: `Step 1: identify the situation. Step 2: notice the important change or relationship. Step 3: connect that observation back to the core idea.`,
      example: `Worked example: ${topic.example}`,
      keyPoints: ["Start with the real situation.", "Name the important relationship.", "Use the concept to explain what happens."],
      checkQuestion: "Which step in the example best shows the core idea?",
      practicePrompt: `Try a similar situation of your own: ${topic.checkQuestion}`,
      stylesUsed: baseStyles.includes("examples") ? baseStyles : ["examples", ...baseStyles],
    };
  }

  if (request.action === "challenge") {
    return {
      title: `${topic.title}: reasoning challenge`,
      coreIdea: topic.coreIdea,
      explanation: `Use this one idea as your scaffold: ${topic.coreIdea}`,
      keyPoints: ["Read the setup carefully.", "Make a prediction before choosing an answer."],
      checkQuestion: "What is your prediction, and what part of the core idea supports it?",
      challenge: topic.checkQuestion,
      hint: "Start by identifying what is changing and what force, input, or relationship could explain it.",
      stylesUsed: baseStyles.includes("challenges") ? baseStyles : ["challenges", ...baseStyles],
    };
  }

  if (request.action === "different") {
    const stylesUsed = getDifferentStyles(request, profile);
    return {
      title: `${topic.title}: a different lens`,
      coreIdea: topic.coreIdea,
      explanation: getReframedExplanation(topic, stylesUsed),
      analogy: stylesUsed.includes("analogies") ? topic.analogy : undefined,
      keyPoints: [`Reframed with ${learningDimensionLabels[stylesUsed[0]]}.`, `Supported by ${learningDimensionLabels[stylesUsed[1]]}.`, "Compare this approach with the previous lesson."],
      checkQuestion: "Which part of this new approach made the topic easier to see?",
      stylesUsed,
    };
  }

  return {
    ...topic,
    example: baseStyles.includes("examples") ? topic.example : undefined,
    analogy: baseStyles.includes("analogies") ? topic.analogy : undefined,
    stylesUsed: baseStyles,
    visual:
      request.teachingMode === "visual"
        ? createDemoVisual(topic)
        : undefined,
  };
}

function getFollowUpStyles(request: TutorRequest): LearningDimension[] {
  const question = request.question?.toLowerCase() ?? "";
  if (question.includes("analogy")) return ["analogies"];
  if (question.includes("story")) return ["stories"];
  if (question.includes("example")) return ["examples"];
  if (question.includes("visual")) return ["visual"];
  if (question.includes("challenge") || question.includes("test")) return ["challenges"];
  return getBaseStyles(request, buildTeachingProfile(request.scores));
}

export function createDemoFollowUp(request: TutorRequest): TutorFollowUpResponse | null {
  const topic = findDemoTopic(request.topic);
  if (!topic || !request.question) return null;

  const question = request.question.toLowerCase();
  const stylesUsed = getFollowUpStyles(request);
  const wantsSimple = question.includes("simpler") || question.includes("still do not understand");
  const wantsExample = question.includes("example") || question.includes("football") || question.includes("worked");
  const wantsChallenge = question.includes("challenge") || question.includes("test");
  const wantsDifference = question.includes("different") || question.includes("comparison");

  if (topic.title === "Photosynthesis") {
    if (question.includes("night")) return { answer: "Photosynthesis needs light, so the light-dependent part stops at night. A plant still uses stored sugar through cellular respiration, which is a different process.", keyPoint: "Light is the energy source for photosynthesis.", checkQuestion: "Which process can continue at night: photosynthesis or cellular respiration?", stylesUsed };
    if (question.includes("why") || question.includes("sunlight")) return { answer: "Sunlight provides the energy that lets a plant turn water and carbon dioxide into glucose. Without that energy, the plant cannot make new sugar through photosynthesis.", analogy: question.includes("analogy") ? "It is like a solar-powered kitchen: without sunlight, the kitchen has ingredients but no power to cook." : undefined, stylesUsed };
    if (wantsExample) return { answer: "A plant near a sunny window receives the light energy it needs to make glucose. Moving it into a dark cupboard removes that energy source.", example: "Compare the same plant in bright light and in darkness for a day.", stylesUsed };
    if (wantsDifference) return { answer: "Photosynthesis stores energy by making glucose, while cellular respiration releases energy from glucose for the plant to use.", keyPoint: "One process builds sugar; the other breaks it down for usable energy.", stylesUsed };
    if (wantsChallenge) return { answer: "Use the core idea that light supplies energy for making glucose.", checkQuestion: "A plant has water and carbon dioxide but is kept in darkness. What ingredient is missing for photosynthesis?", stylesUsed };
  }

  if (topic.title === "Newton's First Law") {
    if (question.includes("passenger") || question.includes("car")) return { answer: "When the car stops, your body keeps moving forward for a moment because it was already moving. The seat belt supplies the force that changes your motion.", keyPoint: "Inertia resists a change in motion.", stylesUsed };
    if (question.includes("inertia") || wantsSimple) return { answer: "Inertia means objects resist changing what they are already doing. A still ball wants to stay still. A moving skateboard wants to keep moving until a force changes it.", example: "A seat belt is needed because your body keeps moving when a car stops.", stylesUsed };
    if (wantsExample) return { answer: "A football on the grass stays still until a player kicks it. After the kick, friction and air resistance gradually slow it down.", example: "The kick starts the motion; friction changes the motion later.", stylesUsed };
    if (wantsChallenge) return { answer: "Use the idea that motion changes only when an unbalanced force acts.", keyPoint: "Inertia helps predict the passenger's first movement.", checkQuestion: "A bus turns left. Which way does a standing passenger tend to move before holding on, and why?", stylesUsed };
  }

  if (topic.title === "The Pythagorean Theorem") {
    if (question.includes("hypotenuse")) return { answer: "The hypotenuse is the longest side of a right triangle. It always sits opposite the right angle.", keyPoint: "Find the 90-degree angle first; the side across from it is the hypotenuse.", stylesUsed };
    if (wantsExample) return { answer: "For sides 3 and 4, square each one: 3² is 9 and 4² is 16. Add them to get 25, then take the square root: the hypotenuse is 5.", example: "3² + 4² = 5².", stylesUsed };
    if (question.includes("not use") || question.includes("when can")) return { answer: "You can only use the Pythagorean theorem with a right triangle. If there is no 90-degree angle, this formula does not apply.", keyPoint: "Check for a right angle before using a² + b² = c².", stylesUsed };
    if (wantsChallenge) return { answer: "Identify the two shorter sides before calculating.", checkQuestion: "A right triangle has shorter sides 6 and 8. What equation would you write before finding the hypotenuse?", stylesUsed };
  }

  return { answer: "This follow-up needs the live AI provider.", stylesUsed };
}

export function createDemoEvaluation(request: TutorRequest): UnderstandingEvaluation | null {
  const topic = findDemoTopic(request.topic);
  const answer = request.learnerAnswer?.toLowerCase().trim() ?? "";
  if (!topic) return null;
  const stylesUsed = getFollowUpStyles(request);

  if (!answer || answer.includes("don’t know") || answer.includes("not sure")) {
    return {
      status: "uncertain", score: 20,
      feedback: "That is a useful place to pause. Start with one concrete clue, then try the question again.",
      whatWasUnderstood: [], needsReview: ["The core connection in this topic"],
      nextStep: "simplify", followUpQuestion: "What is one part of the idea you can name?",
      stylesUsed, evaluationConfidence: "high",
      evidenceFromAnswer: "Learner expressed uncertainty directly.",
    };
  }

  const correct = topic.title === "Photosynthesis"
    ? answer.includes("energy") && (answer.includes("glucose") || answer.includes("sugar"))
    : topic.title === "Newton’s First Law"
      ? answer.includes("inertia") || (answer.includes("keep") && answer.includes("moving"))
      : answer.includes("right triangle") || answer.includes("90");

  const misconception = topic.title === "Photosynthesis"
    ? answer.includes("sunlight is food")
    : topic.title === "Newton’s First Law"
      ? answer.includes("forward force") || answer.includes("force pushes")
      : answer.includes("every triangle") || answer.includes("all triangles");

  if (misconception) {
    return {
      status: "misconception", score: 25,
      feedback: "There is one important mix-up here. Let’s reset just that part with a concrete example.",
      whatWasUnderstood: [], needsReview: ["The condition that makes the rule work"],
      misconception: "The explanation applies the key idea too broadly.",
      nextStep: "example", stylesUsed, evaluationConfidence: "moderate",
      evidenceFromAnswer: "The answer contains a common misconception pattern.",
    };
  }

  if (correct) {
    return {
      status: "correct", score: 88,
      feedback: "Your reasoning identifies the key relationship. The next step is connecting it to a new situation.",
      whatWasUnderstood: ["The central idea"], needsReview: [],
      nextStep: "continue", followUpQuestion: "Can you apply that idea to one new example?",
      stylesUsed, evaluationConfidence: "high",
      evidenceFromAnswer: "Answer included key concept terms and correct relationship.",
    };
  }

  return {
    status: "partial", score: 58,
    feedback: "You are pointing toward the right idea, but one key link is still missing. Let’s clarify that part only.",
    whatWasUnderstood: ["Part of the main idea"], needsReview: ["How the parts connect"],
    nextStep: "clarify", stylesUsed, evaluationConfidence: "moderate",
    evidenceFromAnswer: "Partial understanding indicated by incomplete concept mapping.",
  };
}

// ──────────────────────────────────────
// Demo Explain Back
// ──────────────────────────────────────

export function createDemoExplainBack(request: {
  topic: string;
  learnerResponse: string;
  lessonContext: string;
  scores: import("@/lib/learning-dna").LearningScores;
  teachingMode: TeachingMode;
}): ExplainBackEvaluation | null {
  const topic = findDemoTopic(request.topic);
  const response = request.learnerResponse.toLowerCase().trim();
  if (!topic || !response) return null;

  const profile = buildTeachingProfile(request.scores);
  const stylesUsed: LearningDimension[] = [profile.primaryDimension];

  if (response.length < 20) {
    return {
      isComplete: false, understood: [], missing: [topic.coreIdea],
      score: 15, stylesUsed, aiConfidence: "high",
      followUpQuestion: "Can you try explaining in your own words what happens in this process?",
    };
  }

  const hasCoreIdea = response.includes(topic.coreIdea.split(" ").slice(0, 3).join(" ").toLowerCase());
  const hasDetail = topic.keyPoints.some((kp) => response.includes(kp.split(" ").slice(0, 2).join(" ").toLowerCase()));

  if (hasCoreIdea && hasDetail) {
    return {
      isComplete: true, understood: [topic.coreIdea, "Supporting details"], missing: [],
      score: 85, stylesUsed, aiConfidence: "high",
    };
  }

  if (hasCoreIdea) {
    return {
      isComplete: false, understood: [topic.coreIdea], missing: topic.keyPoints.slice(0, 2),
      score: 55, stylesUsed, aiConfidence: "moderate",
      followUpQuestion: "Good start! Can you add one more detail about how this works?",
    };
  }

  return {
    isComplete: false, understood: ["General awareness of the topic"],
    missing: [topic.coreIdea, ...topic.keyPoints.slice(0, 2)],
    score: 30, stylesUsed, aiConfidence: "moderate",
    misconception: "The explanation did not yet capture the core mechanism.",
    followUpQuestion: "What do you think is the main thing that happens in this process?",
  };
}

// ──────────────────────────────────────
// Demo Hints
// ──────────────────────────────────────

export function createDemoHint(request: {
  topic: string;
  currentLevel: number;
  scores: import("@/lib/learning-dna").LearningScores;
  teachingMode: TeachingMode;
}): HintResponse | null {
  const topic = findDemoTopic(request.topic);
  if (!topic) return null;

  const profile = buildTeachingProfile(request.scores);
  const stylesUsed: LearningDimension[] = [profile.primaryDimension];

  if (topic.title === "Photosynthesis") {
    return {
      hints: [
        "Think about what a plant needs from its environment to make food.",
        "Consider the role of light energy in the process.",
        "Water and carbon dioxide are combined using light energy to create glucose.",
        "Plants use chlorophyll to capture sunlight, which powers the conversion of water and CO₂ into glucose and oxygen.",
      ],
      stylesUsed,
    };
  }

  if (topic.title === "Newton’s First Law") {
    return {
      hints: [
        "What happens to an object’s motion when no force acts on it?",
        "Think about what keeps a moving object going.",
        "An object at rest stays at rest, and an object in motion stays in motion, unless a force acts on it.",
        "Newton’s First Law states that objects resist changes to their motion — this tendency is called inertia.",
      ],
      stylesUsed,
    };
  }

  if (topic.title === "The Pythagorean Theorem") {
    return {
      hints: [
        "What kind of triangle does this theorem apply to?",
        "Think about the relationship between the sides when you square them.",
        "For a right triangle: a² + b² = c², where c is the hypotenuse.",
        "The Pythagorean theorem says the squares of the two shorter sides add up to the square of the longest side in a right triangle.",
      ],
      stylesUsed,
    };
  }

  return null;
}
