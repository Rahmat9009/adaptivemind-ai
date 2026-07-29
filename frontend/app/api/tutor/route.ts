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

export const runtime = "nodejs";

function responseHeaders(requestId: string): HeadersInit {
  return {
    "Cache-Control": "no-store",
    "X-Request-ID": requestId,
  };
}

function errorResponse(error: AdaError, requestId: string): NextResponse {
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
      headers: responseHeaders(requestId),
    },
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const initialRequestId = crypto.randomUUID();
  if (contentLength > MAX_TUTOR_REQUEST_BYTES) {
    return errorResponse(new AdaError({
      code: "REQUEST_TOO_LARGE",
      message: "This Ada request is too large. Remove some context and try again.",
      status: 413,
    }), initialRequestId);
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_TUTOR_REQUEST_BYTES) {
      return errorResponse(new AdaError({
        code: "REQUEST_TOO_LARGE",
        message: "This Ada request is too large. Remove some context and try again.",
        status: 413,
      }), initialRequestId);
    }
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse(new AdaError({
      code: "INVALID_REQUEST",
      message: "Send a valid JSON request.",
      status: 400,
    }), initialRequestId);
  }

  const parsed = parseTutorRequest(body);
  const requestId = parsed.success
    ? parsed.data.requestId ?? initialRequestId
    : initialRequestId;
  if (!parsed.success) {
    return errorResponse(new AdaError({
      code: "INVALID_REQUEST",
      message: parsed.message,
      status: 400,
    }), requestId);
  }

  try {
    const result = await deduplicateRequest(
      requestId,
      () => orchestrateAda(parsed.data, request.signal),
    );
    return NextResponse.json(
      {
        ...result,
        requestId,
        sources: parsed.data.sources?.map(sourceAttribution),
        sourceMode: parsed.data.sources?.length
          ? parsed.data.sourceMode
          : undefined,
      },
      { headers: responseHeaders(requestId) },
    );
  } catch (error) {
    const safeError = getSafeAdaError(error);
    if (safeError.code !== "REQUEST_CANCELLED") {
      const upstream = safeError.upstreamStatus
        ? ` upstream=${safeError.upstreamStatus}`
        : "";
      console.error(`[Ada request ${requestId}] ${safeError.code}${upstream}`);
    }
    return errorResponse(safeError, requestId);
  }
}
