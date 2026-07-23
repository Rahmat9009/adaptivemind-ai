/**
 * Security & Privacy utilities for AdaptiveMind
 * - No API keys cached in localStorage/IndexedDB
 * - AI requests marked as network-only
 * - Content sanitization for stored data
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
];

/**
 * Sanitize user-facing text content before storing or rendering.
 * Strips script tags, event handlers, and data URIs.
 */
export function sanitizeContent(input: string): string {
  let clean = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  return clean.trim();
}

/**
 * Check if a URL should be fetched network-only (never cached).
 */
export function isNetworkOnlyUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("/api/") ||
    lower.includes("supabase") ||
    lower.includes("anthropic") ||
    lower.includes("openai") ||
    lower.includes(".env")
  );
}

/**
 * Verify that no API keys are stored in localStorage.
 * Returns list of keys that look like they might contain secrets.
 */
export function auditLocalStorage(): string[] {
  const suspicious: string[] = [];
  const secretPatterns = [/key/i, /token/i, /secret/i, /password/i, /api/i];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && secretPatterns.some((p) => p.test(key))) {
      // Check if the value looks like a real key (long alphanumeric string)
      const value = localStorage.getItem(key) ?? "";
      if (value.length > 20 && /^[a-zA-Z0-9_-]+$/.test(value)) {
        suspicious.push(key);
      }
    }
  }

  return suspicious;
}

/**
 * Ensure AI API requests are never made from client-side code
 * without going through the /api/ proxy. Returns true if safe.
 */
export function validateApiRequest(url: string): boolean {
  // Must go through our proxy
  if (url.startsWith("/api/")) return true;
  // Block direct calls to external AI APIs
  if (isNetworkOnlyUrl(url) && !url.startsWith("/api/")) return false;
  return true;
}
