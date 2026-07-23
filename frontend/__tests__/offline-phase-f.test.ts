import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import {
  DB_VERSION,
  normalizeSavedLessonRecord,
} from "@/lib/idb";
import {
  MAX_AUTOMATIC_LESSONS,
  MAX_OFFLINE_LESSON_BYTES,
  buildSavedLessonRecord,
  chooseOfflineLessonEvictions,
} from "@/lib/offline-lessons";
import {
  normalizeStudyPlan,
  buildStudyDates,
  updatePlanTask,
  type StudyPlan,
} from "@/lib/study-planner";
import {
  isPlanTaskTogglePayload,
  getPlanTaskQueueId,
  reconcilePlanTaskToggle,
} from "@/lib/offline-sync";
import {
  preventSpreadsheetFormulaInjection,
  safeExportFilename,
} from "@/lib/exports/common";
import {
  buildPlannerSummaryRows,
  buildPlannerTaskRows,
} from "@/lib/exports/planner-data";
import { createPlanCalendar } from "@/lib/exports/planner-calendar";
import { createPlanPrintHtml } from "@/lib/exports/planner-print";
import {
  createLessonPrintHtml,
} from "@/lib/exports/lesson-data";
import { getDueLocalReminders } from "@/lib/local-reminders";

const createdAt = "2026-07-20T08:00:00.000Z";

function samplePlan(): StudyPlan {
  return {
    version: 2,
    id: "plan-test",
    createdAt,
    updatedAt: createdAt,
    goal: "review",
    durationDays: 1,
    minutesPerDay: 20,
    intensity: "balanced",
    summary: "Review current evidence.",
    days: [
      {
        dayNumber: 1,
        date: "2026-07-22T08:00:00.000Z",
        totalMinutes: 20,
        focus: "Algebra",
        tasks: [
          {
            id: "task-1",
            topic: "Algebra",
            type: "understanding-check",
            minutes: 20,
            reason: "Check retrieval.",
            teachingApproach: ["examples"],
            completed: false,
            masteryTarget: 70,
            reviewDate: "2026-07-22T08:00:00.000Z",
            notes: "",
            requiresConnection: true,
          },
        ],
      },
    ],
  };
}

function sampleLesson(id = "lesson-test"): LessonHistoryEntry {
  return {
    id,
    topic: "Binary search",
    subject: "Computer science",
    level: "Beginner",
    date: createdAt,
    teachingMode: "example",
    stylesUsed: ["examples"],
    recommendationReason: "Worked examples helped on two recent checks.",
    response: {
      source: "live-primary",
      teachingMode: "example",
      action: "initial",
      requestId: `request-${id}`,
      lesson: {
        title: "Binary search",
        coreIdea: "Repeatedly discard half of a sorted search range.",
        explanation: "Compare with the middle item and keep one half.",
        example: "Find 7 in [1, 3, 7, 9].",
        keyPoints: ["Input must be sorted.", "The range halves each step."],
        checkQuestion: "Why must the input be sorted?",
        practicePrompt: "Trace a search for 9.",
        stylesUsed: ["examples"],
      },
    },
  };
}

describe("Phase F storage migrations", () => {
  it("uses an explicit IndexedDB schema version", () => {
    expect(DB_VERSION).toBeGreaterThanOrEqual(3);
  });

  it("migrates a legacy plan without discarding valid tasks", () => {
    const legacy = samplePlan();
    delete legacy.version;
    delete legacy.updatedAt;
    delete legacy.days[0].tasks[0].notes;
    delete legacy.days[0].tasks[0].masteryTarget;
    delete legacy.days[0].tasks[0].requiresConnection;
    const migrated = normalizeStudyPlan(legacy);
    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe(2);
    expect(migrated?.days[0].tasks[0]).toMatchObject({
      id: "task-1",
      notes: "",
      masteryTarget: 60,
      requiresConnection: true,
    });
  });

  it("schedules only selected weekdays and can finish by a target", () => {
    const dates = buildStudyDates(
      3,
      [1, 3, 5],
      new Date("2026-07-20T08:00:00.000Z"),
      new Date("2026-07-31T12:00:00.000Z"),
    );
    expect(dates).toHaveLength(3);
    expect(dates.map((date) => date.getUTCDay())).toEqual([1, 3, 5]);
    expect(dates[2].toISOString().slice(0, 10)).toBe("2026-07-31");
  });

  it("rejects only the invalid plan record", () => {
    expect(normalizeStudyPlan({ id: "broken" })).toBeNull();
    expect(normalizeStudyPlan(samplePlan())).not.toBeNull();
  });

  it("normalizes a legacy saved lesson with offline metadata", () => {
    const normalized = normalizeSavedLessonRecord(sampleLesson());
    expect(normalized).toMatchObject({
      storageVersion: 1,
      saveKind: "manual",
      topic: "Binary search",
    });
    expect(normalized?.practiceQuestions).toContain(
      "Why must the input be sorted?",
    );
    expect(normalized?.sizeBytes).toBeGreaterThan(0);
  });
});

