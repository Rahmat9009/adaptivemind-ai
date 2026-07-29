import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("UX Footer Routes and Content", () => {
  it("should contain the required footer links and text", () => {
    const filePath = path.join(__dirname, "../components/layout/Footer.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('AdaptiveMind is a local-first AI learning companion. New Ada responses require an internet connection.');
    expect(content).toContain('Features');
    expect(content).toContain('How it works');
    expect(content).toContain('href="/privacy"');
    expect(content).toContain('href="/privacy#data-controls"');
    expect(content).toContain('&copy;');
  });
});
