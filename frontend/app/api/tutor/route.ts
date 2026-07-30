import { NextResponse } from "next/server";
import { deduplicateRequest } from "@/lib/server/ada/dedupe";
import { orchestrateAda } from "@/lib/server/ada/orchestrator";
import { parseTutorRequest } from "@/lib/server/ada/schemas";
import {
  AdaError,
  getSafeAdaError,
  MAX_TUTOR_REQUEST_BYTES,
} from "@/lib/server/ada/safety";
import { sourceAttribution } from "@/lib/sources";
import {
  AdaTelemetry,
  logAdaTiming,
  safeClientDuration,
} from "@/lib/server/ada/telemetry";

export const runtime = "nodejs";

function responseHeaders(
  requestId: string,
  telemetry?: AdaTelemetry,
): HeadersInit {
  return {
    "Cache-Control": "no-store",
    "X-Request-ID": requestId,
    ...(telemetry ? { "Server-Timing": telemetry.serverTiming() } : {}),
  };
}

function errorResponse(
  error: AdaError,
  requestId: string,
  telemetry?: AdaTelemetry,
): NextResponse {
  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
      retryable: error.retryable,
      retryAfterMs: error.retryAfterMs,
      requestId,
    },
    {
      status: error.status,
      headers: responseHeaders(requestId, telemetry),
    },
  );
}

export async function POST(request: Request) {
  const telemetry = new AdaTelemetry();
  telemetry.set(
    "learningDna",
    safeClientDuration(request.headers.get("x-ada-learning-dna-duration")),
  );
  telemetry.set(
    "source",
    safeClientDuration(request.headers.get("x-ada-source-preparation-duration")),
  );
  telemetry.set("persistence", 0);
  const validationStartedAt = performance.now();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const initialRequestId = crypto.randomUUID();
  if (contentLength > MAX_TUTOR_REQUEST_BYTES) {
    return errorResponse(new AdaError({
      code: "REQUEST_TOO_LARGE",
      message: "This Ada request is too large. Remove some context and try again.",
      status: 413,
    }), initialRequestId, telemetry);
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_TUTOR_REQUEST_BYTES) {
      return errorResponse(new AdaError({
        code: "REQUEST_TOO_LARGE",
        message: "This Ada request is too large. Remove some context and try again.",
        status: 413,
      }), initialRequestId, telemetry);
    }
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse(new AdaError({
      code: "INVALID_REQUEST",
      message: "Send a valid JSON request.",
      status: 400,
    }), initialRequestId, telemetry);
  }

  const parsed = parseTutorRequest(body);
  const requestId = parsed.success
    ? parsed.data.requestId ?? initialRequestId
    : initialRequestId;
  if (!parsed.success) {
    telemetry.set("validation", performance.now() - validationStartedAt);
    return errorResponse(new AdaError({
      code: "INVALID_REQUEST",
      message: parsed.message,
      status: 400,
    }), requestId, telemetry);
  }
  telemetry.set("validation", performance.now() - validationStartedAt);

  try {
    const result = await deduplicateRequest(
      requestId,
      () => orchestrateAda(parsed.data, request.signal, telemetry),
    );
    const response = NextResponse.json(
      {
        ...result,
        requestId,
        sources: parsed.data.sources?.map(sourceAttribution),
        sourceMode: parsed.data.sources?.length
          ? parsed.data.sourceMode
          : undefined,
      },
      { headers: responseHeaders(requestId, telemetry) },
    );
    logAdaTiming({
      requestId,
      action: parsed.data.action,
      sourceCount: parsed.data.sources?.length ?? 0,
      telemetry,
      outcome: "success",
    });
    return response;
  } catch (error) {
    const safeError = getSafeAdaError(error);
    if (safeError.code !== "REQUEST_CANCELLED") {
      const upstream = safeError.upstreamStatus
        ? ` upstream=${safeError.upstreamStatus}`
        : "";
      console.error(`[Ada request ${requestId}] ${safeError.code}${upstream}`);
    }
    logAdaTiming({
      requestId,
      action: parsed.data.action,
      sourceCount: parsed.data.sources?.length ?? 0,
      telemetry,
      outcome: safeError.code === "REQUEST_CANCELLED" ? "cancelled" : "error",
    });
    return errorResponse(safeError, requestId, telemetry);
  }
}
