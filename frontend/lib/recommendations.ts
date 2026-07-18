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
  return recommendationMap[topic.trim().toLowerCase()] ?? null;
}
