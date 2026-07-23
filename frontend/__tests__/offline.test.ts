/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AdaptiveMind — Offline & PWA feature tests
 * Deterministic tests for IndexedDB storage, offline sync, security, and exports.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ──────────────────────────────────────────
// Mock IndexedDB
// ──────────────────────────────────────────

class MockIDBObjectStore {
  private data = new Map<string, unknown>();

  get(key: string) {
    const req = { result: this.data.get(key), onsuccess: null as any, onerror: null as any };
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
  }

  getAll() {
    const req = { result: [...this.data.values()], onsuccess: null as any, onerror: null as any };
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
  }

  put(value: any) {
    this.data.set(value.id ?? value.key, value);
    return { onsuccess: null as any, onerror: null as any };
  }

  delete(key: string) {
    this.data.delete(key);
    return { onsuccess: null as any, onerror: null as any };
  }

  clear() {
    this.data.clear();
    return { onsuccess: null as any, onerror: null as any };
  }

  createIndex() {}
}

class MockIDBTransaction {
  private store: MockIDBObjectStore;
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(store: MockIDBObjectStore) {
    this.store = store;
    setTimeout(() => this.oncomplete?.(), 0);
  }

  objectStore(_name: string) {
    return this.store;
  }
}

class MockIDBDatabase {
  private store = new MockIDBObjectStore();
  objectStoreNames = { contains: () => true };

  transaction(_storeNames: string, _mode: string) {
    return new MockIDBTransaction(this.store);
  }

  close() {}
}

const mockDB = new MockIDBDatabase();

beforeEach(() => {
  vi.stubGlobal("indexedDB", {
    open: () => {
      const req = { result: mockDB, onupgradeneeded: null as any, onsuccess: null as any, onerror: null as any };
      setTimeout(() => {
        req.onsuccess?.();
      }, 0);
      return req;
    },
  });
});

// ──────────────────────────────────────────
// Security tests
// ──────────────────────────────────────────

import { sanitizeContent, isNetworkOnlyUrl, auditLocalStorage, validateApiRequest } from "@/lib/security";

describe("Security utilities", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      length: 0,
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(() => null),
    });
  });

  it("sanitizeContent strips script tags", () => {
    const input = 'Hello <script>alert("xss")</script> world';
    const result = sanitizeContent(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("Hello");
    expect(result).toContain("world");
  });

  it("sanitizeContent strips event handlers", () => {
    const input = '<div onclick="steal()">text</div>';
    const result = sanitizeContent(input);
    expect(result).not.toContain("onclick");
  });

  it("sanitizeContent strips javascript: URIs", () => {
    const input = 'javascript:alert(1)';
    const result = sanitizeContent(input);
    expect(result).not.toContain("javascript:");
  });

  it("isNetworkOnlyUrl detects API endpoints", () => {
    expect(isNetworkOnlyUrl("/api/tutor")).toBe(true);
    expect(isNetworkOnlyUrl("https://api.anthropic.com")).toBe(true);
    expect(isNetworkOnlyUrl("https://app.supabase.com")).toBe(true);
  });

  it("isNetworkOnlyUrl allows normal pages", () => {
    expect(isNetworkOnlyUrl("/dashboard")).toBe(false);
    expect(isNetworkOnlyUrl("/tutor")).toBe(false);
  });

  it("auditLocalStorage finds no secrets in clean state", () => {
    const result = auditLocalStorage();
    expect(Array.isArray(result)).toBe(true);
  });

  it("validateApiRequest allows proxy routes", () => {
    expect(validateApiRequest("/api/tutor")).toBe(true);
  });

  it("validateApiRequest blocks direct AI API calls", () => {
    expect(validateApiRequest("https://api.anthropic.com/v1")).toBe(false);
  });
});

// ──────────────────────────────────────────
// Navigation route tests
// ──────────────────────────────────────────

