/**
 * Lesson Summary PDF Export — Full lesson and one-page revision sheet
 */

import jsPDF from "jspdf";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";

const BRAND = {
  primary: [139, 111, 71] as [number, number, number],
  dark: [30, 28, 26] as [number, number, number],
  muted: [120, 115, 108] as [number, number, number],
  light: [250, 248, 245] as [number, number, number],
};

function addHeader(doc: jsPDF, title: string, pageWidth: number) {
  doc.setFillColor(...BRAND.light);
  doc.rect(0, 0, pageWidth, 50, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.dark);
  doc.text("AdaptiveMind AI", 20, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text(title, 20, 28);
}

/**
 * Export a full lesson PDF with all details
 */
export function exportLessonPDF(entry: LessonHistoryEntry): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 60;

  addHeader(doc, entry.topic, pageWidth);

  // ── Meta ──
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(
    `${entry.subject} · ${entry.level} · ${new Date(entry.date).toLocaleDateString()} · ${entry.teachingMode}`,
    margin,
    y
  );
  y += 10;

  // ── Title ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND.dark);
  doc.text(entry.response.lesson.title, margin, y);
  y += 10;

  // ── Core Idea ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Core Idea", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  const ideaLines = doc.splitTextToSize(
    entry.response.lesson.coreIdea,
    contentWidth
  );
  doc.text(ideaLines, margin, y);
  y += ideaLines.length * 5 + 8;

  // ── Explanation ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.dark);
  doc.text("Explanation", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  const explLines = doc.splitTextToSize(
    entry.response.lesson.explanation,
    contentWidth
  );
  doc.text(explLines, margin, y);
  y += explLines.length * 5 + 8;

  // ── Key Points ──
  if (entry.response.lesson.keyPoints.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.dark);
    doc.text("Key Points", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const point of entry.response.lesson.keyPoints) {
      const lines = doc.splitTextToSize(`• ${point}`, contentWidth - 6);
      doc.text(lines, margin + 4, y);
      y += lines.length * 5 + 2;
    }
    y += 6;
  }

  // ── Check Question ──
  if (entry.response.lesson.checkQuestion) {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(...BRAND.primary);
    doc.roundedRect(margin, y - 4, contentWidth, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Check: ${entry.response.lesson.checkQuestion}`, margin + 4, y + 4);
    y += 18;
  }

  // ── Evaluation ──
  if (entry.evaluation) {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.dark);
    doc.text("Evaluation", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `Score: ${entry.evaluation.score}% · Status: ${entry.evaluation.status} · Mastery: ${entry.evaluation.masteryLevel}`,
      margin,
      y
    );
    y += 6;
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

  doc.save(`adaptivemind-lesson-${entry.id}.pdf`);
}

/**
 * Export a one-page revision sheet
 */
export function exportRevisionSheet(entry: LessonHistoryEntry): void {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // ── Title bar ──
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Revision: ${entry.response.lesson.title}`, margin, 14);

  y = 30;

  // ── Core Idea (highlighted) ──
  doc.setFillColor(...BRAND.light);
  doc.roundedRect(margin, y - 4, contentWidth, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.dark);
  doc.text("CORE IDEA", margin + 4, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  const ideaText = doc.splitTextToSize(entry.response.lesson.coreIdea, contentWidth - 8);
  doc.text(ideaText, margin + 4, y + 8);
  y += 20;

  // ── Key Points ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.dark);
  doc.text("KEY POINTS", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  for (const point of entry.response.lesson.keyPoints.slice(0, 5)) {
    doc.text(`• ${point}`, margin + 2, y);
    y += 4.5;
  }
  y += 4;

  // ── Quick Summary ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.dark);
  doc.text("SUMMARY", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  const summaryLines = doc.splitTextToSize(
    entry.response.lesson.explanation.slice(0, 500),
    contentWidth
  );
  doc.text(summaryLines.slice(0, 12), margin, y);
  y += Math.min(summaryLines.length, 12) * 4 + 4;

  // ── Check Question ──
  if (entry.response.lesson.checkQuestion) {
    doc.setFillColor(...BRAND.primary);
    doc.roundedRect(margin, y - 2, contentWidth, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Self-check: ${entry.response.lesson.checkQuestion}`, margin + 4, y + 5);
  }

  // ── Footer ──
  doc.setFontSize(7);
  doc.setTextColor(...BRAND.muted);
  doc.text(
    "AdaptiveMind AI · Revision Sheet",
    margin,
    doc.internal.pageSize.getHeight() - 8
  );

  doc.save(`adaptivemind-revision-${entry.id}.pdf`);
}

/**
 * Print-friendly lesson view
 */
export function printLesson(entry: LessonHistoryEntry): void {
  const win = window.open("", "_blank");
  if (!win) return;

  const lesson = entry.response.lesson;
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${lesson.title} — AdaptiveMind AI</title>
      <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 2rem auto; color: #1e1c1a; line-height: 1.7; }
        h1 { font-size: 1.5rem; color: #8B6F47; }
        h2 { font-size: 1rem; color: #78736c; margin-top: 1.5rem; }
        .meta { font-size: 0.8rem; color: #78736c; margin-bottom: 1rem; }
        .key-point { padding-left: 1rem; border-left: 3px solid #8B6F47; margin: 0.5rem 0; }
        .check { background: #8B6F4710; padding: 0.75rem 1rem; border-radius: 8px; margin-top: 1.5rem; font-weight: 600; }
        .footer { margin-top: 2rem; font-size: 0.75rem; color: #78736c; border-top: 1px solid #e5e2dd; padding-top: 0.5rem; }
        @media print { body { margin: 1cm; } }
      </style>
    </head>
    <body>
      <h1>${lesson.title}</h1>
      <div class="meta">${entry.subject} · ${entry.level} · ${new Date(entry.date).toLocaleDateString()}</div>
      <h2>Core Idea</h2>
      <p>${lesson.coreIdea}</p>
      <h2>Explanation</h2>
      <p>${lesson.explanation}</p>
      ${lesson.keyPoints.map((p) => `<div class="key-point">${p}</div>`).join("")}
      ${lesson.checkQuestion ? `<div class="check">Self-check: ${lesson.checkQuestion}</div>` : ""}
      ${entry.evaluation ? `<h2>Evaluation</h2><p>Score: ${entry.evaluation.score}% · ${entry.evaluation.status}</p>` : ""}
      <div class="footer">AdaptiveMind AI · Printed ${new Date().toLocaleDateString()}</div>
    </body>
    </html>
  `);
  win.document.close();
  win.print();
}
