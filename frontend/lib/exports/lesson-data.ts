import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import { learningDimensionLabels } from "@/lib/learning-dna";
import {
  escapeHtml,
  formatExportDate,
} from "./common";

export interface LessonExportData {
  topic: string;
  title: string;
  objective: string;
  approach: string;
  whyThisMode: string;
  conciseExplanation: string;
  vocabulary: string[];
  workedExample?: string;
  visualTitle?: string;
  visualSummary?: string;
  visualTextAlternative?: string;
  visualSteps: string[];
  misconception: string;
  takeaways: string[];
  quickRecallQuestion: string;
  applicationQuestion: string;
  sources: Array<{
    title: string;
    type: string;
    reference?: string;
  }>;
  generatedDate: string;
  notice: string;
}

export function buildLessonExportData(
  entry: LessonHistoryEntry,
): LessonExportData {
  const lesson = entry.response.lesson;
  const visual = lesson.visual;
  const misconception =
    entry.evaluation?.misconception
    ?? entry.evaluation?.needsReview?.[0]
    ?? "No specific misconception was recorded for this lesson.";
  return {
    topic: entry.topic,
    title: lesson.title,
    objective: `Build understanding of ${entry.topic}.`,
    approach: lesson.stylesUsed
      .map((style) => learningDimensionLabels[style])
      .join(", "),
    whyThisMode:
      entry.recommendationReason
      ?? "This lesson used the selected teaching approach.",
    conciseExplanation: lesson.explanation,
    vocabulary: lesson.keyPoints.slice(0, 6),
    workedExample: lesson.example,
    visualTitle: visual?.title,
    visualSummary: visual?.summary,
    visualTextAlternative: visual?.textAlternative,
    visualSteps:
      visual?.steps.map(
        (step) => `${step.label}: ${step.description}`,
      ) ?? [],
    misconception,
    takeaways: lesson.keyPoints,
    quickRecallQuestion: lesson.checkQuestion,
    applicationQuestion:
      lesson.practicePrompt
      ?? lesson.challenge
      ?? "Apply the main idea to a new example of your choice.",
    sources:
      entry.response.sources?.map((source) => ({
        title: source.title,
        type: source.type,
        reference: source.url ?? source.domain,
      })) ?? [],
    generatedDate: formatExportDate(entry.date),
    notice:
      "AI-generated learning content can be incorrect. Verify important information with an authoritative source.",
  };
}

function list(items: string[]): string {
  return items.length > 0
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "<p>None recorded.</p>";
}

export function createLessonPrintHtml(entry: LessonHistoryEntry): string {
  const data = buildLessonExportData(entry);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(data.title)} - AdaptiveMind AI</title>
    <style>
      body { color: #1e1c1a; font-family: Arial, sans-serif; line-height: 1.65; margin: 1cm auto; max-width: 48rem; }
      h1 { color: #8b6f47; font-family: Georgia, serif; font-size: 1.7rem; margin-bottom: .25rem; }
      h2 { border-bottom: 1px solid #d9d4cc; font-size: 1rem; margin-top: 1.4rem; padding-bottom: .25rem; }
      .meta, .notice { color: #625e59; font-size: .82rem; }
      .notice { border-top: 1px solid #d9d4cc; margin-top: 1.6rem; padding-top: .7rem; }
      blockquote { border-left: 3px solid #8b6f47; margin-left: 0; padding-left: 1rem; }
      a { color: #6d542f; overflow-wrap: anywhere; }
      @page { margin: 1cm; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(data.title)}</h1>
    <p class="meta">${escapeHtml(data.topic)} | ${escapeHtml(data.approach)} | ${escapeHtml(data.generatedDate)}</p>
    <h2>Objective</h2><p>${escapeHtml(data.objective)}</p>
    <h2>Why this mode</h2><p>${escapeHtml(data.whyThisMode)}</p>
    <h2>Concise explanation</h2><p>${escapeHtml(data.conciseExplanation)}</p>
    <h2>Vocabulary and key concepts</h2>${list(data.vocabulary)}
    ${data.workedExample ? `<h2>Worked example</h2><p>${escapeHtml(data.workedExample)}</p>` : ""}
    ${data.visualTitle ? `
      <h2>Visual explanation: ${escapeHtml(data.visualTitle)}</h2>
      <p>${escapeHtml(data.visualSummary)}</p>
      ${list(data.visualSteps)}
      <p>${escapeHtml(data.visualTextAlternative)}</p>
    ` : ""}
    <h2>Misconception to watch</h2><p>${escapeHtml(data.misconception)}</p>
    <h2>Takeaways</h2>${list(data.takeaways)}
    <h2>Quick recall</h2><blockquote>${escapeHtml(data.quickRecallQuestion)}</blockquote>
    <h2>Application</h2><blockquote>${escapeHtml(data.applicationQuestion)}</blockquote>
    <h2>Sources</h2>${
      data.sources.length
        ? `<ul>${data.sources.map((source) => `
          <li>${escapeHtml(source.title)} (${escapeHtml(source.type)})${
            source.reference ? ` - ${escapeHtml(source.reference)}` : ""
          }</li>
        `).join("")}</ul>`
        : "<p>No external source was attached to this lesson.</p>"
    }
    <p class="notice">${escapeHtml(data.notice)}</p>
  </body>
</html>`;
}
