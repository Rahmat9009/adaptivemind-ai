import "server-only";

import type {
  ExplainBackEvaluation,
  HintResponse,
  TeachingMode,
  TutorFollowUpResponse,
  TutorLesson,
  TutorRequest,
  UnderstandingEvaluation,
} from "./types";
import type { LearningScores } from "@/lib/learning-dna";
import {
  generateProviderEvaluation,
  generateProviderExplainBack,
  generateProviderFollowUp,
  generateProviderHint,
  generateProviderLesson,
  getConfiguredProviders,
} from "@/lib/server/ada/providers";

export {
  parseExplainBackEvaluation,
  parseHintResponse,
  parseTutorFollowUp,
  parseTutorLesson,
  parseUnderstandingEvaluation,
} from "@/lib/server/ada/schemas";

function primaryProvider() {
  return getConfiguredProviders().find((provider) => provider.role === "primary");
}

export async function createProviderLesson(
  request: TutorRequest,
): Promise<TutorLesson | null> {
  const provider = primaryProvider();
  return provider ? generateProviderLesson(provider, request) : null;
}

export async function createProviderFollowUp(
  request: TutorRequest,
): Promise<TutorFollowUpResponse | null> {
  const provider = primaryProvider();
  return provider ? generateProviderFollowUp(provider, request) : null;
}

export async function createProviderEvaluation(
  request: TutorRequest,
): Promise<UnderstandingEvaluation | null> {
  const provider = primaryProvider();
  return provider ? generateProviderEvaluation(provider, request) : null;
}

export async function createProviderExplainBack(request: {
  topic: string;
  subject: string;
  level: string;
  scores: LearningScores;
  teachingMode: TeachingMode;
  learnerResponse: string;
  lessonContext: string;
}): Promise<ExplainBackEvaluation | null> {
  const provider = primaryProvider();
  return provider
    ? generateProviderExplainBack(provider, {
        ...request,
        action: "explain-back",
      })
    : null;
}

export async function createProviderHint(request: {
  topic: string;
  subject: string;
  level: string;
  scores: LearningScores;
  teachingMode: TeachingMode;
  currentLevel: number;
  lessonContext: string;
  challengeContext?: string;
}): Promise<HintResponse | null> {
  const provider = primaryProvider();
  return provider
    ? generateProviderHint(provider, {
        ...request,
        action: "hint",
        currentHintLevel: request.currentLevel,
      })
    : null;
}
