import "server-only";

import type {
  ExplainBackEvaluation,
  HintResponse,
  TeachingMode,
  TutorAction,
  TutorFollowUpResponse,
  TutorLesson,
  TutorRequest,
  UnderstandingEvaluation,
} from "@/lib/ai/types";
import { withBoundedContext } from "./context";
import { createLocalFallback } from "./local-fallback";
import {
  generateProviderEvaluation,
  generateProviderExplainBack,
  generateProviderFollowUp,
  generateProviderHint,
  generateProviderLesson,
  getConfiguredProviders,
  type ProviderRole,
} from "./providers";
import { AdaError, getSafeAdaError } from "./safety";

export type AdaResponseSource =
  | "live-primary"
  | "live-fallback"
  | "local-fallback";

interface AdaResultBase {
  source: AdaResponseSource;
  teachingMode: TeachingMode;
  action: TutorAction;
}

export type AdaOrchestrationResult =
  | (AdaResultBase & { lesson: TutorLesson })
  | (AdaResultBase & { followUp: TutorFollowUpResponse; action: "followup" })
  | (AdaResultBase & {
      evaluation: UnderstandingEvaluation;
      action: "evaluate" | "retrieval-check";
    })
  | (AdaResultBase & {
      evaluation: ExplainBackEvaluation;
      action: "explain-back";
    })
  | (AdaResultBase & { hints: HintResponse["hints"]; action: "hint" });

function sourceForProvider(role: ProviderRole): AdaResponseSource {
  return role === "primary" ? "live-primary" : "live-fallback";
}

function lessonMatchesAction(
  action: TutorAction,
  lesson: TutorLesson,
): boolean {
  if (action === "challenge") return Boolean(lesson.challenge);
  if (action === "example") return Boolean(lesson.practicePrompt);
  if (action === "visualize") return Boolean(lesson.visual);
  return true;
}

async function runProvider(
  request: TutorRequest,
  provider: ReturnType<typeof getConfiguredProviders>[number],
  signal?: AbortSignal,
): Promise<AdaOrchestrationResult> {
  const source = sourceForProvider(provider.role);

  if (request.action === "followup") {
    return {
      followUp: await generateProviderFollowUp(provider, request, signal),
      source,
      teachingMode: request.teachingMode,
      action: "followup",
    };
  }

  if (request.action === "evaluate" || request.action === "retrieval-check") {
    return {
      evaluation: await generateProviderEvaluation(provider, request, signal),
      source,
      teachingMode: request.teachingMode,
      action: request.action,
    };
  }

  if (request.action === "explain-back") {
    return {
      evaluation: await generateProviderExplainBack(provider, request, signal),
      source,
      teachingMode: request.teachingMode,
      action: "explain-back",
    };
  }

  if (request.action === "hint") {
    const hint = await generateProviderHint(provider, request, signal);
    return {
      hints: hint.hints,
      source,
      teachingMode: request.teachingMode,
      action: "hint",
    };
  }

  if (request.action === "review") {
    throw new AdaError({
      code: "INVALID_REQUEST",
      message: "This review action needs a generated recall prompt.",
      status: 400,
    });
  }

  const lesson = await generateProviderLesson(provider, request, signal);
  if (!lessonMatchesAction(request.action, lesson)) {
    throw new AdaError({
      code: "PROVIDER_RESPONSE_INVALID",
      message: "Ada's response did not include the requested lesson activity.",
      status: 502,
      retryable: true,
    });
  }
  return {
    lesson,
    source,
    teachingMode: request.teachingMode,
    action: request.action,
  };
}

export async function orchestrateAda(
  rawRequest: TutorRequest,
  signal?: AbortSignal,
): Promise<AdaOrchestrationResult> {
  const request = withBoundedContext(rawRequest);
  const providers = getConfiguredProviders();
  let lastError: AdaError | null = null;

  for (const provider of providers) {
    try {
      return await runProvider(request, provider, signal);
    } catch (error) {
      const safeError = getSafeAdaError(error);
      if (
        safeError.code === "REQUEST_CANCELLED"
        || safeError.code === "INVALID_REQUEST"
      ) {
        throw safeError;
      }
      lastError = safeError;
    }
  }

  const localFallback = createLocalFallback(request);
  if (localFallback) return localFallback;

  if (lastError) throw lastError;
  throw new AdaError({
    code: "PROVIDER_NOT_CONFIGURED",
    message: "Ada's live service is not configured. Add the server-side AI settings and try again.",
    status: 503,
  });
}
