import type { StudyPlan } from "@/lib/study-planner";
import { downloadBlob, safeExportFilename } from "./common";

function escapeCalendarText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function calendarDate(value: string | undefined, fallback: Date): string {
  const date =
    value && Number.isFinite(Date.parse(value))
      ? new Date(value)
      : fallback;
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
}

function nextCalendarDate(dateValue: string): string {
  const year = Number(dateValue.slice(0, 4));
  const month = Number(dateValue.slice(4, 6)) - 1;
  const day = Number(dateValue.slice(6, 8));
  const next = new Date(Date.UTC(year, month, day + 1));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("");
}

function timestamp(value: Date): string {
  return value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function foldCalendarLine(line: string): string {
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 73) {
    chunks.push(remaining.slice(0, 73));
    remaining = remaining.slice(73);
  }
  chunks.push(remaining);
  return chunks.join("\r\n ");
}

export function createPlanCalendar(
  plan: StudyPlan,
  generatedAt = new Date(),
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AdaptiveMind AI//Local Study Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const day of plan.days) {
    const date = calendarDate(day.date, generatedAt);
    for (const task of day.tasks) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${escapeCalendarText(`${plan.id}-${task.id}`)}@adaptivemind.local`,
        `DTSTAMP:${timestamp(generatedAt)}`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${nextCalendarDate(date)}`,
        `SUMMARY:${escapeCalendarText(`${task.topic}: ${task.type.replace("-", " ")}`)}`,
        `DESCRIPTION:${escapeCalendarText(`${task.reason}\nEstimated time: ${task.minutes} minutes\nRecommended approach: ${task.teachingApproach.join(", ")}\nMastery target: ${task.masteryTarget ?? 60}%`)}`,
        `STATUS:${task.completed ? "COMPLETED" : "CONFIRMED"}`,
        "END:VEVENT",
      );
    }
  }
  lines.push("END:VCALENDAR", "");
  return lines.map(foldCalendarLine).join("\r\n");
}

export function exportPlanCalendar(plan: StudyPlan): void {
  const calendar = createPlanCalendar(plan);
  downloadBlob(
    new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
    safeExportFilename("adaptivemind-plan", plan.id, "ics"),
  );
}
