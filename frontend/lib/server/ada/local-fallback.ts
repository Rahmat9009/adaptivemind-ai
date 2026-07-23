import {
  createDemoEvaluation,
  createDemoExplainBack,
  createDemoFollowUp,
  createDemoHint,
  createDemoLesson,
} from "@/lib/ai/demo";
import type { TutorLesson, TutorRequest } from "@/lib/ai/types";
import type { AdaOrchestrationResult } from "./orchestrator";

function lessonMatchesAction(
  action: TutorRequest["action"],
  lesson: TutorLesson,
): boolean {
  if (action === "challenge") return Boolean(lesson.challenge);
  if (action === "example") return Boolean(lesson.practicePrompt);
  if (action === "visualize") return Boolean(lesson.visual);
  return true;
}

export function createLocalFallback(
  request: TutorRequest,
): AdaOrchestrationResult | null {
  if (request.sources?.length) return null;

  const base = {
    source: "local-fallback" as const,
    teachingMode: request.teachingMode,
  };

  if (request.action === "followup") {
    const followUp = createDemoFollowUp(request);
    return followUp ? { ...base, followUp, action: "followup" } : null;
  }

  if (request.action === "evaluate" || request.action === "retrieval-check") {
    const evaluation = createDemoEvaluation(request);
    return evaluation
      ? { ...base, evaluation, action: request.action }
      : null;
  }

  if (request.action === "explain-back") {
    const evaluation = createDemoExplainBack({
      topic: request.topic,
      learnerResponse: request.learnerResponse ?? "",
      lessonContext: request.lessonContext ?? "",
      scores: request.scores,
      teachingMode: request.teachingMode,
    });
    return evaluation
      ? { ...base, evaluation, action: "explain-back" }
      : null;
  }

  if (request.action === "hint") {
    const hint = createDemoHint({
      topic: request.topic,
      currentLevel: request.currentHintLevel ?? 0,
      scores: request.scores,
      teachingMode: request.teachingMode,
    });
    return hint ? { ...base, hints: hint.hints, action: "hint" } : null;
  }

  if (request.action === "review") return null;
  const lesson = createDemoLesson(request);
  return lesson && lessonMatchesAction(request.action, lesson)
    ? { ...base, lesson, action: request.action }
    : null;
}
