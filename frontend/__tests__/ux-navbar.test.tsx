import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("UX Navbar Routes", () => {
  it("should contain the required public links", () => {
    const filePath = path.join(__dirname, "../components/layout/Navbar.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('label: "Home", href: "/"');
    expect(content).toContain('label: "Features", href: "#features"');
    expect(content).toContain('label: "How it works", href: "#how-it-works"');
    expect(content).toContain('label: "Privacy", href: "/privacy"');
    expect(content).toContain('href="/tutor"');
    expect(content).toContain('Open Ada');
    expect(content).toContain('href="/assessment"');
    expect(content).toContain('Start assessment');
    expect(content).toContain('menuOpen &&'); // Mobile menu logic
    expect(content).toContain('Escape'); // Escape key handling
  });
});
