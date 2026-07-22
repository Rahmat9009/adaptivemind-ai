/**
 * Study Plan Excel Export — Multiple worksheets
 */

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { StudyPlan } from "@/lib/study-planner";

export async function exportPlanExcel(plan: StudyPlan): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AdaptiveMind AI";
  workbook.created = new Date();

  // ── Worksheet 1: Overview ──
  const overview = workbook.addWorksheet("Overview");
  overview.columns = [
    { header: "Field", key: "field", width: 25 },
    { header: "Value", key: "value", width: 40 },
  ];

  overview.getRow(1).font = { bold: true, color: { argb: "FF8B6F47" } };

  overview.addRow({ field: "Plan ID", value: plan.id });
  overview.addRow({
    field: "Created",
    value: new Date(plan.createdAt).toLocaleDateString(),
  });
  overview.addRow({ field: "Goal", value: plan.goal });
  overview.addRow({ field: "Duration", value: `${plan.durationDays} days` });
  overview.addRow({
    field: "Minutes per day",
    value: String(plan.minutesPerDay),
  });
  overview.addRow({ field: "Intensity", value: plan.intensity });
  overview.addRow({ field: "Summary", value: plan.summary });

  // ── Worksheet 2: All Tasks ──
  const tasks = workbook.addWorksheet("Tasks");
  tasks.columns = [
    { header: "Day", key: "day", width: 8 },
    { header: "Focus", key: "focus", width: 30 },
    { header: "Task Type", key: "type", width: 20 },
    { header: "Topic", key: "topic", width: 30 },
    { header: "Minutes", key: "minutes", width: 10 },
    { header: "Completed", key: "completed", width: 12 },
    { header: "Reason", key: "reason", width: 50 },
  ];

  tasks.getRow(1).font = { bold: true, color: { argb: "FF8B6F47" } };

  for (const day of plan.days) {
    for (const task of day.tasks) {
      tasks.addRow({
        day: day.dayNumber,
        focus: day.focus,
        type: task.type,
        topic: task.topic,
        minutes: task.minutes,
        completed: task.completed ? "Yes" : "No",
        reason: task.reason,
      });
    }
  }

  // ── Worksheet 3: Daily Summary ──
  const daily = workbook.addWorksheet("Daily Summary");
  daily.columns = [
    { header: "Day", key: "day", width: 8 },
    { header: "Date", key: "date", width: 15 },
    { header: "Focus", key: "focus", width: 30 },
    { header: "Total Minutes", key: "totalMinutes", width: 15 },
    { header: "Tasks", key: "taskCount", width: 8 },
    { header: "Completed", key: "completedCount", width: 12 },
  ];

  daily.getRow(1).font = { bold: true, color: { argb: "FF8B6F47" } };

  for (const day of plan.days) {
    daily.addRow({
      day: day.dayNumber,
      date: day.date
        ? new Date(day.date).toLocaleDateString()
        : `Day ${day.dayNumber}`,
      focus: day.focus,
      totalMinutes: day.totalMinutes,
      taskCount: day.tasks.length,
      completedCount: day.tasks.filter((t) => t.completed).length,
    });
  }

  // ── Save ──
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `adaptivemind-study-plan-${plan.id}.xlsx`);
}
