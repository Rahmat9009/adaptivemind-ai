export const MAX_SOURCE_COUNT = 5;
export const MAX_IMAGE_SOURCE_COUNT = 2;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
export const MAX_EXTRACTED_SOURCE_CHARACTERS = 40_000;
export const MAX_PROMPT_SOURCE_CHARACTERS = 60_000;
export const MAX_IMAGE_DATA_URL_CHARACTERS = 1_500_000;
export const MAX_TOTAL_IMAGE_DATA_URL_CHARACTERS = 3_000_000;

export type SourceType =
  | "pdf"
  | "docx"
  | "pptx"
  | "txt"
  | "markdown"
  | "image"
  | "website";

export type SourceGroundingMode =
  | "source-only"
  | "source-plus-background";

export interface TutorSourceSection {
  label: string;
  content: string;
}
export interface TutorSource {
  id: string;
  title: string;
  type: SourceType;
  mimeType: string;
  size?: number;
  url?: string;
  domain?: string;
  sections: TutorSourceSection[];
  imageDataUrl?: string;
  extractionNote?: string;
}

export interface TutorSourceAttribution {
  id: string;
  title: string;
  type: SourceType;
  url?: string;
  domain?: string;
  references: string[];
}

export interface LessonSourceStatement {
  statement: string;
  sourceId: string;
  reference?: string;
}

export interface LessonSourceGrounding {
  statements: LessonSourceStatement[];
  outsideKnowledgeUsed: boolean;
}

export interface SourceFileDescriptor {
  name: string;
  type: string;
  size: number;
}

const executableExtensions = new Set([
  "app",
  "bat",
  "bin",
  "cmd",
  "com",
  "cpl",
  "dll",
  "dmg",
  "exe",
  "hta",
  "jar",
  "js",
  "jse",
  "lnk",
  "msi",
  "ps1",
  "scr",
  "sh",
  "vbs",
  "wsf",
]);

const sourceTypesByExtension: Record<string, SourceType> = {
  pdf: "pdf",
  docx: "docx",
  pptx: "pptx",
  txt: "txt",
  md: "markdown",
  markdown: "markdown",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
};

const allowedMimeTypes: Record<SourceType, ReadonlySet<string>> = {
  pdf: new Set(["application/pdf", "application/octet-stream"]),
  docx: new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
    "application/zip",
  ]),
  pptx: new Set([
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/octet-stream",
    "application/zip",
  ]),
  txt: new Set(["text/plain", "application/octet-stream"]),
  markdown: new Set([
    "text/markdown",
    "text/plain",
    "application/octet-stream",
  ]),
  image: new Set(["image/jpeg", "image/png", "image/webp"]),
  website: new Set(),
};

export function getFilenameExtension(filename: string): string {
  const leaf = filename.replaceAll("\\", "/").split("/").at(-1) ?? "";
  const dot = leaf.lastIndexOf(".");
  return dot > 0 ? leaf.slice(dot + 1).toLowerCase() : "";
}

export function sanitizeSourceFilename(filename: string): string {
  const leaf = filename.replaceAll("\\", "/").split("/").at(-1) ?? "source";
  const sanitized = leaf
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 120);
  return sanitized || "source";
}

export function inferSourceType(filename: string): SourceType | null {
  return sourceTypesByExtension[getFilenameExtension(filename)] ?? null;
}

export function validateSourceFile(
  file: SourceFileDescriptor,
): { ok: true; type: Exclude<SourceType, "website">; safeName: string }
  | { ok: false; error: string } {
  const extension = getFilenameExtension(file.name);
  if (!extension || executableExtensions.has(extension)) {
    return { ok: false, error: "This file type is not allowed." };
  }

  const type = inferSourceType(file.name);
  if (!type || type === "website") {
    return {
      ok: false,
      error: "Use a PDF, DOCX, PPTX, TXT, Markdown, PNG, JPEG, or WebP file.",
    };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, error: "The selected file is empty." };
  }

  const limit = type === "image" ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > limit) {
    return {
      ok: false,
      error: `This ${type === "image" ? "image" : "document"} exceeds the ${Math.round(limit / 1024 / 1024)} MB limit.`,
    };
  }

  const mimeType = file.type.trim().toLowerCase();
  if (mimeType && !allowedMimeTypes[type].has(mimeType)) {
    return {
      ok: false,
      error: "The filename and browser-reported file type do not match.",
    };
  }

  return {
    ok: true,
    type,
    safeName: sanitizeSourceFilename(file.name),
  };
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return normalized === "localhost"
    || normalized.endsWith(".localhost")
    || normalized.endsWith(".local")
    || normalized.endsWith(".internal")
    || normalized === "metadata.google.internal";
}

export function validateSourceUrl(value: string):
  | { ok: true; url: URL }
  | { ok: false; error: string } {
  if (value.length > 2_048) {
    return { ok: false, error: "The URL is too long." };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "Enter a complete HTTP or HTTPS URL." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only HTTP and HTTPS links are supported." };
  }
  if (url.username || url.password) {
    return { ok: false, error: "Links containing credentials are not allowed." };
  }
  if (!url.hostname || isBlockedHostname(url.hostname)) {
    return { ok: false, error: "This host cannot be accessed." };
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    return { ok: false, error: "Only standard web ports are supported." };
  }

  url.hash = "";
  return { ok: true, url };
}

export function sourceAttribution(
  source: TutorSource,
): TutorSourceAttribution {
  return {
    id: source.id,
    title: source.title,
    type: source.type,
    url: source.url,
    domain: source.domain,
    references: source.sections.map((section) => section.label).slice(0, 40),
  };
}
