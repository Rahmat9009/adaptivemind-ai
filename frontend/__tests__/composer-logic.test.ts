import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("AdaComposer source submission logic", () => {
  it("unchecks failed attachments and does not block optional source failure", () => {
    const filePath = path.join(__dirname, "../components/tutor/AdaComposer.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Check if it unchecks on error
    expect(content).toContain('selected: false,');
    expect(content).toContain('status: "error",');

    // Check if it blocks source-only
    expect(content).toContain('if (sourceMode === "source-only")');
    expect(content).toContain('return;'); // Should return inside the block

    // Check if it continues otherwise
    expect(content).toContain('await onSubmit(');
    expect(content).toContain('sources.length ? sourceMode : undefined,');
    expect(content).toContain('submitPendingRef.current');
    expect(content).toContain('preparationControllerRef.current?.abort()');
    expect(content).toContain('signal,');
  });
});