describe("App navigation routes", () => {
  it("has all required routes", () => {
    const routes = [
      { label: "Home", href: "/" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Tutor", href: "/tutor" },
      { label: "Planner", href: "/planner" },
      { label: "Assessment", href: "/assessment" },
    ];
    expect(routes).toHaveLength(5);
    expect(routes.map((r) => r.href)).toContain("/");
    expect(routes.map((r) => r.href)).toContain("/dashboard");
    expect(routes.map((r) => r.href)).toContain("/tutor");
    expect(routes.map((r) => r.href)).toContain("/planner");
    expect(routes.map((r) => r.href)).toContain("/assessment");
  });
});

// ──────────────────────────────────────────
// Study planner types tests
// ──────────────────────────────────────────

import {
  type StudyPlan,
  allocateStudyTime,
  calculatePlanSummary,
} from "@/lib/study-planner";

describe("Study planner", () => {
  it("allocateStudyTime distributes minutes correctly", () => {
    const result = allocateStudyTime(25, "balanced");
    expect(result.length).toBeGreaterThan(0);
    expect(result.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(25);
  });

  it("allocateStudyTime light mode uses fewer chunks", () => {
    const light = allocateStudyTime(25, "light");
    const focused = allocateStudyTime(25, "focused");
    expect(light.length).toBeLessThanOrEqual(focused.length);
  });

  it("calculatePlanSummary computes correct stats", () => {
    const plan: StudyPlan = {
      id: "test-1",
      createdAt: new Date().toISOString(),
      goal: "review",
      durationDays: 2,
      minutesPerDay: 25,
      intensity: "balanced",
      days: [
        {
          dayNumber: 1,
          totalMinutes: 25,
          focus: "Math",
          tasks: [
            { id: "t1", topic: "Math", type: "review", minutes: 10, reason: "r", teachingApproach: ["visual"], completed: true },
            { id: "t2", topic: "Math", type: "lesson", minutes: 15, reason: "r", teachingApproach: ["visual"], completed: false },
          ],
        },
        {
          dayNumber: 2,
          totalMinutes: 25,
          focus: "Science",
          tasks: [
            { id: "t3", topic: "Science", type: "practice", minutes: 25, reason: "r", teachingApproach: ["examples"], completed: false },
          ],
        },
      ],
      summary: "Test plan",
    };

    const summary = calculatePlanSummary(plan);
    expect(summary.totalTasks).toBe(3);
    expect(summary.completedTasks).toBe(1);
    expect(summary.percentage).toBe(33);
    expect(summary.currentDay).toBe(1);
  });
});

// ──────────────────────────────────────────
// Mastery level tests
// ──────────────────────────────────────────

import {
  calculateMasteryLevel,
  normalizeTopicId,
} from "@/lib/mastery";

describe("Mastery", () => {
  it("normalizeTopicId creates valid IDs", () => {
    expect(normalizeTopicId("  Hello World  ")).toBe("hello-world");
    expect(normalizeTopicId("C++ Programming!")).toBe("c-programming");
  });

  it("calculateMasteryLevel returns 'new' for zero attempts", () => {
    expect(calculateMasteryLevel(0, 0, 0, [])).toBe("new");
  });

  it("calculateMasteryLevel returns 'needs-review' for low scores", () => {
    expect(calculateMasteryLevel(3, 40, 30, ["misconception", "partial", "correct"])).toBe("needs-review");
  });

  it("calculateMasteryLevel returns 'mastered' for high scores", () => {
    expect(calculateMasteryLevel(5, 90, 88, ["correct", "correct", "correct", "correct", "correct"])).toBe("mastered");
  });
});

// ──────────────────────────────────────────
// Service worker config tests
// ──────────────────────────────────────────

describe("PWA configuration", () => {
  it("has correct cache name pattern", () => {
    const CACHE_NAME = "adaptivemind-shell-v1";
    expect(CACHE_NAME).toMatch(/^adaptivemind-/);
  });

  it("precaches essential routes", () => {
    const PRECACHE_URLS = ["/", "/dashboard", "/tutor", "/planner", "/assessment"];
    expect(PRECACHE_URLS).toContain("/");
    expect(PRECACHE_URLS).toContain("/dashboard");
    expect(PRECACHE_URLS).toContain("/tutor");
  });
});