describe("Offline lesson limits", () => {
  it("keeps only the newest automatic copies", () => {
    const current = Array.from(
      { length: MAX_AUTOMATIC_LESSONS },
      (_, index) => buildSavedLessonRecord(
        sampleLesson(`lesson-${index}`),
        {
          kind: "automatic",
          savedAt: new Date(Date.parse(createdAt) + index * 1_000).toISOString(),
        },
      ),
    );
    const candidate = buildSavedLessonRecord(
      sampleLesson("lesson-new"),
      {
        kind: "automatic",
        savedAt: "2026-07-20T09:00:00.000Z",
      },
    );
    const decision = chooseOfflineLessonEvictions(current, candidate);
    expect(decision.accepted).toBe(true);
    expect(decision.evictIds).toContain("lesson-0");
  });

  it("never evicts a manual copy to make room for an automatic copy", () => {
    const manual = buildSavedLessonRecord(sampleLesson("manual"), {
      kind: "manual",
    });
    const candidate = buildSavedLessonRecord(sampleLesson("auto"), {
      kind: "automatic",
    });
    const decision = chooseOfflineLessonEvictions([manual], candidate);
    expect(decision.evictIds).not.toContain("manual");
  });

  it("rejects an oversized individual record", () => {
    const candidate = {
      ...buildSavedLessonRecord(sampleLesson(), { kind: "manual" }),
      sizeBytes: MAX_OFFLINE_LESSON_BYTES + 1,
    };
    expect(
      chooseOfflineLessonEvictions([], candidate),
    ).toMatchObject({ accepted: false, reason: "too-large" });
  });
});

describe("Offline planner reconciliation", () => {
  it("validates bounded task-toggle payloads", () => {
    expect(isPlanTaskTogglePayload({
      planId: "plan-test",
      taskId: "task-1",
      completed: true,
    })).toBe(true);
    expect(isPlanTaskTogglePayload({
      planId: "",
      taskId: "task-1",
      completed: true,
    })).toBe(false);
  });

  it("applies repeated completion as an idempotent value, not a toggle", () => {
    const payload = {
      planId: "plan-test",
      taskId: "task-1",
      completed: true,
      completedAt: "2026-07-23T09:00:00.000Z",
    };
    const once = reconcilePlanTaskToggle(samplePlan(), payload);
    const twice = once && reconcilePlanTaskToggle(once, payload);
    expect(once?.days[0].tasks[0].completed).toBe(true);
    expect(twice?.days[0].tasks[0].completed).toBe(true);
    expect(twice?.days[0].tasks[0].completedAt).toBe(
      payload.completedAt,
    );
  });

  it("uses one stable queue key for repeated updates to the same task", () => {
    expect(getPlanTaskQueueId("plan-test", "task-1")).toBe(
      getPlanTaskQueueId("plan-test", "task-1"),
    );
    expect(getPlanTaskQueueId("plan-test", "task-1")).not.toBe(
      getPlanTaskQueueId("plan-test", "task-2"),
    );
  });

  it("updates notes without changing completion", () => {
    const next = updatePlanTask(samplePlan(), "task-1", {
      notes: "Review the midpoint invariant.",
    });
    expect(next?.days[0].tasks[0]).toMatchObject({
      completed: false,
      notes: "Review the midpoint invariant.",
    });
  });
});

