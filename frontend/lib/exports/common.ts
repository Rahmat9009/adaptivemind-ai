export function safeFilenameSegment(
  value: string,
  fallback = "export",
  maxLength = 80,
): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\.+$/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .toLowerCase()
    .slice(0, maxLength);
  return normalized || fallback;
}

export function safeExportFilename(
  prefix: string,
  title: string,
  extension: string,
): string {
  const safePrefix = safeFilenameSegment(prefix, "adaptivemind", 40);
  const safeTitle = safeFilenameSegment(title, "learning-export", 80);
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${safePrefix}-${safeTitle}.${safeExtension || "txt"}`;
}

export function preventSpreadsheetFormulaInjection(
  value: unknown,
): string | number | boolean {
  if (
    typeof value === "number"
    || typeof value === "boolean"
  ) {
    return value;
  }
  const text = String(value ?? "");
  return /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatExportDate(
  value: string | Date | undefined,
): string {
  const date = value instanceof Date
    ? value
    : value && Number.isFinite(Date.parse(value))
      ? new Date(value)
      : new Date();
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
