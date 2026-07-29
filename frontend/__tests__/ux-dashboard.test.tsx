import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("UX Dashboard and Tutor changes", () => {
  it("dashboard has collapsible learning insights and offline sections", () => {
    const filePath = path.join(__dirname, "../components/dashboard/DashboardShell.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('const [showInsights, setShowInsights] = useState(false);');
    expect(content).toContain('Learning insights');
    expect(content).toContain('const [showOffline, setShowOffline] = useState(false);');
    expect(content).toContain('Offline and exports');
    // Summary row
    expect(content).toContain('Topics');
    expect(content).toContain('Actions');
    expect(content).toContain('Reviews Due');
    expect(content).toContain('Downloads');
  });

  it("tutor has focus mode and tabs", () => {
    const filePath = path.join(__dirname, "../components/tutor/TutorShell.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('const [focusMode, setFocusMode] = useState(false);');
    expect(content).toContain('const [activeTab, setActiveTab] = useState("learn");');
    expect(content).toContain('["learn", "visual", "quiz", "practice", "sources"]');
  });
});
