import { NextResponse } from "next/server";
import {
  MAX_DOCUMENT_BYTES,
  validateSourceFile,
  type TutorSource,
} from "@/lib/sources";
import { parseDocumentSource } from "@/lib/server/source-ingestion/document";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers });
}
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_DOCUMENT_BYTES + 256 * 1024) {
    return errorResponse("The document exceeds the 10 MB limit.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Send one document as multipart form data.", 400);
  }

  const value = formData.get("file");
  if (!(value instanceof File)) {
    return errorResponse("Choose a document to process.", 400);
  }

  const validation = validateSourceFile(value);
  if (!validation.ok) return errorResponse(validation.error, 400);
  if (validation.type === "image") {
    return errorResponse("Images are prepared in the browser for visual analysis.", 400);
  }

  try {
    const data = new Uint8Array(await value.arrayBuffer());
    const sections = await parseDocumentSource(validation.type, data);
    const source: TutorSource = {
      id: crypto.randomUUID(),
      title: validation.safeName,
      type: validation.type,
      mimeType: value.type || "application/octet-stream",
      size: value.size,
      sections,
      extractionNote:
        sections.reduce((total, section) => total + section.content.length, 0)
          >= 40_000
          ? "Extracted text was limited to 40,000 characters."
          : undefined,
    };
    return NextResponse.json({ source }, { headers });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "The document could not be processed.";
    return errorResponse(message, 422);
  }
}