describe("Safe local exports", () => {
  it("generates path-safe filenames", () => {
    const filename = safeExportFilename(
      "AdaptiveMind",
      "../Algebra: <script>",
      ".PDF",
    );
    expect(filename).toBe("adaptivemind-algebra-script.pdf");
    expect(filename).not.toMatch(/[\\/:*?"<>|]/);
  });

  it("prevents spreadsheet formula injection after whitespace", () => {
    expect(preventSpreadsheetFormulaInjection(" =2+2")).toBe("' =2+2");
    expect(preventSpreadsheetFormulaInjection("+CMD|' /C calc'!A0"))
      .toBe("'+CMD|' /C calc'!A0");
    expect(preventSpreadsheetFormulaInjection("Normal notes"))
      .toBe("Normal notes");
  });

  it("builds the required planner workbook fields", () => {
    const rows = buildPlannerTaskRows(samplePlan());
    expect(Object.keys(rows[0])).toEqual([
      "Day",
      "Date",
      "Topic",
      "Task Type",
      "Recommended Approach",
      "Reason",
      "Estimated Minutes",
      "Mastery Target",
      "Review Date",
      "Status",
      "Notes",
    ]);
    expect(buildPlannerSummaryRows(samplePlan()).map((row) => row.Field))
      .toEqual([
        "Goal",
        "Duration",
        "Completed tasks",
        "Remaining tasks",
        "Estimated study time",
        "Generated date",
      ]);
  });

  it("sanitizes malicious plan text in workbook rows", () => {
    const plan = samplePlan();
    plan.days[0].tasks[0].topic = "=HYPERLINK(\"https://bad\")";
    plan.days[0].tasks[0].notes = " @SUM(A1:A2)";
    const row = buildPlannerTaskRows(plan)[0];
    expect(row.Topic.startsWith("'=")).toBe(true);
    expect(row.Notes.startsWith("' ")).toBe(true);
  });

  it("creates valid calendar events with stable task UIDs", () => {
    const calendar = createPlanCalendar(
      samplePlan(),
      new Date("2026-07-23T09:00:00.000Z"),
    );
    expect(calendar).toContain("BEGIN:VCALENDAR");
    expect(calendar).toContain(
      "UID:plan-test-task-1@adaptivemind.local",
    );
    expect(calendar).toContain("DTSTART;VALUE=DATE:20260722");
    expect(calendar).toContain("END:VCALENDAR");
  });

  it("escapes untrusted planner and lesson text in print documents", () => {
    const plan = samplePlan();
    plan.days[0].tasks[0].topic = "<script>alert(1)</script>";
    expect(createPlanPrintHtml(plan)).not.toContain("<script>alert");
    const lesson = sampleLesson();
    lesson.response.lesson.explanation = "<img src=x onerror=alert(1)>";
    const html = createLessonPrintHtml(lesson);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });

  it("builds real selectable-text PDF documents", async () => {
    const {
      createLessonPdfDocument,
      createRevisionSheetDocument,
    } = await import("@/lib/exports/lesson-pdf");
    const { createPlanPdfDocument } = await import(
      "@/lib/exports/planner-pdf"
    );
    const { createStudyPackDocument } = await import(
      "@/lib/exports/study-pack"
    );
    const documents = [
      createLessonPdfDocument(sampleLesson()),
      createRevisionSheetDocument(sampleLesson()),
      createPlanPdfDocument(samplePlan()),
      createStudyPackDocument({
        plan: samplePlan(),
        lessons: [sampleLesson()],
        reviews: [
          {
            id: "binary-search",
            topic: "Binary search",
            question: "Why does the search range halve?",
          },
        ],
        notesPages: 1,
      }),
    ];
    for (const document of documents) {
      const bytes = new Uint8Array(document.output("arraybuffer"));
      expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
      expect(bytes.byteLength).toBeGreaterThan(1_000);
    }
    expect(documents[1].getNumberOfPages()).toBe(1);
    expect(documents[3].getNumberOfPages()).toBeGreaterThan(3);
  });

  it("builds a real two-sheet Excel workbook", async () => {
    const { createPlanWorkbook } = await import(
      "@/lib/exports/planner-excel"
    );
    const workbook = createPlanWorkbook(samplePlan());
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Study Plan",
      "Summary",
    ]);
    expect(workbook.getWorksheet("Study Plan")?.getCell("C2").value)
      .toBe("Algebra");
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 2))).toBe("PK");
    expect(bytes.byteLength).toBeGreaterThan(2_000);
  });
});

describe("Local reminders and real PWA policy", () => {
  it("returns due planner and recall reminders only", () => {
    const reminders = getDueLocalReminders(
      samplePlan(),
      [
        {
          skillId: "binary-search",
          topic: "Binary search",
          createdAt,
          dueAt: "2026-07-22T07:00:00.000Z",
          retries: 0,
          bestScore: 0,
          fullReviewRecommended: false,
          completed: false,
          question: "Explain the halving step.",
          simulated: false,
        },
      ],
      new Date("2026-07-23T09:00:00.000Z"),
    );
    expect(reminders.map((item) => item.type)).toEqual([
      "planner-task",
      "quick-recall",
    ]);
  });

  it("never caches API routes and includes every offline shell route", () => {
    const worker = readFileSync(
      join(process.cwd(), "public", "sw.js"),
      "utf8",
    );
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    for (const route of [
      "/dashboard",
      "/tutor",
      "/planner",
      "/downloads",
    ]) {
      expect(worker).toContain(`"${route}"`);
    }
    expect(worker).toContain("SKIP_WAITING");
  });

  it("references icon files that exist", () => {
    const manifest = JSON.parse(
      readFileSync(
        join(process.cwd(), "public", "manifest.json"),
        "utf8",
      ),
    ) as { icons: Array<{ src: string }> };
    for (const icon of manifest.icons) {
      expect(
        existsSync(
          join(process.cwd(), "public", icon.src.replace(/^\//, "")),
        ),
      ).toBe(true);
    }
  });
});
