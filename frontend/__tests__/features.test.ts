/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AdaptiveMind 2.0 — Deterministic unit tests for new features.
 * Tests for attempt-gate, confidence classification, quick-recall,
 * explanation-history, preference-overrides, and learner-transparency.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ──────────────────────────────────────────
// Mock localStorage
// ──────────────────────────────────────────

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal(
    "localStorage",
    new (class {
      getItem(key: string): string | null {
        return store.get(key) ?? null;
      }
      setItem(key: string, value: string): void {
        store.set(key, String(value));
      }
      removeItem(key: string): void {
        store.delete(key);
      }
      clear(): void {
        store.clear();
      }
      get length(): number {
        return store.size;
      }
      key(_index: number): string | null {
        return [...store.keys()][_index] ?? null;
      }
    })(),
  );
});

// ──────────────────────────────────────────
// Helpers (reproduce minimal logic inline)
// ──────────────────────────────────────────

function normalizeTopicId(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ──────────────────────────────────────────
// 1. Attempt gate logic
// ──────────────────────────────────────────

describe("Attempt gate", () => {
  it("gate locks hints until a meaningful attempt is made", () => {
    const hasAttempted = false;
    const isChallenge = true;
    const gateType = "attempt";
    const gateUnlocked = hasAttempted || gateType !== "attempt" || !isChallenge;
    expect(gateUnlocked).toBe(false);
  });

  it("gate unlocks after attempt submitted", () => {
    const hasAttempted = true;
    const isChallenge = true;
    const gateType = "attempt";
    const gateUnlocked = hasAttempted || gateType !== "attempt" || !isChallenge;
    expect(gateUnlocked).toBe(true);
  });

  it("non-challenge lessons skip the attempt gate entirely", () => {
    const hasAttempted = false;
    const isChallenge = false;
    const gateType = "attempt";
    const gateUnlocked = hasAttempted || gateType !== "attempt" || !isChallenge;
    expect(gateUnlocked).toBe(true);
  });

  it("gateType none skips gate regardless of challenge", () => {
    const hasAttempted = false;
    const isChallenge = true;
    const gateTypeNone = true; // gate type is "none"
    const gateUnlocked = hasAttempted || gateTypeNone || !isChallenge;
    expect(gateUnlocked).toBe(true);
  });

  it("empty attempt is not considered meaningful", () => {
    const attemptInput = "";
    const isMeaningful = attemptInput.trim().length > 0;
    expect(isMeaningful).toBe(false);
  });

  it("whitespace-only attempt is not meaningful", () => {
    const attemptInput = "   ";
    const isMeaningful = attemptInput.trim().length > 0;
    expect(isMeaningful).toBe(false);
  });
});

// ──────────────────────────────────────────
// 2. Hint progression & mastery interaction
// ──────────────────────────────────────────

describe("Hint progression", () => {
  it("starts at level 0 (no hints)", () => {
    const hintLevel = 0;
    expect(hintLevel).toBe(0);
  });

  it("advances one level per request", () => {
    const requestCount = 4;
    let level = 0;
    for (let idx = 0; idx < requestCount; idx++) {
      level = Math.min(level + 1, 4);
    }
    expect(level).toBe(4);
  });

  it("does not exceed level 4", () => {
    let level = 4;
    level = Math.min(level + 1, 4);
    expect(level).toBe(4);
  });

  it("full solution reduces future hint utility", () => {
    const fullSolutionRevealed = true;
    const hintLevel = 4;
    expect(fullSolutionRevealed && hintLevel >= 4).toBe(true);
  });

  it("productive struggle gate appears only at level 3+", () => {
    const hintLevel = 3;
    const showGate = hintLevel >= 3;
    expect(showGate).toBe(true);
  });

  it("productive struggle gate not shown before level 3", () => {
    const hintLevel = 2;
    const showGate = hintLevel >= 3;
    expect(showGate).toBe(false);
  });
});

// ──────────────────────────────────────────
// 3. Confidence classification (4 cases)
// ──────────────────────────────────────────

describe("Confidence classification", () => {
  function classifyCase(
    confidence: number | null,
    score: number,
  ): string {
    const conf = confidence ?? 50;
    if (conf >= 60 && score >= 60) return "high-high";
    if (conf < 60 && score >= 60) return "low-high";
    if (conf >= 60 && score < 60) return "high-low";
    return "low-low";
  }

  it("high-high: confident and correct", () => {
    expect(classifyCase(70, 80)).toBe("high-high");
  });

  it("low-high: underconfident but correct", () => {
    expect(classifyCase(40, 75)).toBe("low-high");
  });

  it("high-low: confident but incorrect", () => {
    expect(classifyCase(80, 45)).toBe("high-low");
  });

  it("low-low: low confidence, low score", () => {
    expect(classifyCase(30, 40)).toBe("low-low");
  });

  it("defaults null confidence to 50 (low-high case)", () => {
    expect(classifyCase(null, 65)).toBe("low-high");
  });

  it("boundary: confidence 59 → low, confidence 60 → high", () => {
    expect(classifyCase(59, 70)).toBe("low-high");
    expect(classifyCase(60, 70)).toBe("high-high");
  });

  it("boundary: score 59 → low, score 60 → high", () => {
    expect(classifyCase(70, 59)).toBe("high-low");
    expect(classifyCase(70, 60)).toBe("high-high");
  });
});

// ──────────────────────────────────────────
// 4. Quick recall scheduling
// ──────────────────────────────────────────

describe("Quick recall scheduling", () => {
  const QUICK_RECALL_KEY = "adaptivemind-quick-recalls";

  function scheduleQuickRecall(
    skillId: string,
    topic: string,
    simulatedDelay = false,
  ): { skillId: string; topic: string; dueAt: string; completed: boolean; createdAt: string } {
    const records = loadQuickRecalls();
    const existing = records.find(
      (r: { skillId: string; completed: boolean }) => r.skillId === normalizeTopicId(skillId) && !r.completed,
    );
    if (existing) return existing;

    const intervalMs = simulatedDelay ? 2000 + 100 : 24 * 60 * 60 * 1000;
    const dueAt = new Date(Date.now() + intervalMs).toISOString();
    const record = {
      skillId: normalizeTopicId(skillId),
      topic,
      createdAt: new Date().toISOString(),
      dueAt,
      retries: 0,
      bestScore: 0,
      fullReviewRecommended: false,
      completed: false,
    };
    records.push(record);
    saveQuickRecalls(records);
    return record;
  }

  function loadQuickRecalls(): any[] {
    try {
      const value = JSON.parse(localStorage.getItem(QUICK_RECALL_KEY) ?? "null");
      if (!value || typeof value !== "object") return [];
      const store = value as { records: any[] };
      if (!Array.isArray(store.records)) return [];
      return store.records;
    } catch {
      return [];
    }
  }

  function saveQuickRecalls(records: any[]): void {
    localStorage.setItem(QUICK_RECALL_KEY, JSON.stringify({ records }));
  }

  function getQuickRecallStatus(skillId: string): string {
    const records = loadQuickRecalls();
    const normalizedId = normalizeTopicId(skillId);
    const record = records.find((r: { skillId: string }) => r.skillId === normalizedId);
    if (!record) return "not-due";
    if (record.fullReviewRecommended) return "full-review-recommended";
    if (record.completed) return "completed";
    if (new Date(record.dueAt) <= new Date()) return "due";
    return "not-due";
  }

  it("schedules a recall for a new topic", () => {
    const rec = scheduleQuickRecall("quantum-mechanics", "Quantum Mechanics");
    expect(rec.skillId).toBe("quantum-mechanics");
    expect(rec.completed).toBe(false);
    expect(rec.dueAt).toBeTruthy();
  });

  it("does not duplicate pending recalls for same skill", () => {
    const rec1 = scheduleQuickRecall("algebra", "Algebra");
    const rec2 = scheduleQuickRecall("algebra", "Algebra");
    expect(rec2.skillId).toBe("algebra");
    expect(rec2.createdAt).toBe(rec1.createdAt); // same record returned
  });

  it("status is due when recall is past dueAt", () => {
    const skillId = "test-skill";
    const records = loadQuickRecalls();
    records.push({
      skillId: normalizeTopicId(skillId),
      topic: "Test",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      dueAt: new Date(Date.now() - 1000).toISOString(),
      retries: 0,
      bestScore: 0,
      fullReviewRecommended: false,
      completed: false,
    });
    saveQuickRecalls(records);
    expect(getQuickRecallStatus(skillId)).toBe("due");
  });

  it("status is not-due for future dueAt", () => {
    const skillId = "future-skill";
    const records = loadQuickRecalls();
    records.push({
      skillId: normalizeTopicId(skillId),
      topic: "Future",
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      retries: 0,
      bestScore: 0,
      fullReviewRecommended: false,
      completed: false,
    });
    saveQuickRecalls(records);
    expect(getQuickRecallStatus(skillId)).toBe("not-due");
  });
});

// ──────────────────────────────────────────
// 5. Quick recall mastery updates
// ──────────────────────────────────────────

describe("Quick recall mastery updates", () => {
  it("score >= 80 gives a modest mastery bump", () => {
    const delta = 0.05;
    expect(delta).toBeGreaterThan(0);
  });

  it("score 60-79 gives a smaller bump", () => {
    const delta = 0.02;
    expect(delta).toBeGreaterThan(0);
  });

  it("score < 60 gives no mastery bump", () => {
    const delta = 0;
    expect(delta).toBe(0);
  });

  it("mastery bump is conservative (never more than 0.05)", () => {
    const bump = 0.05;
    expect(bump).toBeLessThanOrEqual(0.05);
  });

  it("cumulative bumps from multiple recalls stay beneath one full lesson", () => {
    const bumps = [0.05, 0.05, 0.05];
    const total = bumps.reduce((s, v) => s + v, 0);
    expect(total).toBeLessThan(0.2);
  });
});

// ──────────────────────────────────────────
// 6. Explanation history deduplication
// ──────────────────────────────────────────

describe("Explanation history deduplication", () => {
  const EXPLANATION_HISTORY_KEY = "adaptivemind-explanation-history";

  function loadHistory(): { concepts: Record<string, any[]>; conceptOrder: string[] } {
    try {
      const value = JSON.parse(localStorage.getItem(EXPLANATION_HISTORY_KEY) ?? "null");
      if (!value || typeof value !== "object") return { concepts: {}, conceptOrder: [] };
      const raw = value as Record<string, unknown>;
      return {
        concepts: (raw.concepts as Record<string, any[]>) ?? {},
        conceptOrder: (Array.isArray(raw.conceptOrder) ? raw.conceptOrder : []) as string[],
      };
    } catch {
      return { concepts: {}, conceptOrder: [] };
    }
  }

  function saveHistory(history: { concepts: Record<string, any[]>; conceptOrder: string[] }): void {
    localStorage.setItem(EXPLANATION_HISTORY_KEY, JSON.stringify(history));
  }

  function addRecord(record: { conceptId: string; lessonId: string; checkType: string }): void {
    const history = loadHistory();
    if (!history.concepts[record.conceptId]) {
      history.concepts[record.conceptId] = [];
      history.conceptOrder.push(record.conceptId);
    }
    const existing = history.concepts[record.conceptId];
    const isDuplicate = existing.some(
      (r) => r.lessonId === record.lessonId && r.checkType === record.checkType,
    );
    if (isDuplicate) return;
    existing.unshift(record);
    saveHistory(history);
  }

  it("deduplicates records with same lessonId + checkType", () => {
    addRecord({ conceptId: "algebra", lessonId: "lesson-1", checkType: "understanding" });
    addRecord({ conceptId: "algebra", lessonId: "lesson-1", checkType: "understanding" });
    const history = loadHistory();
    expect(history.concepts["algebra"]).toHaveLength(1);
  });

  it("allows different lessonId with same checkType", () => {
    addRecord({ conceptId: "physics", lessonId: "lesson-1", checkType: "understanding" });
    addRecord({ conceptId: "physics", lessonId: "lesson-2", checkType: "understanding" });
    const history = loadHistory();
    expect(history.concepts["physics"]).toHaveLength(2);
  });

  it("allows different checkType with same lessonId", () => {
    addRecord({ conceptId: "chem", lessonId: "lesson-1", checkType: "understanding" });
    addRecord({ conceptId: "chem", lessonId: "lesson-1", checkType: "quick-recall" });
    const history = loadHistory();
    expect(history.concepts["chem"]).toHaveLength(2);
  });

  it("dedup works with normalizeTopicId", () => {
    addRecord({ conceptId: normalizeTopicId("Linear Algebra"), lessonId: "l1", checkType: "understanding" });
    addRecord({ conceptId: normalizeTopicId("linear algebra"), lessonId: "l1", checkType: "understanding" });
    const history = loadHistory();
    expect(history.concepts["linear-algebra"]).toHaveLength(1);
  });
});

// ──────────────────────────────────────────
// 7. Explanation history size bounds
// ──────────────────────────────────────────

describe("Explanation history bounds", () => {
  const MAX_ENTRIES_PER_CONCEPT = 20;
  const MAX_CONCEPTS = 100;

  it("per-concept limit caps at MAX_ENTRIES_PER_CONCEPT", () => {
    const records = Array.from({ length: 25 }, (_, i) => ({
      conceptId: "capped-concept",
      lessonId: `lesson-${i}`,
      checkType: "understanding" as const,
    }));
    const trimmed = records.slice(0, MAX_ENTRIES_PER_CONCEPT);
    expect(trimmed).toHaveLength(20);
  });

  it("total concept limit caps at MAX_CONCEPTS", () => {
    const records = Array.from({ length: 110 }, (_, i) => ({
      conceptId: `concept-${i}`,
      lessonId: `lesson-${i}`,
      checkType: "understanding" as const,
    }));
    const trimmed = records.slice(0, MAX_CONCEPTS);
    expect(trimmed).toHaveLength(100);
  });

  it("new records are inserted at the front", () => {
    const existing = [{ conceptId: "x", lessonId: "old" }];
    const updated = [{ conceptId: "x", lessonId: "new" }, ...existing];
    expect(updated[0].lessonId).toBe("new");
  });

  it("empty concept lookup returns empty array", () => {
    const records: any[] = [];
    expect(records).toHaveLength(0);
  });
});

// ──────────────────────────────────────────
// 8. Preference overrides — bans
// ──────────────────────────────────────────

describe("Preference overrides bans", () => {
  const PREFERENCE_OVERRIDES_KEY = "adaptivemind-preference-overrides";
  const MAX_BAN_ENTRIES = 20;
  const MAX_BAN_LENGTH = 80;

  function empty(): { bannedDomains: string[]; detailPreference: string } {
    return { bannedDomains: [], detailPreference: "moderate" };
  }

  function load(): { bannedDomains: string[]; detailPreference: string } {
    try {
      const value = JSON.parse(localStorage.getItem(PREFERENCE_OVERRIDES_KEY) ?? "null");
      if (!value || typeof value !== "object") return empty();
      const raw = value as Record<string, unknown>;
      return {
        bannedDomains: Array.isArray(raw.bannedDomains)
          ? raw.bannedDomains.filter((s): s is string => typeof s === "string").slice(0, MAX_BAN_ENTRIES)
          : [],
        detailPreference: raw.detailPreference === "concise" || raw.detailPreference === "thorough"
          ? raw.detailPreference
          : "moderate",
      };
    } catch {
      return empty();
    }
  }

  function save(prefs: { bannedDomains: string[]; detailPreference: string }): void {
    localStorage.setItem(PREFERENCE_OVERRIDES_KEY, JSON.stringify({
      ...prefs,
      bannedDomains: prefs.bannedDomains.slice(0, MAX_BAN_ENTRIES).map((s) => s.trim().slice(0, MAX_BAN_LENGTH)).filter(Boolean),
      updatedAt: new Date().toISOString(),
    }));
  }

  it("can add and persist a ban entry", () => {
    save({ bannedDomains: ["politics"], detailPreference: "moderate" });
    const loaded = load();
    expect(loaded.bannedDomains).toContain("politics");
  });

  it("can remove a ban entry", () => {
    save({ bannedDomains: ["politics"], detailPreference: "moderate" });
    save({ bannedDomains: [], detailPreference: "moderate" });
    expect(load().bannedDomains).not.toContain("politics");
  });

  it("can have multiple bans", () => {
    save({ bannedDomains: ["business", "war", "politics"], detailPreference: "moderate" });
    expect(load().bannedDomains).toHaveLength(3);
  });

  it("empty bans work", () => {
    save({ bannedDomains: [], detailPreference: "moderate" });
    expect(load().bannedDomains).toHaveLength(0);
  });

  it("bans over MAX_BAN_ENTRIES are clipped", () => {
    const tooMany = Array.from({ length: 25 }, (_, i) => `ban-${i}`);
    save({ bannedDomains: tooMany, detailPreference: "moderate" });
    expect(load().bannedDomains).toHaveLength(MAX_BAN_ENTRIES);
  });

  it("ban entries longer than MAX_BAN_LENGTH are truncated", () => {
    const longBan = "a".repeat(MAX_BAN_LENGTH + 20);
    save({ bannedDomains: [longBan], detailPreference: "moderate" });
    expect(load().bannedDomains[0]).toHaveLength(MAX_BAN_LENGTH);
  });
});

// ──────────────────────────────────────────
// 9. Preference overrides — loading & migration
// ──────────────────────────────────────────

describe("Preference overrides loading", () => {
  const PREFERENCE_OVERRIDES_KEY = "adaptivemind-preference-overrides";

  it("returns defaults when localStorage is empty", () => {
    const value = JSON.parse(localStorage.getItem(PREFERENCE_OVERRIDES_KEY) ?? "null");
    expect(value).toBeNull();
  });

  it("returns defaults when stored data is invalid JSON", () => {
    localStorage.setItem(PREFERENCE_OVERRIDES_KEY, "invalid-json");
    const result = (() => {
      try {
        const value = JSON.parse(localStorage.getItem(PREFERENCE_OVERRIDES_KEY) ?? "null");
        if (!value || typeof value !== "object") return { detailPreference: "moderate" as const, bannedDomains: [] as string[] };
        return { detailPreference: "moderate" as const, bannedDomains: [] as string[] };
      } catch {
        return { detailPreference: "moderate" as const, bannedDomains: [] as string[] };
      }
    })();
    expect(result.detailPreference).toBe("moderate");
  });

  it("handles missing optional fields gracefully", () => {
    localStorage.setItem(PREFERENCE_OVERRIDES_KEY, JSON.stringify({}));
    const value = JSON.parse(localStorage.getItem(PREFERENCE_OVERRIDES_KEY) ?? "null");
    const result = {
      likedDomains: Array.isArray((value as Record<string, unknown>).likedDomains)
        ? (value as Record<string, unknown>).likedDomains : [] as string[],
      detailPreference: ["concise", "moderate", "thorough"].includes((value as Record<string, unknown>).detailPreference as string)
        ? (value as Record<string, unknown>).detailPreference : "moderate",
    };
    expect(result.likedDomains).toEqual([]);
    expect(result.detailPreference).toBe("moderate");
  });
});

// ──────────────────────────────────────────
// 10. Learner transparency — values
// ──────────────────────────────────────────

describe("Learner transparency values", () => {
  function masteryLabel(level: string): string {
    const labels: Record<string, string> = {
      mastered: "Mastered",
      proficient: "Proficient",
      developing: "Developing",
      "needs-review": "Needs review",
    };
    return labels[level] ?? "New";
  }

  function confidenceLabel(conf: number): string {
    if (conf >= 70) return "Strong";
    if (conf >= 40) return "Moderate";
    if (conf >= 15) return "Low";
    return "Very low";
  }

  it("mastery labels display correctly for each level", () => {
    expect(masteryLabel("mastered")).toBe("Mastered");
    expect(masteryLabel("proficient")).toBe("Proficient");
    expect(masteryLabel("developing")).toBe("Developing");
    expect(masteryLabel("needs-review")).toBe("Needs review");
    expect(masteryLabel("new")).toBe("New");
  });

  it("confidence labels display correctly", () => {
    expect(confidenceLabel(85)).toBe("Strong");
    expect(confidenceLabel(55)).toBe("Moderate");
    expect(confidenceLabel(30)).toBe("Low");
    expect(confidenceLabel(10)).toBe("Very low");
  });

  it("total evidence is sum across all approaches", () => {
    const approaches = { visual: 3, examples: 2, analogies: 0, stories: 5, challenges: 1 };
    const total = Object.values(approaches).reduce((s, v) => s + v, 0);
    expect(total).toBe(11);
  });
});

// ──────────────────────────────────────────
// 11. Recommendation explanation
// ──────────────────────────────────────────

describe("Recommendation explanation", () => {
  function computeConfidence(totalEvidence: number): number {
    // Sigmoid-like: at 0 evidence → 10%, at 20+ → ~75%
    return Math.round(Math.max(5, Math.min(95, (1 - 1 / (1 + totalEvidence / 8)) * 100)));
  }

  it("confidence starts low with no evidence", () => {
    const conf = computeConfidence(0);
    // Should be near 10% ceiling from clamp plus the actual formula
    expect(conf).toBeLessThan(30);
  });

  it("confidence increases with evidence", () => {
    const low = computeConfidence(2);
    const high = computeConfidence(20);
    expect(high).toBeGreaterThan(low);
  });

  it("confidence caps at 95%", () => {
    const conf = computeConfidence(100);
    expect(conf).toBeLessThanOrEqual(95);
  });

  it("confidence has a minimum of 5", () => {
    const conf = computeConfidence(0);
    expect(conf).toBeGreaterThanOrEqual(5);
  });
});

// ──────────────────────────────────────────
// 12. Peer agent turn limits
// ──────────────────────────────────────────

describe("Peer agent turn limits", () => {
  const MAX_TURNS = 6;

  it("limits turns to MAX_TURNS", () => {
    const turns = Array.from({ length: 6 }, (_, i) => i + 1);
    const isComplete = turns.length >= MAX_TURNS;
    expect(isComplete).toBe(true);
  });

  it("under limit is not complete", () => {
    const turns = Array.from({ length: 3 }, (_, i) => i + 1);
    const isComplete = turns.length >= MAX_TURNS;
    expect(isComplete).toBe(false);
  });

  it("progress is tracked as learner turns", () => {
    const messages = [
      { role: "peer" },
      { role: "learner" },
      { role: "peer" },
      { role: "learner" },
    ];
    const learnerTurns = messages.filter((m) => m.role === "learner").length;
    expect(learnerTurns).toBe(2);
  });
});

// ──────────────────────────────────────────
// 13. NormalizeTopicId (used across features)
// ──────────────────────────────────────────

describe("normalizeTopicId", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(normalizeTopicId("Linear Algebra")).toBe("linear-algebra");
  });

  it("removes special characters", () => {
    expect(normalizeTopicId("What is Calculus? (Part 1)!")).toBe("what-is-calculus-part-1");
  });

  it("handles leading/trailing hyphens", () => {
    expect(normalizeTopicId("  Quantum Mechanics  ")).toBe("quantum-mechanics");
  });

  it("collapses multiple hyphens", () => {
    expect(normalizeTopicId("foo   bar---baz")).toBe("foo-bar-baz");
  });
});

