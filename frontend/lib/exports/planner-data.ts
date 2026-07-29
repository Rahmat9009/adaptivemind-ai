import {
  calculatePlanSummary,
  studyPlanGoalLabels,
  type StudyPlan,
} from "@/lib/study-planner";
import {
  formatExportDate,
  preventSpreadsheetFormulaInjection,
} from "./common";

export interface PlannerTaskExportRow {
  Day: number;
  Date: string;
  Topic: string;
  "Task Type": string;
  "Recommended Approach": string;
  Reason: string;
  "Estimated Minutes": number;
  "Mastery Target": string;
  "Review Date": string;
  Status: string;
  Notes: string;
}

export interface PlannerSummaryExportRow {
  Field: string;
  Value: string | number;
}

function safeText(value: unknown): string {
  return String(preventSpreadsheetFormulaInjection(value));
}

export function buildPlannerTaskRows(
  plan: StudyPlan,
): PlannerTaskExportRow[] {
  return plan.days.flatMap((day) =>
    day.tasks.map((task) => ({
      Day: day.dayNumber,
      Date: day.date ? formatExportDate(day.date) : "",
      Topic: safeText(task.topic),
      "Task Type": safeText(task.type.replace("-", " ")),
      "Recommended Approach": safeText(
        task.teachingApproach.join(", "),
      ),
      Reason: safeText(task.reason),
      "Estimated Minutes": task.minutes,
      "Mastery Target": `${task.masteryTarget ?? 60}%`,
      "Review Date": task.reviewDate
        ? formatExportDate(task.reviewDate)
        : "",
      Status: task.completed ? "Completed" : "Pending",
      Notes: safeText(task.notes ?? ""),
    })),
  );
}

export function buildPlannerSummaryRows(
  plan: StudyPlan,
  generatedAt = new Date(),
): PlannerSummaryExportRow[] {
  const summary = calculatePlanSummary(plan);
  return [
    {
      Field: "Goal",
      Value: safeText(studyPlanGoalLabels[plan.goal]),
    },
    { Field: "Duration", Value: `${plan.durationDays} days` },
    { Field: "Completed tasks", Value: summary.completedTasks },
    { Field: "Remaining tasks", Value: summary.remainingTasks },
    {
      Field: "Estimated study time",
      Value: `${summary.totalMinutes} minutes`,
    },
    { Field: "Generated date", Value: formatExportDate(generatedAt) },
  ];
}
