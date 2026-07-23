export type LearningDimension =
  | "visual"
  | "examples"
  | "analogies"
  | "stories"
  | "challenges";

export interface LearningScores {
  visual: number;
  examples: number;
  analogies: number;
  stories: number;
  challenges: number;
}

export interface AssessmentAnswer {
  label: string;
  description: string;
  contributions: Partial<LearningScores>;
}

export interface AssessmentQuestion {
  prompt: string;
  answers: AssessmentAnswer[];
}

export const learningDimensions: LearningDimension[] = [
  "visual",
  "examples",
  "analogies",
  "stories",
  "challenges",
];

export const learningDimensionLabels: Record<LearningDimension, string> = {
  visual: "Visual",
  examples: "Examples",
  analogies: "Analogies",
  stories: "Stories",
  challenges: "Challenges",
};

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    prompt: "When learning a new scientific concept, what helps you most?",
    answers: [
      { label: "A diagram that shows the moving parts", description: "I can see how the pieces relate.", contributions: { visual: 2 } },
      { label: "A real situation where it is used", description: "I connect the idea to something practical.", contributions: { examples: 2 } },
      { label: "A comparison to something familiar", description: "A useful parallel makes it click.", contributions: { analogies: 2 } },
      { label: "A puzzle to work through", description: "Testing the idea feels useful here.", contributions: { challenges: 2 } },
    ],
  },
  {
    prompt: "When instructions feel confusing, what do you prefer?",
    answers: [
      { label: "A step-by-step visual walkthrough", description: "Seeing each stage removes the guesswork.", contributions: { visual: 1, examples: 1 } },
      { label: "An example of a completed answer", description: "I can use it as a model for my own work.", contributions: { examples: 2 } },
      { label: "A simpler comparison", description: "Relating it to something I know helps.", contributions: { analogies: 2 } },
      { label: "A chance to try it and get feedback", description: "I improve by correcting my approach.", contributions: { challenges: 2 } },
    ],
  },
  {
    prompt: "Which study activity keeps you most engaged?",
    answers: [
      { label: "Turning notes into a map or sketch", description: "I like making the structure visible.", contributions: { visual: 2 } },
      { label: "Following how an idea plays out in a story", description: "A narrative gives the topic context.", contributions: { stories: 2 } },
      { label: "Solving questions that get a little harder", description: "A stretch keeps me focused.", contributions: { challenges: 2 } },
      { label: "Looking at several worked examples", description: "Patterns become clear when I compare cases.", contributions: { examples: 2 } },
    ],
  },
  {
    prompt: "How would you rather learn a difficult formula?",
    answers: [
      { label: "See it broken into labeled parts", description: "I want to see what each part is doing.", contributions: { visual: 2 } },
      { label: "Use it in a realistic problem", description: "Applying it gives the formula meaning.", contributions: { examples: 2 } },
      { label: "Connect it to an everyday idea", description: "An analogy makes the logic easier to remember.", contributions: { analogies: 2 } },
      { label: "Derive it by working through a challenge", description: "I remember it when I discover the steps.", contributions: { challenges: 2 } },
    ],
  },
  {
    prompt: "What makes an explanation memorable?",
    answers: [
      { label: "A strong image or visual sequence", description: "I can replay it in my mind later.", contributions: { visual: 2 } },
      { label: "A story with a clear beginning and outcome", description: "The narrative helps the idea stick.", contributions: { stories: 2 } },
      { label: "A surprising comparison", description: "A well-chosen analogy is easy to recall.", contributions: { analogies: 2 } },
      { label: "A short task that proves the point", description: "Doing it makes the explanation real.", contributions: { examples: 1, challenges: 1 } },
    ],
  },
  {
    prompt: "When you make a mistake, what helps you improve?",
    answers: [
      { label: "Seeing exactly where my approach changed course", description: "A visual breakdown helps me spot the gap.", contributions: { visual: 1, challenges: 1 } },
      { label: "Comparing my work with a correct example", description: "I learn from the difference between the two.", contributions: { examples: 2 } },
      { label: "Hearing why the mistake happens in a familiar situation", description: "The reasoning feels more intuitive.", contributions: { analogies: 1, stories: 1 } },
      { label: "Trying a similar problem straight away", description: "I build confidence through another attempt.", contributions: { challenges: 2 } },
    ],
  },
  {
    prompt: "How do you prefer to review before an exam?",
    answers: [
      { label: "Use color-coded summaries and diagrams", description: "I scan the big picture and key links.", contributions: { visual: 2 } },
      { label: "Review key ideas through short case studies", description: "Concrete situations refresh my memory.", contributions: { examples: 2 } },
      { label: "Retell the topic as a connected story", description: "I remember the sequence and why it matters.", contributions: { stories: 2 } },
      { label: "Test myself with practice questions", description: "I want to find the gaps before the exam.", contributions: { challenges: 2 } },
    ],
  },
  {
    prompt: "Which lesson format would you choose first?",
    answers: [
      { label: "An interactive visual explainer", description: "I want to see the concept take shape.", contributions: { visual: 2 } },
      { label: "A lesson built around relatable examples", description: "I learn by seeing it in context.", contributions: { examples: 2 } },
      { label: "A lesson that uses memorable comparisons", description: "I like building from ideas I already know.", contributions: { analogies: 2 } },
      { label: "A guided challenge with hints", description: "I want to learn by working it out.", contributions: { challenges: 2 } },
    ],
  },
];

const emptyScores = (): LearningScores => ({
  visual: 0,
  examples: 0,
  analogies: 0,
  stories: 0,
  challenges: 0,
});

export function calculateLearningDNA(selectedAnswers: Array<number | null>): LearningScores {
  const earned = emptyScores();
  const possible = emptyScores();

  assessmentQuestions.forEach((question, questionIndex) => {
    learningDimensions.forEach((dimension) => {
      possible[dimension] += Math.max(
        ...question.answers.map((answer) => answer.contributions[dimension] ?? 0),
      );
    });

    const answerIndex = selectedAnswers[questionIndex];
    const answer = answerIndex === null || answerIndex === undefined
      ? undefined
      : question.answers[answerIndex];

    if (answer) {
      learningDimensions.forEach((dimension) => {
        earned[dimension] += answer.contributions[dimension] ?? 0;
      });
    }
  });

  return learningDimensions.reduce<LearningScores>((scores, dimension) => {
    scores[dimension] = possible[dimension] === 0
      ? 0
      : Math.round((earned[dimension] / possible[dimension]) * 100);
    return scores;
  }, emptyScores());
}

export function getPrimaryLearningStyle(scores: LearningScores): LearningDimension {
  return learningDimensions.reduce((primary, dimension) =>
    scores[dimension] > scores[primary] ? dimension : primary,
  learningDimensions[0]);
}
