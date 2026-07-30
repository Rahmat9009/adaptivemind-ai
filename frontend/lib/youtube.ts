import { validateSourceUrl } from "@/lib/sources";

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const youtubeHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export type YouTubeUrlResult =
  | {
      kind: "youtube";
      videoId: string;
      canonicalUrl: string;
    }
  | {
      kind: "invalid-youtube";
      error: "This does not appear to be a valid YouTube video URL.";
    }
  | { kind: "not-youtube" };

export function normalizeYouTubeUrl(value: string): YouTubeUrlResult {
  let candidate: URL;
  try {
    candidate = new URL(value.trim());
  } catch {
    return { kind: "not-youtube" };
  }

  const hostname = candidate.hostname.toLowerCase().replace(/\.$/, "");
  if (!youtubeHosts.has(hostname)) return { kind: "not-youtube" };

  const validation = validateSourceUrl(candidate.toString());
  if (!validation.ok) {
    return {
      kind: "invalid-youtube",
      error: "This does not appear to be a valid YouTube video URL.",
    };
  }

  let videoId = "";
  const pathParts = validation.url.pathname.split("/").filter(Boolean);
  if (hostname === "youtu.be" || hostname === "www.youtu.be") {
    videoId = pathParts.length === 1 ? pathParts[0] : "";
  } else if (validation.url.pathname === "/watch") {
    videoId = validation.url.searchParams.get("v") ?? "";
  } else if (pathParts[0] === "shorts" && pathParts.length === 2) {
    videoId = pathParts[1];
  }

  if (!YOUTUBE_ID_PATTERN.test(videoId)) {
    return {
      kind: "invalid-youtube",
      error: "This does not appear to be a valid YouTube video URL.",
    };
  }

  return {
    kind: "youtube",
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export function youtubeSourceErrorMessage(error: {
  code?: string;
  upstreamStatus?: number;
}): string {
  if (error.code === "PROVIDER_TIMEOUT") return "Video processing timed out.";
  if (error.upstreamStatus === 403) return "Only public YouTube videos are supported.";
  if ([400, 404].includes(error.upstreamStatus ?? 0)) {
    return "This video is private, unlisted, age-restricted, unavailable, or inaccessible.";
  }
  return "Ada could not process this video right now. Try another public video or upload your notes.";
}
