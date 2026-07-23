import ExcelJS from "exceljs";
import type { StudyPlan } from "@/lib/study-planner";
import {
  downloadBlob,
  safeExportFilename,
} from "./common";
import {
  buildPlannerSummaryRows,
  buildPlannerTaskRows,
} from "./planner-data";

const headerStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF8B6F47" },
  },
  alignment: { vertical: "middle", wrapText: true },
};

export function createPlanWorkbook(plan: StudyPlan): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AdaptiveMind AI";
  workbook.created = new Date();

  const studyPlan = workbook.addWorksheet("Study Plan", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  studyPlan.columns = [
    { header: "Day", key: "Day", width: 8 },
    { header: "Date", key: "Date", width: 16 },
    { header: "Topic", key: "Topic", width: 28 },
    { header: "Task Type", key: "Task Type", width: 20 },
    {
      header: "Recommended Approach",
      key: "Recommended Approach",
      width: 26,
    },
    { header: "Reason", key: "Reason", width: 52 },
    {
      header: "Estimated Minutes",
      key: "Estimated Minutes",
      width: 18,
    },
    {
      header: "Mastery Target",
      key: "Mastery Target",
      width: 16,
    },
    { header: "Review Date", key: "Review Date", width: 16 },
    { header: "Status", key: "Status", width: 14 },
    { header: "Notes", key: "Notes", width: 38 },
  ];
  studyPlan.getRow(1).height = 30;
  Object.assign(studyPlan.getRow(1), { style: headerStyle });
  studyPlan.addRows(buildPlannerTaskRows(plan));
  studyPlan.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "top", wrapText: true };
    }
  });
  studyPlan.autoFilter = {
    from: "A1",
    to: "K1",
  };

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Field", key: "Field", width: 28 },
    { header: "Value", key: "Value", width: 44 },
  ];
  Object.assign(summary.getRow(1), { style: headerStyle });
  summary.addRows(buildPlannerSummaryRows(plan));
  summary.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "top", wrapText: true };
    }
  });

  return workbook;
}

export async function exportPlanExcel(plan: StudyPlan): Promise<void> {
  const buffer = await createPlanWorkbook(plan).xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    safeExportFilename("adaptivemind-study-plan", plan.id, "xlsx"),
  );
}
