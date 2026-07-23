"use client";

import { useState } from "react";
import {
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Printer,
} from "lucide-react";
import type { StudyPlan } from "@/lib/study-planner";

type ExportKind = "pdf" | "excel" | "print" | "calendar";

export function PlannerExportToolbar({
  plan,
}: {
  plan: StudyPlan;
}) {
  const [active, setActive] = useState<ExportKind | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(
    kind: ExportKind,
    operation: () => Promise<void>,
    success: string,
  ) {
    if (active) return;
    setActive(kind);
    setMessage(null);
    try {
      await operation();
      setMessage(success);
    } catch (exportError) {
      setMessage(
        exportError instanceof Error
          ? exportError.message
          : "The export could not be created.",
      );
    } finally {
      setActive(null);
    }
  }

  return (
    <section
      className="mt-5 border-t border-[var(--am-border-light)] pt-5"
      aria-labelledby="planner-export-title"
    >
      <h3
        id="planner-export-title"
        className="text-sm font-semibold text-[var(--am-text-primary)]"
      >
        Export this plan
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="am-btn am-btn-secondary"
          disabled={active !== null}
          onClick={() =>
            void run(
              "pdf",
              async () => {
                const { exportPlanPDF } = await import(
                  "@/lib/exports/planner-pdf"
                );
                exportPlanPDF(plan);
              },
              "Planner PDF created.",
            )
          }
        >
          <FileText size={16} aria-hidden="true" />
          PDF
        </button>
        <button
          type="button"
          className="am-btn am-btn-secondary"
          disabled={active !== null}
          onClick={() =>
            void run(
              "excel",
              async () => {
                const { exportPlanExcel } = await import(
                  "@/lib/exports/planner-excel"
                );
                await exportPlanExcel(plan);
              },
              "Planner Excel workbook created.",
            )
          }
        >
          <FileSpreadsheet size={16} aria-hidden="true" />
          Excel
        </button>
        <button
          type="button"
          className="am-btn am-btn-secondary"
          disabled={active !== null}
          onClick={() =>
            void run(
              "print",
              async () => {
                const { printPlan } = await import(
                  "@/lib/exports/planner-print"
                );
                printPlan(plan);
              },
              "Print view opened.",
            )
          }
        >
          <Printer size={16} aria-hidden="true" />
          Print
        </button>
        <button
          type="button"
          className="am-btn am-btn-secondary"
          disabled={active !== null}
          onClick={() =>
            void run(
              "calendar",
              async () => {
                const { exportPlanCalendar } = await import(
                  "@/lib/exports/planner-calendar"
                );
                exportPlanCalendar(plan);
              },
              "Calendar file created.",
            )
          }
        >
          <CalendarDays size={16} aria-hidden="true" />
          Calendar (.ics)
        </button>
      </div>
      <p
        className="mt-2 min-h-5 text-xs text-[var(--am-text-muted)]"
        role="status"
        aria-live="polite"
      >
        {active ? "Preparing export..." : message ?? ""}
      </p>
    </section>
  );
}