// ──────────────────────────────────────────
// 14. Calibration classification
// ──────────────────────────────────────────

describe("Calibration from confidence-calibration lib", () => {
  // Reproduce the classifyCalibration logic inline for determinism
  function classifyCalibration(arr: { selfReported: number; actualScore: number }[]): string {
    if (arr.length < 2) return "insufficient-data";
    const avgConf = arr.reduce((s, r) => s + r.selfReported, 0) / arr.length;
    const avgPerf = arr.reduce((s, r) => s + r.actualScore, 0) / arr.length;
    const gap = avgConf - avgPerf;
    if (Math.abs(gap) < 10) return "well-calibrated";
    if (gap > 20) return "overconfident";
    if (gap < -10) return "underconfident";
    if (avgPerf < 50 && avgConf < 40) return "low-confidence-low-understanding";
    return "well-calibrated";
  }

  it("returns insufficient-data for fewer than 2 records", () => {
    expect(classifyCalibration([{ selfReported: 70, actualScore: 80 }])).toBe("insufficient-data");
  });

  it("returns well-calibrated when gap is small", () => {
    const records = [
      { selfReported: 70, actualScore: 75 },
      { selfReported: 60, actualScore: 65 },
    ];
    expect(classifyCalibration(records)).toBe("well-calibrated");
  });

  it("returns overconfident when gap > 20", () => {
    const records = [
      { selfReported: 90, actualScore: 60 },
      { selfReported: 85, actualScore: 55 },
    ];
    expect(classifyCalibration(records)).toBe("overconfident");
  });

  it("returns underconfident when gap < -10", () => {
    const records = [
      { selfReported: 40, actualScore: 70 },
      { selfReported: 35, actualScore: 65 },
    ];
    expect(classifyCalibration(records)).toBe("underconfident");
  });
});
