/**
 * AdaptiveMind 2.0 — Confidence Calibration
 *
 * Tracks the relationship between self-reported confidence and actual
 * performance. Classifies calibration patterns to:
 *  - Improve tutor feedback
 *  - Inform mastery interpretation
 *  - Adjust Learning DNA evidence weighting
 *  - Provide dashboard reflection
 */

export type ConfidenceLevel = "low" | "somewhat" | "confident" | "very";

export interface ConfidenceRecord {
  /** Self-reported confidence (0–100) */
  selfReported: number;
  /** Actual score from understanding check (0–100) */
  actualScore: number;
  /** Timestamp */
  timestamp: string;
  /** Topic/skill being assessed */
  skillId: string;
  /** Teaching approach used */
  approach: string;
}

export type CalibrationCategory =
  | "well-calibrated"
  | "overconfident"
  | "underconfident"
  | "low-confidence-low-understanding"
  | "insufficient-data";

export interface CalibrationSummary {
  category: CalibrationCategory;
  description: string;
  averageConfidence: number;
  averagePerformance: number;
  gap: number; // positive = overconfident, negative = underconfident
  recordCount: number;
}

const CALIBRATION_STORAGE_KEY = "adaptivemind-confidence-calibration";

// ──────────────────────────────────────
// Storage
// ──────────────────────────────────────

export function loadCalibrationRecords(): ConfidenceRecord[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(CALIBRATION_STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(value)) return [];
    return value.filter(
      (r): r is ConfidenceRecord =>
        typeof r === "object" &&
        r !== null &&
        typeof r.selfReported === "number" &&
        typeof r.actualScore === "number" &&
        typeof r.skillId === "string" &&
        typeof r.approach === "string",
    );
  } catch {
    return [];
  }
}

export function saveCalibrationRecord(record: ConfidenceRecord): void {
  const records = loadCalibrationRecords();
  records.unshift(record);
  // Keep last 100 records
  localStorage.setItem(
    CALIBRATION_STORAGE_KEY,
    JSON.stringify(records.slice(0, 100)),
  );
}

// ──────────────────────────────────────
// Calibration classification
// ──────────────────────────────────────

export function classifyCalibration(
  records: ConfidenceRecord[],
): CalibrationSummary {
  if (records.length < 2) {
    return {
      category: "insufficient-data",
      description: "More confidence checks will improve calibration tracking.",
      averageConfidence: 0,
      averagePerformance: 0,
      gap: 0,
      recordCount: records.length,
    };
  }

  const avgConfidence =
    records.reduce((s, r) => s + r.selfReported, 0) / records.length;
  const avgPerformance =
    records.reduce((s, r) => s + r.actualScore, 0) / records.length;
  const gap = avgConfidence - avgPerformance;

  let category: CalibrationCategory;
  let description: string;

  if (Math.abs(gap) < 10) {
    category = "well-calibrated";
    description = `Your confidence matches your performance well. Average confidence was ${Math.round(avgConfidence)}% and average score was ${Math.round(avgPerformance)}%.`;
  } else if (gap > 20) {
    category = "overconfident";
    description = `You reported higher confidence (avg ${Math.round(avgConfidence)}%) than your actual scores reflected (avg ${Math.round(avgPerformance)}%). Trying to identify specific gaps before confirming understanding may help.`;
  } else if (gap < -10) {
    category = "underconfident";
    description = `You tend to underrate your understanding (avg confidence ${Math.round(avgConfidence)}% vs avg score ${Math.round(avgPerformance)}%). You may know more than you think.`;
  } else if (avgPerformance < 50 && avgConfidence < 40) {
    category = "low-confidence-low-understanding";
    description = `Your confidence and performance both suggest this material is still being learned. That is a normal part of the process.`;
  } else {
    category = "well-calibrated";
    description = "Your confidence and performance are reasonably aligned.";
  }

  return {
    category,
    description,
    averageConfidence: Math.round(avgConfidence),
    averagePerformance: Math.round(avgPerformance),
    gap: Math.round(gap),
    recordCount: records.length,
  };
}

// ──────────────────────────────────────
// Map confidence level to numerical value
// ──────────────────────────────────────

export function confidenceLevelToNumber(level: ConfidenceLevel): number {
  switch (level) {
    case "low":
      return 25;
    case "somewhat":
      return 50;
    case "confident":
      return 75;
    case "very":
      return 95;
  }
}

export function confidenceLevelFromNumber(value: number): ConfidenceLevel {
  if (value <= 35) return "low";
  if (value <= 60) return "somewhat";
  if (value <= 85) return "confident";
  return "very";
}

// ──────────────────────────────────────
// Generate supportive feedback
// ──────────────────────────────────────

export function generateConfidenceFeedback(
  calibration: CalibrationSummary,
): string {
  switch (calibration.category) {
    case "well-calibrated":
      return "You have a good sense of what you know, which helps focus your study.";
    case "overconfident":
      return `You felt confident, but one key idea may still need attention. Let us check it from a different angle.`;
    case "underconfident":
      return `You understood more than you gave yourself credit for. Noticing what you know is part of the learning process.`;
    case "low-confidence-low-understanding":
      return `This topic is still coming together, and you are aware of where you are. Keep working through it.`;
    case "insufficient-data":
      return `Confidence tracking helps AdaptiveMind personalise feedback. Try answering a confidence question before your next check.`;
  }
}
