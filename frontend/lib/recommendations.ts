export interface LessonRecommendation {
  topic: string;
  subject: string;
  level: string;
  reason: string;
}

const recommendationMap: Record<string, LessonRecommendation> = {
  photosynthesis: { topic: "Cellular Respiration", subject: "Science", level: "High school", reason: "It builds on how plants make glucose by exploring how cells release usable energy from it." },
  "newton's first law": { topic: "Newton's Second Law", subject: "Science", level: "High school", reason: "It naturally extends inertia into how force, mass, and acceleration work together." },
  "the pythagorean theorem": { topic: "Distance on the Coordinate Plane", subject: "Math", level: "High school", reason: "It applies the theorem to a practical way of finding distance between two points." },
};

export function getLessonRecommendation(topic: string): LessonRecommendation | null {
  const displayTopic = topic.trim();
  if (!displayTopic) return null;
  return recommendationMap[displayTopic.toLowerCase()] ?? {
    topic: displayTopic,
    subject: "General learning",
    level: "Continue",
    reason:
      "Revisit this recent topic with retrieval or application practice so Ada can gather stronger evidence about what you understand.",
  };
}
