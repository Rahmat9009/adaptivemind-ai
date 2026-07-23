import "server-only";

import {
  MAX_EXTRACTED_SOURCE_CHARACTERS,
  type TutorSourceSection,
} from "@/lib/sources";

export function normalizeExtractedText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}
export function boundSourceSections(
  sections: TutorSourceSection[],
): TutorSourceSection[] {
  const bounded: TutorSourceSection[] = [];
  let remaining = MAX_EXTRACTED_SOURCE_CHARACTERS;

  for (const section of sections) {
    if (remaining <= 0 || bounded.length >= 40) break;
    const label = normalizeExtractedText(section.label).slice(0, 120);
    const content = normalizeExtractedText(section.content).slice(
      0,
      Math.min(8_000, remaining),
    );
    if (!label || !content) continue;
    bounded.push({ label, content });
    remaining -= content.length;
  }

  return bounded;
}

export function decodeTextFile(data: Uint8Array): string {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
  if (text.includes("\u0000")) {
    throw new Error("The file does not appear to contain plain UTF-8 text.");
  }
  return normalizeExtractedText(text);
}
