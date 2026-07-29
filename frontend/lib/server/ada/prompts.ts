import type { TutorRequest } from "@/lib/ai/types";
export {
  buildEvaluationSystemPrompt,
  buildExplainBackPrompt,
  buildFollowUpSystemPrompt,
  buildHintPrompt,
  buildTutorSystemPrompt,
} from "@/lib/adaptive-prompt";
export function buildQuizPrompt(req: TutorRequest): string {
  const count = req.question ? req.question : "5";
  return `You are Ada, an expert tutor. Create a ${count}-question quiz about "${req.topic}".
Include a mix of multiple choice and short answer questions.
${req.currentLesson ? `Base the quiz primarily on this recent lesson: "${req.currentLesson.title}"\n${req.currentLesson.explanation}` : ""}
Ensure the difficulty is appropriate for a ${req.level} student.
Return ONLY a valid JSON object matching the provided schema.`;
}
