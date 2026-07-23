"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import {
  getExplanationHistoryForConcept,
  getConceptSummary,
  type ExplanationRecord,
} from "@/lib/explanation-history";

const APPROACH_LABELS: Record<string, string> = {
  visual: "Visual",
  examples: "Examples",
  analogies: "Analogies",
  stories: "Stories",
  challenges: "Challenges",
  adaptive: "Adaptive",
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-[var(--am-success)]";
  if (score >= 50) return "text-[var(--am-warning)]";
  return "text-[var(--am-text-muted)]";
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ExplanationHistoryView({
  currentConcept,
}: {
  currentConcept?: string;
}) {
  const [selectedConcept, setSelectedConcept] = useState(currentConcept ?? "");
  const [expanded, setExpanded] = useState(false);

  const records = selectedConcept
    ? getExplanationHistoryForConcept(selectedConcept)
    : [];

  const summary = selectedConcept
    ? getConceptSummary(selectedConcept)
    : null;

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)]"
      role="region"
      aria-label="Explanation history"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--am-primary)]"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
          </svg>
          <span className="text-xs font-semibold text-[var(--am-text-primary)]">
            Explanation history
          </span>
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[var(--am-text-muted)] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <motion.div
          variants={slideUp}
          className="border-t border-[var(--am-border-light)] p-3 pt-3"
        >
          <p className="text-[11px] leading-5 text-[var(--am-text-muted)] mb-2">
            Track which approaches have been tried for each concept and their
            outcomes.
          </p>

          {/* Concept input */}
          <input
            type="text"
            value={selectedConcept}
            onChange={(e) => setSelectedConcept(e.target.value.slice(0, 100))}
            placeholder="Enter a concept name…"
            className="w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-2.5 py-1.5 text-[11px] text-[var(--am-text-primary)] placeholder:text-[var(--am-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--am-primary)]/30 mb-2"
            aria-label="Concept to view history for"
          />

          {!selectedConcept && (
            <p className="text-[11px] text-[var(--am-text-muted)]">
              Type a concept name above to see its explanation history.
            </p>
          )}

          {selectedConcept && records.length === 0 && (
            <p className="text-[11px] text-[var(--am-text-muted)]">
              No explanation history yet for &ldquo;{selectedConcept}&rdquo;.
            </p>
          )}

          {/* Summary */}
          {summary && summary.totalAttempts > 0 && (
            <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-2.5 mb-2">
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-[var(--am-text-muted)]">
                  {summary.totalAttempts} attempt{summary.totalAttempts !== 1 ? "s" : ""}
                </span>
                <span className={scoreColor(summary.averageScore)}>
                  Avg: {Math.round(summary.averageScore)}%
                </span>
                {summary.bestApproach && (
                  <span className="text-[var(--am-primary)]">
                    Strongest observed: {APPROACH_LABELS[summary.bestApproach] ?? summary.bestApproach}
                  </span>
                )}
              </div>
              {summary.approachesTried.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {summary.approachesTried.map((a) => (
                    <span
                      key={a}
                      className="rounded-[var(--am-radius-md)] bg-[var(--am-primary)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--am-primary)]"
                    >
                      {APPROACH_LABELS[a] ?? a}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[10px] leading-4 text-[var(--am-text-muted)]">
                These outcomes are limited evidence and do not prove that one
                approach caused the result.
              </p>
            </div>
          )}

          {/* Records */}
          {records.length > 0 && (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {records.map((r, i) => (
                <RecordRow key={`${r.timestamp}-${i}`} record={r} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function RecordRow({ record }: { record: ExplanationRecord }) {
  return (
    <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-2 text-[11px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-[var(--am-text-secondary)]">
          {APPROACH_LABELS[record.approach] ?? record.approach}
        </span>
        <span className={scoreColor(record.evaluationScore)}>
          {record.evaluationScore}%
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--am-text-muted)]">
        <span>{formatTime(record.timestamp)}</span>
        <span>•</span>
        <span>{record.checkType}</span>
        {record.hintsUsed > 0 && (
          <>
            <span>•</span>
            <span>{record.hintsUsed} hint{record.hintsUsed !== 1 ? "s" : ""}</span>
          </>
        )}
        {record.switchedAway && (
          <>
            <span>•</span>
            <span className="text-[var(--am-warning)]">switched</span>
          </>
        )}
      </div>
      <p className="mt-1 text-[10px] leading-4 text-[var(--am-text-muted)]">
        Mastery estimate: {record.masteryBefore}% to {record.masteryAfter}%.
      </p>
    </div>
  );
}
