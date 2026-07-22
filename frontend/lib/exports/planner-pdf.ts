/**
 * Study Plan PDF Export — AdaptiveMind branding
 */

import jsPDF from "jspdf";
import type { StudyPlan } from "@/lib/study-planner";

const BRAND = {
  primary: [139, 111, 71] as [number, number, number],
  dark: [30, 28, 26] as [number, number, number],
  muted: [120, 115, 108] as [number, number, number],
  light: [250, 248, 245] as [number, number, number],
  success: [34, 139, 87] as [number, number, number],
};

export function exportPlanPDF(plan: StudyPlan): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // ── Cover header ──
  doc.setFillColor(...BRAND.light);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BRAND.dark);
  doc.text("AdaptiveMind AI", margin, y + 14);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text("Personalized Study Plan", margin, y + 24);

  doc.setFontSize(9);
  doc.text(
    `Created ${new Date(plan.createdAt).toLocaleDateString()} · ${plan.durationDays} days · ${plan.minutesPerDay} min/day · ${plan.intensity}`,
    margin,
    y + 32
  );

  y = 70;

  // ── Summary ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.dark);
  doc.text("Summary", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  const summaryLines = doc.splitTextToSize(plan.summary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 8;

  // ── Days ──
  for (const day of plan.days) {
    // Check for page break
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    // Day header
    doc.setFillColor(...BRAND.primary);
    doc.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Day ${day.dayNumber} — ${day.focus} (${day.totalMinutes} min)`,
      margin + 4,
      y + 3
    );
    y += 14;

    // Tasks
    for (const task of day.tasks) {
      if (y > 275) {
        doc.addPage();
        y = margin;
      }

      const check = task.completed ? "✓" : "○";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.dark);
      doc.text(`${check} ${task.minutes} min`, margin + 4, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.muted);
      doc.text(`${task.topic} — ${task.type}`, margin + 30, y);
      y += 5;

      // Reason (smaller)
      doc.setFontSize(8);
      const reasonLines = doc.splitTextToSize(task.reason, contentWidth - 10);
      doc.text(reasonLines, margin + 30, y);
      y += reasonLines.length * 4 + 3;
    }

    y += 4;
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `AdaptiveMind AI · Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`adaptivemind-study-plan-${plan.id}.pdf`);
}
