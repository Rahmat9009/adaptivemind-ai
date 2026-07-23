import {
  studyPlanGoalLabels,
  type StudyPlan,
} from "@/lib/study-planner";
import {
  escapeHtml,
  formatExportDate,
} from "./common";

export function createPlanPrintHtml(plan: StudyPlan): string {
  const days = plan.days.map((day) => `
    <section>
      <h2>Day ${day.dayNumber}${
        day.date ? ` - ${escapeHtml(formatExportDate(day.date))}` : ""
      }: ${escapeHtml(day.focus)}</h2>
      ${day.tasks.map((task) => `
        <article>
          <h3>${task.completed ? "[x]" : "[ ]"} ${escapeHtml(task.topic)}</h3>
          <dl>
            <dt>Task type</dt><dd>${escapeHtml(task.type.replace("-", " "))}</dd>
            <dt>Recommended approach</dt><dd>${escapeHtml(task.teachingApproach.join(", "))}</dd>
            <dt>Reason</dt><dd>${escapeHtml(task.reason)}</dd>
            <dt>Estimated time</dt><dd>${task.minutes} minutes</dd>
            <dt>Mastery target</dt><dd>${task.masteryTarget ?? 60}%</dd>
            <dt>Review date</dt><dd>${
              task.reviewDate
                ? escapeHtml(formatExportDate(task.reviewDate))
                : "Not scheduled"
            }</dd>
            <dt>Status</dt><dd>${task.completed ? "Completed" : "Pending"}</dd>
            <dt>Notes</dt><dd>${escapeHtml(task.notes?.trim() || "____________________________")}</dd>
          </dl>
        </article>
      `).join("")}
    </section>
  `).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>AdaptiveMind Study Plan</title>
    <style>
      body { color: #1e1c1a; font-family: Arial, sans-serif; line-height: 1.5; margin: 1cm; }
      h1 { color: #8b6f47; font-family: Georgia, serif; margin-bottom: .25rem; }
      h2 { border-bottom: 2px solid #8b6f47; font-size: 1.1rem; margin-top: 1.5rem; padding-bottom: .3rem; }
      h3 { font-size: .95rem; margin-bottom: .4rem; }
      article { break-inside: avoid; border-bottom: 1px solid #ddd8d1; padding: .6rem 0; }
      dl { display: grid; grid-template-columns: 10rem 1fr; font-size: .82rem; gap: .2rem .6rem; margin: 0; }
      dt { color: #625e59; font-weight: 700; }
      dd { margin: 0; }
      .meta { color: #625e59; font-size: .85rem; }
      @page { margin: 1cm; }
    </style>
  </head>
  <body>
    <h1>AdaptiveMind AI Study Plan</h1>
    <p class="meta">Goal: ${escapeHtml(studyPlanGoalLabels[plan.goal])}<br>
    Duration: ${plan.durationDays} days<br>
    Generated: ${escapeHtml(formatExportDate(new Date()))}</p>
    <p>${escapeHtml(plan.summary)}</p>
    ${days}
  </body>
</html>`;
}

export function printPlan(plan: StudyPlan): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Allow pop-ups to print the study plan.");
  }
  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(createPlanPrintHtml(plan));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
