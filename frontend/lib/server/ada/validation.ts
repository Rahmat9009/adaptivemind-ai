import type { z } from "zod";

const JSON_FENCE = /```(?:json)?\s*([\s\S]*?)\s*```/i;

function findBalancedObject(content: string): string | null {
  const start = content.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < content.length; index += 1) {
    const character = content[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) return content.slice(start, index + 1);
    }
  }

  return null;
}

export function extractJsonCandidates(content: string): string[] {
  const candidates = [
    content.match(JSON_FENCE)?.[1],
    content.trim(),
    findBalancedObject(content),
  ].filter((candidate): candidate is string => Boolean(candidate?.trim()));

  return [...new Set(candidates)];
}

export function parseProviderJson<T>(
  content: string,
  schema: z.ZodType<T>,
): T | null {
  for (const candidate of extractJsonCandidates(content)) {
    try {
      const parsedJson: unknown = JSON.parse(candidate);
      const parsed = schema.safeParse(parsedJson);
      if (parsed.success) return parsed.data;
    } catch {
      // Try the next safely extracted candidate.
    }
  }

  return null;
}
