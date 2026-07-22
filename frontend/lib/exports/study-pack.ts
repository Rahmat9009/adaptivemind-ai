/**
 * Offline Study Pack — Combined PDF with cover page, plan, lessons, review questions
 */

import jsPDF from "jspdf";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import type { StudyPlan } from "@/lib/study-planner";

const BRAND = {
  primary: [139, 111, 71] as [number, number, number],
  dark: [30, 28, 26] as [number, number, number],
  muted: [120, 115, 108] as [number, number, number],
  light: [250, 248, 245] as [number, number, number],
};

interface StudyPackData {
  plan?: StudyPlan | null;
  lessons: LessonHistoryEntry[];
}

export function exportStudyPack(data: StudyPackData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // ═══════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════
  doc.setFillColor(...BRAND.light);
  doc.rect(0, 0, pageWidth, 120, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...BRAND.dark);
  doc.text("AdaptiveMind AI", margin, 50);

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.primary);
  doc.text("Offline Study Pack", margin, 65);

  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text(
    `Generated ${new Date().toLocaleDateString()} · ${data.lessons.length} lesson${data.lessons.length !== 1 ? "s" : ""}${data.plan ? " · Study plan included" : ""}`,
    margin,
    80
  );

  y = 140;

  // ── Table of Contents ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.dark);
  doc.text("Contents", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);

  if (data.plan) {
    doc.text("1. Study Plan", margin + 4, y);
    y += 6;
    doc.text(`   ${data.plan.durationDays} days · ${data.plan.minutesPerDay} min/day · ${data.plan.intensity}`, margin + 4, y);
    y += 8;
  }

  data.lessons.forEach((lesson, i) => {
    const num = data.plan ? i + 2 : i + 1;
    doc.text(`${num}. ${lesson.response.lesson.title}`, margin + 4, y);
    y += 5;
    doc.setFontSize(8);
    doc.text(
      `   ${lesson.subject} · ${lesson.level} · ${new Date(lesson.date).toLocaleDateString()}`,
      margin + 4,
      y
    );
    doc.setFontSize(10);
    y += 7;
  });

  // ═══════════════════════════════════════════
  // STUDY PLAN
  // ═══════════════════════════════════════════
  if (data.plan) {
    doc.addPage();
    y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...BRAND.dark);
    doc.text("Study Plan", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `${data.plan.durationDays} days · ${data.plan.minutesPerDay} min/day · ${data.plan.intensity} · Goal: ${data.plan.goal}`,
      margin,
      y
    );
    y += 10;

    for (const day of data.plan.days) {
      if (y > 260) {
        doc.addPage();
        y = margin;
      }

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

      for (const task of day.tasks) {
        if (y > 275) {
          doc.addPage();
          y = margin;
        }
        const check = task.completed ? "✓" : "○";
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...BRAND.dark);
        doc.text(`${check} ${task.minutes} min — ${task.topic} (${task.type})`, margin + 6, y);
        y += 5;
      }
      y += 3;
    }
  }

  // ═══════════════════════════════════════════
  // LESSONS
  // ═══════════════════════════════════════════
  for (const entry of data.lessons) {
    doc.addPage();
    y = margin;

    const lesson = entry.response.lesson;

    // Lesson header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...BRAND.dark);
    doc.text(lesson.title, margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `${entry.subject} · ${entry.level} · ${new Date(entry.date).toLocaleDateString()}`,
      margin,
      y
    );
    y += 10;

    // Core Idea
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.dark);
    doc.text("Core Idea", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.muted);
    const ideaLines = doc.splitTextToSize(lesson.coreIdea, contentWidth);
    doc.text(ideaLines, margin, y);
    y += ideaLines.length * 5 + 8;

    // Explanation
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.dark);
    doc.text("Explanation", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.muted);
    const explLines = doc.splitTextToSize(lesson.explanation, contentWidth);
    doc.text(explLines.slice(0, 20), margin, y);
    y += Math.min(explLines.length, 20) * 5 + 8;

    // Key Points
    if (lesson.keyPoints.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.dark);
      doc.text("Key Points", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      for (const point of lesson.keyPoints) {
        const lines = doc.splitTextToSize(`• ${point}`, contentWidth - 6);
        doc.text(lines, margin + 4, y);
        y += lines.length * 5 + 2;
      }
      y += 4;
    }

    // Check Question
    if (lesson.checkQuestion) {
      if (y > 260) {
        doc.addPage();
        y = margin;
      }
      doc.setFillColor(...BRAND.primary);
      doc.roundedRect(margin, y - 4, contentWidth, 12, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`Self-check: ${lesson.checkQuestion}`, margin + 4, y + 4);
      y += 18;
    }
  }

  // ── Review Questions Page ──
  doc.addPage();
  y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.dark);
  doc.text("Review Questions", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text("Use these questions to test your understanding:", margin, y);
  y += 10;

  let qNum = 1;
  for (const entry of data.lessons) {
    if (entry.response.lesson.checkQuestion) {
      if (y > 260) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.dark);
      doc.text(`${qNum}. ${entry.response.lesson.checkQuestion}`, margin + 4, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.muted);
      doc.text(`   (${entry.response.lesson.title})`, margin + 4, y);
      y += 8;
      qNum++;
    }
  }

  // ── Page footers ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `AdaptiveMind AI · Study Pack · Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`adaptivemind-study-pack-${Date.now()}.pdf`);
}
