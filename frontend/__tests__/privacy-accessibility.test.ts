import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildLearningDataExport,
  clearAdaptiveMindApplicationCaches,
  collectAdaptiveMindStorage,
  resetAdaptiveMindBrowserStorage,
  type StorageLike,
} from "@/lib/local-data";
import {
  defaultReadingSettings,
  normalizeReadingSettings,
} from "@/lib/reading-preferences";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("local learning data controls", () => {
  it("exports only AdaptiveMind browser records and safely parses JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem("adaptivemind-learning-dna", "{\"visual\":4}");
    storage.setItem("adaptivemind-tutor-draft", "ionic bonding");
    storage.setItem("unrelated-site-data", "keep");

    expect(collectAdaptiveMindStorage(storage)).toEqual({
      "adaptivemind-learning-dna": { visual: 4 },
      "adaptivemind-tutor-draft": "ionic bonding",
    });
  });

  it("resets AdaptiveMind keys without deleting unrelated browser data", () => {
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    local.setItem("adaptivemind-learning-dna", "{}");
    local.setItem("another-app", "keep");
    session.setItem("adaptivemind-tutor-handoff", "{}");
    session.setItem("another-session", "keep");

    expect(resetAdaptiveMindBrowserStorage(local, session)).toBe(2);
    expect(local.getItem("adaptivemind-learning-dna")).toBeNull();
    expect(session.getItem("adaptivemind-tutor-handoff")).toBeNull();
    expect(local.getItem("another-app")).toBe("keep");
    expect(session.getItem("another-session")).toBe("keep");
  });

  it("builds a versioned, readable learning-data export", () => {
    const exported = buildLearningDataExport({
      exportedAt: "2026-07-23T10:00:00.000Z",
      local: { "adaptivemind-reading-preferences": { highContrast: true } },
      session: {},
      indexedDB: {
        savedLessons: [],
        studyPlans: [],
        learningActivities: [],
        pendingLocalUpdates: [],
      },
    });

    expect(exported.format).toBe("AdaptiveMind local learning data");
    expect(exported.version).toBe(1);
    expect(exported.browserStorage.local).toHaveProperty(
      "adaptivemind-reading-preferences",
    );
    expect(exported.indexedDB.savedLessons).toEqual([]);
  });

  it("clears only versioned AdaptiveMind application caches", async () => {
    const names = new Set([
      "adaptivemind-core-2026-07-23-v1",
      "adaptivemind-pages-old",
      "another-app-cache",
    ]);
    const result = await clearAdaptiveMindApplicationCaches({
      keys: async () => [...names],
      delete: async (name: string) => names.delete(name),
    });

    expect(result).toEqual({ clearedItems: 2, warnings: [] });
    expect([...names]).toEqual(["another-app-cache"]);
  });
});

describe("reading preference migration", () => {
  it("migrates old settings and defaults reduced motion off", () => {
    expect(
      normalizeReadingSettings({
        textSize: "large",
        lineSpacing: "relaxed",
        contentWidth: "narrow",
        reducedVisualDensity: true,
        highContrast: true,
      }),
    ).toEqual({
      textSize: "large",
      lineSpacing: "relaxed",
      contentWidth: "narrow",
      reducedVisualDensity: true,
      highContrast: true,
      reducedMotion: false,
    });
  });

  it("bounds invalid reading settings", () => {
    expect(
      normalizeReadingSettings({
        textSize: "giant",
        lineSpacing: "infinite",
        contentWidth: "overflow",
        reducedMotion: "yes",
      }),
    ).toEqual(defaultReadingSettings);
  });
});

describe("privacy and accessibility surface", () => {
  const privacyPage = readFileSync(
    join(process.cwd(), "components", "privacy", "PrivacyPageShell.tsx"),
    "utf8",
  );
  const controls = readFileSync(
    join(process.cwd(), "components", "privacy", "DataControls.tsx"),
    "utf8",
  );
  const footer = readFileSync(
    join(process.cwd(), "components", "layout", "Footer.tsx"),
    "utf8",
  );
  const globalCss = readFileSync(
    join(process.cwd(), "app", "globals.css"),
    "utf8",
  );

  it("covers local storage, provider submission, voice, uploads, and limits", () => {
    for (const phrase of [
      "What stays on this device",
      "What is sent for an Ada request",
      "Uploaded materials and links",
      "Voice",
      "What AdaptiveMind does not currently collect",
      "No email, SMS, or WhatsApp reminders",
      "AI accuracy and learning estimates",
    ]) {
      expect(privacyPage).toContain(phrase);
    }
  });

  it("exposes all required working data-control labels with confirmation", () => {
    for (const phrase of [
      "Export my learning data as JSON",
      "Reset all learning data",
      "Remove downloaded lessons",
      "Clear cached application data",
      "Clear planner",
      'role="alertdialog"',
    ]) {
      expect(controls).toContain(phrase);
    }
  });

  it("has a real Privacy route and no placeholder footer links", () => {
    expect(footer).toContain('href="/privacy"');
    expect(footer).not.toContain('href="#"');
  });

  it("applies contrast, density, width, spacing, and motion preferences globally", () => {
    for (const attribute of [
      "data-am-text-size",
      "data-am-line-spacing",
      "data-am-content-width",
      "data-am-density",
      "data-am-contrast",
      "data-am-reduced-motion",
    ]) {
      expect(globalCss).toContain(attribute);
    }
  });
});
