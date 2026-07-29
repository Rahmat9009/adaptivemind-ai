import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("UX Assessment Results CTAs", () => {
  it("should contain the required CTA buttons with correct labels and destinations", () => {
    const filePath = path.join(__dirname, "../components/assessment/ResultsExperience.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Primary action
    expect(content).toContain('Start learning with Ada');
    expect(content).toContain('onClick={handleProceedToTutor}');
    expect(content).toContain('am-btn am-btn-primary');

    // Secondary action
    expect(content).toContain('Go to my dashboard');
    expect(content).toContain('href="/dashboard"');
    expect(content).toContain('am-btn am-btn-secondary');
  });
});
