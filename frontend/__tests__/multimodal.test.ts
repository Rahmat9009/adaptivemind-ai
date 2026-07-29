import { describe, expect, it } from "vitest";
import {
  MAX_DOCUMENT_BYTES,
  sanitizeSourceFilename,
  validateSourceFile,
  validateSourceUrl,
} from "@/lib/sources";
import { isPublicNetworkAddress } from "@/lib/url-security";
import { parseTutorRequest } from "@/lib/server/ada/schemas";
import { createLocalFallback } from "@/lib/server/ada/local-fallback";

const scores = {
  visual: 50,
  examples: 50,
  analogies: 50,
  stories: 50,
  challenges: 50,
};

describe("document validation", () => {
  it("accepts supported educational documents", () => {
    expect(validateSourceFile({
      name: "chapter 4.pdf",
      type: "application/pdf",
      size: 1024,
    })).toMatchObject({ ok: true, type: "pdf", safeName: "chapter 4.pdf" });
  });

  it("rejects executable files and MIME mismatches", () => {
    expect(validateSourceFile({
      name: "notes.exe",
      type: "application/octet-stream",
      size: 100,
    })).toMatchObject({ ok: false });
    expect(validateSourceFile({
      name: "notes.pdf",
      type: "image/png",
      size: 100,
    })).toMatchObject({ ok: false });
  });

  it("rejects empty and oversized documents", () => {
    expect(validateSourceFile({
      name: "notes.txt",
      type: "text/plain",
      size: 0,
    })).toMatchObject({ ok: false });
    expect(validateSourceFile({
      name: "notes.txt",
      type: "text/plain",
      size: MAX_DOCUMENT_BYTES + 1,
    })).toMatchObject({ ok: false });
  });

  it("removes paths and unsafe filename characters", () => {
    expect(sanitizeSourceFilename("../unit:<4>?.docx")).toBe("unit__4__.docx");
  });
});

describe("website URL validation", () => {
  it("accepts public HTTP and HTTPS URLs", () => {
    expect(validateSourceUrl("https://example.org/lesson#part").ok).toBe(true);
    expect(validateSourceUrl("http://example.org/article").ok).toBe(true);
  });

  it("rejects non-web protocols, credentials, private names, and custom ports", () => {
    for (const value of [
      "file:///etc/passwd",
      "https://user:password@example.org/",
      "http://localhost/admin",
      "http://service.internal/data",
      "https://example.org:8443/data",
    ]) {
      expect(validateSourceUrl(value).ok).toBe(false);
    }
  });

  it("blocks private, metadata, loopback, and mapped network addresses", () => {
    for (const address of [
      "127.0.0.1",
      "10.0.0.1",
      "169.254.169.254",
      "172.16.10.2",
      "192.168.1.1",
      "::1",
      "fc00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
      "::ffff:c0a8:101",
      "2001:db8::1",
    ]) {
      expect(isPublicNetworkAddress(address), address).toBe(false);
    }
    expect(isPublicNetworkAddress("93.184.216.34")).toBe(true);
    expect(isPublicNetworkAddress("2606:2800:220:1:248:1893:25c8:1946")).toBe(true);
  });
});

describe("source-aware Ada request validation", () => {
  it("accepts bounded source context with explicit grounding mode", () => {
    const result = parseTutorRequest({
      requestId: "request-source-123",
      topic: "Teach me this page",
      subject: "Biology",
      level: "Beginner",
      scores,
      action: "initial",
      teachingMode: "adaptive",
      sourceMode: "source-only",
      sources: [{
        id: "source-12345",
        title: "Cell notes",
        type: "txt",
        mimeType: "text/plain",
        size: 120,
        sections: [{ label: "File text", content: "Cells contain membranes." }],
      }],
    });
    expect(result.success).toBe(true);
  });

  it("requires a source mode and actual image data", () => {
    const withoutMode = parseTutorRequest({
      requestId: "request-source-124",
      topic: "Teach me this page",
      subject: "Biology",
      level: "Beginner",
      scores,
      action: "initial",
      teachingMode: "adaptive",
      sources: [{
        id: "source-12345",
        title: "Cell notes",
        type: "txt",
        mimeType: "text/plain",
        sections: [{ label: "File text", content: "Cells contain membranes." }],
      }],
    });
    expect(withoutMode.success).toBe(false);

    const imageWithoutData = parseTutorRequest({
      requestId: "request-source-125",
      topic: "Explain this diagram",
      subject: "Biology",
      level: "Beginner",
      scores,
      action: "initial",
      teachingMode: "visual",
      sourceMode: "source-only",
      sources: [{
        id: "source-image-1",
        title: "diagram.png",
        type: "image",
        mimeType: "image/png",
        sections: [{ label: "Image", content: "Educational image." }],
      }],
    });
    expect(imageWithoutData.success).toBe(false);
  });

  it("never substitutes demo content for an attached source", () => {
    expect(createLocalFallback({
      topic: "Photosynthesis",
      subject: "Biology",
      level: "Beginner",
      scores,
      action: "initial",
      teachingMode: "adaptive",
      sourceMode: "source-only",
      sources: [{
        id: "source-notes-1",
        title: "notes.txt",
        type: "txt",
        mimeType: "text/plain",
        sections: [{
          label: "File text",
          content: "This source intentionally discusses a different topic.",
        }],
      }],
    })).toBeNull();
  });
});
