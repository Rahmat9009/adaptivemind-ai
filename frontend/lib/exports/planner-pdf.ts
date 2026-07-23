import jsPDF from "jspdf";
import {
  studyPlanGoalLabels,
  type StudyPlan,
  type StudyTask,
} from "@/lib/study-planner";
import {
  formatExportDate,
  safeExportFilename,
} from "./common";

const BRAND = {
  primary: [139, 111, 71] as [number, number, number],
  dark: [30, 28, 26] as [number, number, number],
  muted: [100, 96, 90] as [number, number, number],
  light: [250, 248, 245] as [number, number, number],
};

function taskDetails(task: StudyTask): string[] {
  return [
    `Topic: ${task.topic}`,
    `Task type: ${task.type.replace("-", " ")}`,
    `Recommended approach: ${task.teachingApproach.join(", ")}`,
    `Reason: ${task.reason}`,
    `Estimated time: ${task.minutes} minutes`,
    `Mastery target: ${task.masteryTarget ?? 60}%`,
    `Review date: ${
      task.reviewDate ? formatExportDate(task.reviewDate) : "Not scheduled"
    }`,
    `Status: ${task.completed ? "Completed" : "Pending"}`,
    `Notes: ${task.notes?.trim() || "____________________________"}`,
  ];
}

export function createPlanPdfDocument(plan: StudyPlan): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageHeader = (continuation = false) => {
    doc.setFillColor(...BRAND.light);
    doc.rect(0, 0, pageWidth, 42, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...BRAND.dark);
    doc.text("AdaptiveMind AI", margin, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.primary);
    doc.text(
      continuation ? "Study Plan - continued" : "Personal Study Plan",
      margin,
      28,
    );
    y = 50;
  };
  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - 18) return;
    doc.addPage();
    addPageHeader(true);
  };
  const addWrapped = (
    label: string,
    value: string,
    indent = 0,
  ) => {
    const prefix = label ? `${label}: ` : "";
    const lines = doc.splitTextToSize(
      `${prefix}${value}`,
      contentWidth - indent,
    ) as string[];
    ensureSpace(lines.length * 4.5 + 2);
    doc.text(lines, margin + indent, y);
    y += lines.length * 4.5 + 2;
  };

  addPageHeader();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  addWrapped("Goal", studyPlanGoalLabels[plan.goal]);
  addWrapped("Created", formatExportDate(plan.createdAt));
  addWrapped("Generated", formatExportDate(new Date()));
  addWrapped(
    "Schedule",
    `${plan.durationDays} days, ${plan.minutesPerDay} minutes per day, ${plan.intensity} intensity`,
  );
  addWrapped("Summary", plan.summary);
  y += 3;

  for (const day of plan.days) {
    ensureSpace(18);
    doc.setFillColor(...BRAND.primary);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    const date = day.date ? ` - ${formatExportDate(day.date)}` : "";
    doc.text(
      `Day ${day.dayNumber}${date}: ${day.focus} (${day.totalMinutes} min)`,
      margin + 4,
      y + 6.5,
    );
    y += 15;

    for (const task of day.tasks) {
      ensureSpace(48);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.dark);
      doc.text(
        `${task.completed ? "[x]" : "[ ]"} ${task.topic}`,
        margin + 3,
        y,
      );
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...BRAND.muted);
      for (const detail of taskDetails(task)) {
        addWrapped("", detail, 8);
      }
      y += 3;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `AdaptiveMind AI - Page ${page} of ${pageCount}`,
      margin,
      pageHeight - 8,
    );
  }

  return doc;
}

export function exportPlanPDF(plan: StudyPlan): void {
  createPlanPdfDocument(plan).save(
    safeExportFilename("adaptivemind-study-plan", plan.id, "pdf"),
  );
}
