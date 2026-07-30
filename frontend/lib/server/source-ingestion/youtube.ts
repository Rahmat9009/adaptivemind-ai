import "server-only";

import type { TutorSource } from "@/lib/sources";
import {
  normalizeYouTubeUrl,
  youtubeSourceErrorMessage,
} from "@/lib/youtube";
import {
  analyzePublicYouTubeVideo,
  getConfiguredProviders,
} from "@/lib/server/ada/providers";
import { getSafeAdaError } from "@/lib/server/ada/safety";

export class YouTubeIngestionError extends Error {
  readonly status: number;

  constructor(message: string, status = 422) {
    super(message);
    this.name = "YouTubeIngestionError";
    this.status = status;
  }
}

export async function ingestYouTubeSource(
  input: string,
  signal?: AbortSignal,
): Promise<TutorSource> {
  const normalized = normalizeYouTubeUrl(input);
  if (normalized.kind !== "youtube") {
    throw new YouTubeIngestionError(
      "This does not appear to be a valid YouTube video URL.",
      400,
    );
  }

  const provider = getConfiguredProviders().find((candidate) => {
    try {
      return new URL(candidate.baseUrl).hostname === "generativelanguage.googleapis.com";
    } catch {
      return false;
    }
  });
  if (!provider) {
    throw new YouTubeIngestionError(
      "Ada could not process this video right now. Try another public video or upload your notes.",
      503,
    );
  }

  try {
    const analysis = await analyzePublicYouTubeVideo(
      provider,
      normalized.canonicalUrl,
      signal,
    );
    const momentSummary = analysis.moments.map(
      (moment) => `${moment.timestamp} — ${moment.description}`,
    ).join("\n");
    return {
      id: crypto.randomUUID(),
      title: analysis.title,
      type: "youtube",
      mimeType: "video/youtube",
      url: normalized.canonicalUrl,
      domain: "www.youtube.com",
      sections: [{
        label: normalized.canonicalUrl,
        content: [analysis.summary, momentSummary].filter(Boolean).join("\n\n").slice(0, 4_000),
      }],
      extractionNote: "Only bounded video metadata and analyzed moments are kept; the video and a full transcript are not stored.",
    };
  } catch (error) {
    if (error instanceof YouTubeIngestionError) throw error;
    const safeError = getSafeAdaError(error);
    if (safeError.code === "REQUEST_CANCELLED") throw error;
    const learnerMessage = youtubeSourceErrorMessage(safeError);
    throw new YouTubeIngestionError(
      learnerMessage,
      safeError.code === "PROVIDER_TIMEOUT" ? 504 : 422,
    );
  }
}
