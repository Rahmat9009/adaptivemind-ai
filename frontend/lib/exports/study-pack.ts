import jsPDF from "jspdf";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import {
  studyPlanGoalLabels,
  type StudyPlan,
} from "@/lib/study-planner";
import {
  buildLessonExportData,
} from "./lesson-data";
import {
  formatExportDate,
  safeExportFilename,
} from "./common";

export interface StudyPackReviewItem {
  id: string;
  topic: string;
  question: string;
}

export interface StudyPackData {
  plan?: StudyPlan | null;
  lessons: LessonHistoryEntry[];
  reviews?: StudyPackReviewItem[];
  notesPages?: number;
}

const BRAND = {
  primary: [139, 111, 71] as [number, number, number],
  dark: [30, 28, 26] as [number, number, number],
  muted: [100, 96, 90] as [number, number, number],
  light: [250, 248, 245] as [number, number, number],
};

export function createStudyPackDocument(data: StudyPackData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPage = (title: string) => {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...BRAND.dark);
    doc.text(title, margin, margin);
    y = margin + 10;
  };
  const ensureSpace = (height: number, title = "Study Pack") => {
    if (y + height < pageHeight - 18) return;
    addPage(`${title} - continued`);
  };
  const addText = (
    value: string,
    options: {
      bold?: boolean;
      indent?: number;
      fontSize?: number;
      section?: string;
    } = {},
  ) => {
    const indent = options.indent ?? 0;
    doc.setFont(
      "helvetica",
      options.bold ? "bold" : "normal",
    );
    doc.setFontSize(options.fontSize ?? 9.5);
    doc.setTextColor(
      ...(options.bold ? BRAND.dark : BRAND.muted),
    );
    const lines = doc.splitTextToSize(
      value,
      contentWidth - indent,
    ) as string[];
    ensureSpace(
      lines.length * 4.5 + 2,
      options.section ?? "Study Pack",
    );
    doc.text(lines, margin + indent, y);
    y += lines.length * 4.5 + 2;
  };

  doc.setFillColor(...BRAND.light);
  doc.rect(0, 0, pageWidth, 112, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  doc.setTextColor(...BRAND.dark);
  doc.text("AdaptiveMind AI", margin, 47);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.primary);
  doc.text("Offline Study Pack", margin, 63);
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Generated ${formatExportDate(new Date())}`, margin, 77);
  if (data.plan) {
    doc.text(
      `Goal: ${studyPlanGoalLabels[data.plan.goal]}`,
      margin,
      85,
    );
  }
  doc.text(
    `${data.lessons.length} selected lesson${
      data.lessons.length === 1 ? "" : "s"
    }, ${data.reviews?.length ?? 0} review activit${
      data.reviews?.length === 1 ? "y" : "ies"
    }`,
    margin,
    93,
  );
  y = 128;
  addText(
    "Connectivity notice",
    { bold: true, section: "Cover" },
  );
  addText(
    "This pack is a fixed offline copy. It does not create new Ada responses or submit understanding checks. Reconnect to request new explanations or AI evaluation.",
    { section: "Cover" },
  );
  y += 4;
  addText("Contents", { bold: true, section: "Cover" });
  if (data.plan) addText("[ ] Study plan", { indent: 3 });
  for (const lesson of data.lessons) {
    addText(`[ ] ${lesson.response.lesson.title}`, { indent: 3 });
  }
  for (const review of data.reviews ?? []) {
    addText(`[ ] Review: ${review.topic}`, { indent: 3 });
  }
  if ((data.notesPages ?? 0) > 0) {
    addText(
      `[ ] ${data.notesPages} notes page${
        data.notesPages === 1 ? "" : "s"
      }`,
      { indent: 3 },
    );
  }

  if (data.plan) {
    addPage("Study Plan");
    addText(`Goal: ${studyPlanGoalLabels[data.plan.goal]}`, {
      bold: true,
      section: "Study Plan",
    });
    addText(data.plan.summary, { section: "Study Plan" });
    y += 3;
    for (const day of data.plan.days) {
      addText(
        `Day ${day.dayNumber}${
          day.date ? ` - ${formatExportDate(day.date)}` : ""
        }: ${day.focus}`,
        { bold: true, section: "Study Plan" },
      );
      for (const task of day.tasks) {
        addText(
          `${task.completed ? "[x]" : "[ ]"} ${task.topic} - ${task.type.replace("-", " ")} (${task.minutes} min)`,
          { indent: 3, section: "Study Plan" },
        );
        addText(
          `Approach: ${task.teachingApproach.join(", ")}. ${task.reason}`,
          {
            indent: 7,
            fontSize: 8.5,
            section: "Study Plan",
          },
        );
      }
      y += 2;
    }
  }

  for (const entry of data.lessons) {
    const lesson = buildLessonExportData(entry);
    addPage(lesson.title);
    addText(`Topic: ${lesson.topic}`, {
      bold: true,
      section: lesson.title,
    });
    addText(`Objective: ${lesson.objective}`, {
      section: lesson.title,
    });
    addText(`Approach: ${lesson.approach}`, {
      section: lesson.title,
    });
    addText(`Why this mode: ${lesson.whyThisMode}`, {
      section: lesson.title,
    });
    y += 2;
    addText("Explanation", {
      bold: true,
      section: lesson.title,
    });
    addText(lesson.conciseExplanation, {
      section: lesson.title,
    });
    if (lesson.workedExample) {
      addText("Worked example", {
        bold: true,
        section: lesson.title,
      });
      addText(lesson.workedExample, {
        section: lesson.title,
      });
    }
    if (lesson.visualTitle) {
      addText(`Visual: ${lesson.visualTitle}`, {
        bold: true,
        section: lesson.title,
      });
      for (const step of lesson.visualSteps) {
        addText(`- ${step}`, {
          indent: 3,
          section: lesson.title,
        });
      }
      if (lesson.visualTextAlternative) {
        addText(lesson.visualTextAlternative, {
          section: lesson.title,
        });
      }
    }
    addText("Takeaways", {
      bold: true,
      section: lesson.title,
    });
    for (const takeaway of lesson.takeaways) {
      addText(`- ${takeaway}`, {
        indent: 3,
        section: lesson.title,
      });
    }
    addText(`Quick recall: ${lesson.quickRecallQuestion}`, {
      bold: true,
      section: lesson.title,
    });
    addText(`Application: ${lesson.applicationQuestion}`, {
      section: lesson.title,
    });
    addText("Sources", {
      bold: true,
      section: lesson.title,
    });
    if (lesson.sources.length === 0) {
      addText("No external source was attached.", {
        indent: 3,
        section: lesson.title,
      });
    } else {
      for (const source of lesson.sources) {
        addText(
          `- ${source.title} (${source.type})${
            source.reference ? ` - ${source.reference}` : ""
          }`,
          { indent: 3, section: lesson.title },
        );
      }
    }
    addText(lesson.notice, {
      fontSize: 8,
      section: lesson.title,
    });
  }

  if ((data.reviews?.length ?? 0) > 0) {
    addPage("Review Activities");
    addText(
      "Answer from memory before checking a saved lesson.",
      { section: "Review Activities" },
    );
    for (const [index, review] of (data.reviews ?? []).entries()) {
      addText(
        `${index + 1}. [ ] ${review.topic}`,
        { bold: true, section: "Review Activities" },
      );
      addText(review.question, {
        indent: 3,
        section: "Review Activities",
      });
      ensureSpace(20, "Review Activities");
      for (let line = 0; line < 3; line++) {
        doc.setDrawColor(210, 205, 198);
        doc.line(margin + 3, y, pageWidth - margin, y);
        y += 7;
      }
    }
  }

  const notesPages = Math.max(
    0,
    Math.min(5, Math.floor(data.notesPages ?? 0)),
  );
  for (let page = 0; page < notesPages; page++) {
    addPage(`Notes ${page + 1}`);
    doc.setDrawColor(210, 205, 198);
    while (y < pageHeight - 18) {
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `AdaptiveMind AI - Offline Study Pack - Page ${page} of ${pageCount}`,
      margin,
      pageHeight - 8,
    );
  }
  return doc;
}

export function exportStudyPack(data: StudyPackData): void {
  createStudyPackDocument(data).save(
    safeExportFilename(
      "adaptivemind-study-pack",
      data.plan?.id ?? "selected-lessons",
      "pdf",
    ),
  );
}
