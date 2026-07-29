"use client";

import { useState } from "react";
import {
  Check,
  Download,
  FileText,
  Printer,
  Trash2,
} from "lucide-react";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import { useOfflineLessons } from "@/hooks/useOfflineLessons";

type LessonAction =
  | "save"
  | "remove"
  | "pdf"
  | "revision"
  | "print";

export function LessonExportActions({
  entry,
}: {
  entry: LessonHistoryEntry;
}) {
  const {
    lessons,
    loading,
    error: storageError,
    cacheLesson,
    deleteLesson,
  } = useOfflineLessons();
  const [activeAction, setActiveAction] =
    useState<LessonAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const saved = lessons.some((lesson) => lesson.id === entry.id);

  async function runAction(
    action: LessonAction,
    operation: () => Promise<void>,
    successMessage: string,
  ) {
    if (activeAction) return;
    setActiveAction(action);
    setMessage(null);
    try {
      await operation();
      setMessage(successMessage);
    } catch (actionError) {
      setMessage(
        actionError instanceof Error
          ? actionError.message
          : "That action could not be completed.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <section
      className="mt-7 border-t border-[var(--am-border-light)] pt-5"
      aria-label="Lesson save and export actions"
    >
      <div className="flex flex-wrap items-center gap-2">
        {!saved ? (
          <button
            type="button"
            className="am-btn am-btn-secondary"
            disabled={loading || activeAction !== null}
            onClick={() =>
              void runAction(
                "save",
                async () => {
                  await cacheLesson(entry, entry.recommendationReason);
                },
                "Saved offline on this device.",
              )
            }
          >
            <Download size={16} aria-hidden="true" />
            {activeAction === "save" ? "Saving..." : "Save offline"}
          </button>
        ) : (
          <>
            <span className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-[var(--am-success)]">
              <Check size={16} aria-hidden="true" />
              Saved offline
            </span>
            <button
              type="button"
              className="am-btn am-btn-ghost"
              disabled={activeAction !== null}
              onClick={() => {
                if (
                  !window.confirm(
                    "Remove this lesson's offline copy from this device?",
                  )
                ) {
                  return;
                }
                void runAction(
                  "remove",
                  () => deleteLesson(entry.id),
                  "Offline copy removed.",
                );
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              Remove offline copy
            </button>
          </>
        )}

        <button
          type="button"
          className="am-btn am-btn-ghost"
          disabled={activeAction !== null}
          onClick={() =>
            void runAction(
              "pdf",
              async () => {
                const { exportLessonPDF } = await import(
                  "@/lib/exports/lesson-pdf"
                );
                exportLessonPDF(entry);
              },
              "Lesson PDF created.",
            )
          }
        >
          <FileText size={16} aria-hidden="true" />
          Full PDF
        </button>

        <button
          type="button"
          className="am-btn am-btn-ghost"
          disabled={activeAction !== null}
          onClick={() =>
            void runAction(
              "revision",
              async () => {
                const { exportRevisionSheet } = await import(
                  "@/lib/exports/lesson-pdf"
                );
                exportRevisionSheet(entry);
              },
              "Revision sheet created.",
            )
          }
        >
          <FileText size={16} aria-hidden="true" />
          Revision sheet
        </button>

        <button
          type="button"
          className="am-btn am-btn-ghost"
          disabled={activeAction !== null}
          onClick={() =>
            void runAction(
              "print",
              async () => {
                const { printLesson } = await import(
                  "@/lib/exports/lesson-pdf"
                );
                printLesson(entry);
              },
              "Print view opened.",
            )
          }
        >
          <Printer size={16} aria-hidden="true" />
          Print
        </button>
      </div>
      <p
        className="mt-2 min-h-5 text-xs text-[var(--am-text-muted)]"
        role="status"
        aria-live="polite"
      >
        {message ?? storageError ?? ""}
      </p>
    </section>
  );
}
