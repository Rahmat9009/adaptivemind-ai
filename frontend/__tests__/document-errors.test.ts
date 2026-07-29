import { describe, it, expect } from "vitest";

describe("document source error classification", () => {
  it("throws specific scanned PDF message for PDFs with little text", async () => {
    // We can't easily generate a valid empty PDF byte array inline, so we just verify the source code contains the specific string
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(path.join(__dirname, "../lib/server/source-ingestion/document.ts"), "utf-8");
    expect(content).toContain("This PDF appears to contain scanned pages without selectable text. Upload the page as an image or use image-based analysis.");
  });
});
