import { NextResponse } from "next/server";
import { ingestWebsiteSource } from "@/lib/server/source-ingestion/url";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers });
}
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16 * 1024) {
    return errorResponse("The link request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Send a valid JSON request.", 400);
  }
  if (typeof body !== "object" || body === null) {
    return errorResponse("Enter a website URL.", 400);
  }
  const url = (body as Record<string, unknown>).url;
  if (typeof url !== "string" || !url.trim()) {
    return errorResponse("Enter a website URL.", 400);
  }

  try {
    const source = await ingestWebsiteSource(url, request.signal);
    return NextResponse.json({ source }, { headers });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "The website could not be read.";
    return errorResponse(message, 422);
  }
}
