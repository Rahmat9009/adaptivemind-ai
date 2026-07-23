import { describe, expect, it } from "vitest";
import { primaryNavigationRoutes } from "@/components/layout/navigation";
import type { ExplanationHistory } from "@/lib/explanation-history";
import {
  buildActivityDays,
  deriveActivitiesFromExplanationHistory,
  getLearningMomentum,
  isLearningActivity,
  plannerActivityId,
  type LearningActivity,
} from "@/lib/learning-activity";
import { getLessonRecommendation } from "@/lib/recommendations";

describe("shared application navigation", () => {
  it("exposes the required routes in a stable order", () => {
    expect(
      primaryNavigationRoutes.map(({ label, href }) => ({ label, href })),
    ).toEqual([
      { label: "Home", href: "/" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Tutor", href: "/tutor" },
      { label: "Planner", href: "/planner" },
    ]);
  });
});

describe("meaningful learning activity", () => {
  const now = new Date(2026, 6, 23, 12, 0, 0);
  const activities: LearningActivity[] = [
    {
      id: "check-1",
      type: "understanding-check",
      occurredAt: new Date(2026, 6, 23, 8).toISOString(),
      topic: "Derivatives",
      score: 80,
    },
    {
      id: "recall-1",
      type: "quick-recall",
      occurredAt: new Date(2026, 6, 23, 9).toISOString(),
      topic: "Derivatives",
      score: 75,
    },
    {
      id: "plan-1",
      type: "planner-task-complete",
      occurredAt: new Date(2026, 6, 20, 10).toISOString(),
      topic: "Ionic bonding",
    },
    {
      id: "old-check",
      type: "explain-back",
      occurredAt: new Date(2026, 5, 1, 10).toISOString(),
      topic: "Plate tectonics",
      score: 70,
    },
  ];

  it("aggregates actions by local calendar day", () => {
    const days = buildActivityDays(activities, 7, now);
    expect(days).toHaveLength(7);
    expect(days.at(-1)).toMatchObject({ count: 2 });
    expect(days.find((day) => day.count === 1)).toBeDefined();
  });

  it("summarizes recent consistency without counting old activity", () => {
    expect(getLearningMomentum(activities, now)).toMatchObject({
      activeDaysLast14: 2,
      actionsLast14: 3,
    });
  });

  it("rejects page visits and malformed scores as activity", () => {
    expect(isLearningActivity({
      id: "visit-1",
      type: "page-visit",
      occurredAt: now.toISOString(),
    })).toBe(false);
    expect(isLearningActivity({
      id: "check-2",
      type: "understanding-check",
      occurredAt: now.toISOString(),
      score: 150,
    })).toBe(false);
  });

  it("creates a stable planner completion identifier", () => {
    expect(plannerActivityId("plan-1", "task-2")).toBe(
      "planner:plan-1:task-2",
    );
  });
});

describe("legacy outcome migration", () => {
  it("migrates check records but excludes practice role-play", () => {
    const history: ExplanationHistory = {
      conceptOrder: ["binary-search"],
      concepts: {
        "binary-search": [
          {
            conceptId: "binary-search",
            conceptLabel: "Binary search",
            timestamp: "2026-07-22T10:00:00.000Z",
            approach: "examples",
            lessonId: "lesson-1",
            reasonSelected: "Worked examples helped recently.",
            learnerConfidence: 75,
            checkType: "understanding",
            evaluationStatus: "correct",
            evaluationScore: 85,
            hintsUsed: 0,
            retries: 0,
            masteryBefore: 30,
            masteryAfter: 40,
            switchedAway: false,
            learnerFeedback: null,
            recommendationOutcome: "continue",
          },
          {
            conceptId: "binary-search",
            conceptLabel: "Binary search",
            timestamp: "2026-07-22T11:00:00.000Z",
            approach: "adaptive",
            lessonId: "lesson-2",
            reasonSelected: "Practice role-play.",
            learnerConfidence: 50,
            checkType: "peer-agent",
            evaluationStatus: "correct",
            evaluationScore: 0,
            hintsUsed: 0,
            retries: 0,
            masteryBefore: 0,
            masteryAfter: 0,
            switchedAway: false,
            learnerFeedback: null,
            recommendationOutcome: "peer-session",
          },
        ],
      },
    };
    const migrated = deriveActivitiesFromExplanationHistory(history);
    expect(migrated).toHaveLength(1);
    expect(migrated[0]).toMatchObject({
      type: "understanding-check",
      topic: "Binary search",
      score: 85,
    });
  });
});

describe("universal dashboard recommendation", () => {
  it("returns a useful continuation for an unseeded topic", () => {
    const recommendation = getLessonRecommendation(
      "Arabic verb conjugation",
    );
    expect(recommendation).toMatchObject({
      topic: "Arabic verb conjugation",
      subject: "General learning",
    });
    expect(recommendation?.reason).toContain("evidence");
  });
});
