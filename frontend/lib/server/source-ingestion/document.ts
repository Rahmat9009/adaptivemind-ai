import "server-only";

import JSZip from "jszip";
import mammoth from "mammoth";
import { XMLParser } from "fast-xml-parser";
import { PDFParse } from "pdf-parse";
import {
  type SourceType,
  type TutorSourceSection,
} from "@/lib/sources";
import {
  boundSourceSections,
  decodeTextFile,
  normalizeExtractedText,
} from "./text";

function hasPdfMagic(data: Uint8Array): boolean {
  return new TextDecoder("ascii").decode(data.slice(0, 5)) === "%PDF-";
}
function hasZipMagic(data: Uint8Array): boolean {
  return data[0] === 0x50
    && data[1] === 0x4b
    && [0x03, 0x05, 0x07].includes(data[2])
    && [0x04, 0x06, 0x08].includes(data[3]);
}

async function parsePdf(data: Uint8Array): Promise<TutorSourceSection[]> {
  if (!hasPdfMagic(data)) {
    throw new Error("The file does not contain a valid PDF header.");
  }

  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    const sections = boundSourceSections(
      result.pages.map((page) => ({
        label: `Page ${page.num}`,
        content: page.text,
      })),
    );
    const textLength = sections.reduce(
      (total, section) => total + section.content.length,
      0,
    );
    if (textLength < 40) {
      throw new Error(
        "This PDF appears to be scanned or contains too little extractable text. Attach clear page images instead.",
      );
    }
    return sections;
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(data: Uint8Array): Promise<TutorSourceSection[]> {
  if (!hasZipMagic(data)) {
    throw new Error("The file does not contain a valid DOCX archive.");
  }
  const zip = await JSZip.loadAsync(data);
  if (!zip.file("word/document.xml")) {
    throw new Error("The archive is not a valid DOCX document.");
  }
  const result = await mammoth.extractRawText({ buffer: Buffer.from(data) });
  const content = normalizeExtractedText(result.value);
  if (!content) throw new Error("No readable text was found in this DOCX file.");
  return boundSourceSections([{ label: "Document text", content }]);
}

function collectTextNodes(value: unknown, output: string[]): void {
  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectTextNodes(item, output);
    return;
  }
  if (typeof value !== "object" || value === null) return;

  for (const [key, child] of Object.entries(value)) {
    if (key === "a:t") collectTextNodes(child, output);
    else if (typeof child === "object" && child !== null) {
      collectTextNodes(child, output);
    }
  }
}

async function parsePptx(data: Uint8Array): Promise<TutorSourceSection[]> {
  if (!hasZipMagic(data)) {
    throw new Error("The file does not contain a valid PPTX archive.");
  }
  const zip = await JSZip.loadAsync(data);
  if (!zip.file("ppt/presentation.xml")) {
    throw new Error("The archive is not a valid PPTX presentation.");
  }

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });
  const slides = Object.keys(zip.files)
    .map((name) => {
      const match = /^ppt\/slides\/slide(\d+)\.xml$/i.exec(name);
      return match ? { name, number: Number(match[1]) } : null;
    })
    .filter((slide): slide is { name: string; number: number } => slide !== null)
    .sort((first, second) => first.number - second.number);

  const sections: TutorSourceSection[] = [];
  for (const slide of slides.slice(0, 100)) {
    const xml = await zip.file(slide.name)?.async("text");
    if (!xml) continue;
    const textNodes: string[] = [];
    collectTextNodes(parser.parse(xml), textNodes);
    const content = normalizeExtractedText(textNodes.join("\n"));
    if (content) {
      sections.push({ label: `Slide ${slide.number}`, content });
    }
  }

  const bounded = boundSourceSections(sections);
  if (!bounded.length) {
    throw new Error("No readable text was found in this PPTX file.");
  }
  return bounded;
}

export async function parseDocumentSource(
  type: Exclude<SourceType, "image" | "website">,
  data: Uint8Array,
): Promise<TutorSourceSection[]> {
  if (type === "pdf") return parsePdf(data);
  if (type === "docx") return parseDocx(data);
  if (type === "pptx") return parsePptx(data);

  const content = decodeTextFile(data);
  if (!content) throw new Error("No readable text was found in this file.");
  return boundSourceSections([
    {
      label: type === "markdown" ? "Markdown text" : "File text",
      content,
    },
  ]);
}
