import jsPDF from "jspdf";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import {
  safeExportFilename,
} from "./common";
import {
  buildLessonExportData,
  createLessonPrintHtml,
} from "./lesson-data";

const BRAND = {
  primary: [139, 111, 71] as [number, number, number],
  dark: [30, 28, 26] as [number, number, number],
  muted: [100, 96, 90] as [number, number, number],
  light: [250, 248, 245] as [number, number, number],
};

function createDocument(title: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 52;

  const addHeader = (continuation = false) => {
    doc.setFillColor(...BRAND.light);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...BRAND.dark);
    doc.text("AdaptiveMind AI", margin, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.primary);
    doc.text(
      continuation ? `${title} - continued` : title,
      margin,
      28,
    );
    y = 48;
  };
  const ensureSpace = (height: number) => {
    if (y + height < pageHeight - 17) return;
    doc.addPage();
    addHeader(true);
  };
  const addSection = (
    heading: string,
    values: string | string[],
  ) => {
    const items = Array.isArray(values) ? values : [values];
    if (items.length === 0) return;
    ensureSpace(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.dark);
    doc.text(heading, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND.muted);
    for (const item of items) {
      const prefix = Array.isArray(values) ? "- " : "";
      const lines = doc.splitTextToSize(
        `${prefix}${item}`,
        contentWidth,
      ) as string[];
      ensureSpace(lines.length * 4.5 + 2);
      doc.text(lines, margin, y);
      y += lines.length * 4.5 + 2;
    }
    y += 3;
  };

  addHeader();
  return {
    doc,
    pageHeight,
    margin,
    addSection,
  };
}

export function createLessonPdfDocument(
  entry: LessonHistoryEntry,
): jsPDF {
  const data = buildLessonExportData(entry);
  const {
    doc,
    pageHeight,
    margin,
    addSection,
  } = createDocument(data.title);

  addSection("Topic", data.topic);
  addSection("Objective", data.objective);
  addSection("Explanation approach", data.approach);
  addSection("Why this mode", data.whyThisMode);
  addSection("Concise explanation", data.conciseExplanation);
  addSection("Vocabulary and key concepts", data.vocabulary);
  if (data.workedExample) {
    addSection("Worked example", data.workedExample);
  }
  if (data.visualTitle) {
    addSection("Visual explanation", [
      data.visualTitle,
      data.visualSummary ?? "",
      ...data.visualSteps,
      data.visualTextAlternative ?? "",
    ].filter(Boolean));
  }
  addSection("Misconception to watch", data.misconception);
  addSection("Takeaways", data.takeaways);
  addSection("Quick recall question", data.quickRecallQuestion);
  addSection("Application question", data.applicationQuestion);
  addSection(
    "Sources",
    data.sources.length > 0
      ? data.sources.map(
        (source) =>
          `${source.title} (${source.type})${
            source.reference ? ` - ${source.reference}` : ""
          }`,
      )
      : "No external source was attached to this lesson.",
  );
  addSection("Generated", data.generatedDate);
  addSection("AI-generated content notice", data.notice);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `AdaptiveMind AI - Page ${page} of ${pages}`,
      margin,
      pageHeight - 8,
    );
  }
  return doc;
}

export function exportLessonPDF(entry: LessonHistoryEntry): void {
  createLessonPdfDocument(entry).save(
    safeExportFilename("adaptivemind-lesson", entry.topic, "pdf"),
  );
}

export function createRevisionSheetDocument(
  entry: LessonHistoryEntry,
): jsPDF {
  const data = buildLessonExportData(entry);
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 30;

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Revision: ${data.title}`.slice(0, 90), margin, 14);

  const compactSection = (
    heading: string,
    value: string | string[],
    maxLines: number,
  ) => {
    if (y > pageHeight - 30) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.dark);
    doc.text(heading.toUpperCase(), margin, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    const text = Array.isArray(value)
      ? value.map((item) => `- ${item}`).join("\n")
      : value;
    const lines = (doc.splitTextToSize(text, contentWidth) as string[])
      .slice(0, maxLines);
    doc.text(lines, margin, y);
    y += lines.length * 3.8 + 4;
  };

  compactSection("Core idea", entry.response.lesson.coreIdea, 5);
  compactSection("Why this mode", data.whyThisMode, 4);
  compactSection("Takeaways", data.takeaways.slice(0, 5), 10);
  if (data.workedExample) {
    compactSection("Worked example", data.workedExample, 7);
  }
  if (data.visualTitle) {
    compactSection(
      `Visual: ${data.visualTitle}`,
      data.visualSteps.slice(0, 5),
      8,
    );
  }
  compactSection("Misconception to watch", data.misconception, 4);
  compactSection("Quick recall", data.quickRecallQuestion, 4);
  compactSection("Application", data.applicationQuestion, 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...BRAND.muted);
  const notice = doc.splitTextToSize(data.notice, contentWidth) as string[];
  doc.text(notice.slice(0, 2), margin, pageHeight - 12);
  return doc;
}

export function exportRevisionSheet(entry: LessonHistoryEntry): void {
  createRevisionSheetDocument(entry).save(
    safeExportFilename(
      "adaptivemind-revision",
      entry.topic,
      "pdf",
    ),
  );
}

export function printLesson(entry: LessonHistoryEntry): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Allow pop-ups to print this lesson.");
  }
  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(createLessonPrintHtml(entry));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
