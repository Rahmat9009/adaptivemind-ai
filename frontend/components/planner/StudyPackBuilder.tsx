"use client";

import { useEffect, useState } from "react";
import { Package, X } from "lucide-react";
import { useOfflineLessons } from "@/hooks/useOfflineLessons";
import {
  loadQuickRecalls,
  type QuickRecallRecord,
} from "@/lib/quick-recall";
import type { StudyPlan } from "@/lib/study-planner";

export function StudyPackBuilder({
  plan,
}: {
  plan: StudyPlan;
}) {
  const { lessons, loading, error } = useOfflineLessons();
  const [open, setOpen] = useState(false);
  const [includePlan, setIncludePlan] = useState(true);
  const [lessonIds, setLessonIds] = useState<string[]>([]);
  const [lessonSelectionTouched, setLessonSelectionTouched] =
    useState(false);
  const [reviews, setReviews] = useState<QuickRecallRecord[]>([]);
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [notesPages, setNotesPages] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const available = loadQuickRecalls().filter(
        (record, index, records) =>
          (!record.completed || record.fullReviewRecommended)
          && records.findIndex(
            (candidate) => candidate.skillId === record.skillId,
          ) === index,
      );
      setReviews(available);
      setReviewIds(available.map((record) => record.skillId));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedLessonIds = lessonSelectionTouched
    ? lessonIds.filter((id) =>
      lessons.some((lesson) => lesson.id === id),
    )
    : lessons.map((lesson) => lesson.id);

  const hasSelection =
    includePlan
    || selectedLessonIds.length > 0
    || reviewIds.length > 0
    || notesPages > 0;

  function toggleId(
    id: string,
    selected: string[],
    setter: (next: string[]) => void,
  ) {
    setter(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  }

  async function generate() {
    if (!hasSelection || generating) return;
    setGenerating(true);
    setMessage(null);
    try {
      const { exportStudyPack } = await import(
        "@/lib/exports/study-pack"
      );
      exportStudyPack({
        plan: includePlan ? plan : null,
        lessons: lessons.filter((lesson) =>
          selectedLessonIds.includes(lesson.id),
        ),
        reviews: reviews
          .filter((review) => reviewIds.includes(review.skillId))
          .map((review) => ({
            id: review.skillId,
            topic: review.topic,
            question: review.question,
          })),
        notesPages,
      });
      setMessage("Offline Study Pack created.");
    } catch (exportError) {
      setMessage(
        exportError instanceof Error
          ? exportError.message
          : "The Offline Study Pack could not be created.",
      );
    } finally {
      setGenerating(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="am-btn am-btn-primary mt-5"
        onClick={() => setOpen(true)}
      >
        <Package size={16} aria-hidden="true" />
        Create Offline Study Pack
      </button>
    );
  }

  return (
    <section
      className="mt-5 border-t border-[var(--am-border-light)] pt-5"
      aria-labelledby="study-pack-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            id="study-pack-title"
            className="text-sm font-semibold text-[var(--am-text-primary)]"
          >
            Offline Study Pack
          </h3>
          <p className="mt-1 text-xs leading-5 text-[var(--am-text-secondary)]">
            Choose fixed content for one printable PDF. New Ada responses are
            not available inside the pack.
          </p>
        </div>
        <button
          type="button"
          className="am-icon-button shrink-0"
          onClick={() => setOpen(false)}
          aria-label="Close Offline Study Pack options"
          title="Close"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <fieldset>
          <legend className="text-xs font-semibold text-[var(--am-text-secondary)]">
            Plan and lessons
          </legend>
          <label className="mt-2 flex min-h-11 items-center gap-3 text-sm text-[var(--am-text-primary)]">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--am-primary)]"
              checked={includePlan}
              onChange={(event) => setIncludePlan(event.target.checked)}
            />
            Current study plan
          </label>
          {loading ? (
            <p className="mt-2 text-xs text-[var(--am-text-muted)]">
              Loading saved lessons...
            </p>
          ) : lessons.length === 0 ? (
            <p className="mt-2 text-xs leading-5 text-[var(--am-text-muted)]">
              Save lessons offline to include them here.
            </p>
          ) : (
            lessons.map((lesson) => (
              <label
                key={lesson.id}
                className="flex min-h-11 items-center gap-3 text-sm text-[var(--am-text-primary)]"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--am-primary)]"
                  checked={selectedLessonIds.includes(lesson.id)}
                  onChange={() => {
                    setLessonSelectionTouched(true);
                    toggleId(
                      lesson.id,
                      selectedLessonIds,
                      setLessonIds,
                    );
                  }}
                />
                {lesson.response.lesson.title}
              </label>
            ))
          )}
        </fieldset>

        <fieldset>
          <legend className="text-xs font-semibold text-[var(--am-text-secondary)]">
            Review activities
          </legend>
          {reviews.length === 0 ? (
            <p className="mt-2 text-xs leading-5 text-[var(--am-text-muted)]">
              No pending quick recall questions.
            </p>
          ) : (
            reviews.map((review) => (
              <label
                key={review.skillId}
                className="flex min-h-11 items-center gap-3 text-sm text-[var(--am-text-primary)]"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--am-primary)]"
                  checked={reviewIds.includes(review.skillId)}
                  onChange={() =>
                    toggleId(review.skillId, reviewIds, setReviewIds)
                  }
                />
                {review.topic}
              </label>
            ))
          )}
          <label className="mt-3 block text-xs font-semibold text-[var(--am-text-secondary)]">
            Blank notes pages
            <input
              type="number"
              min={0}
              max={5}
              value={notesPages}
              onChange={(event) =>
                setNotesPages(
                  Math.max(
                    0,
                    Math.min(5, Number(event.target.value) || 0),
                  ),
                )
              }
              className="mt-1 block w-24 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-3 py-2 text-sm text-[var(--am-text-primary)]"
            />
          </label>
        </fieldset>
      </div>

      {error && (
        <p className="mt-3 text-xs text-[var(--am-error)]" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="am-btn am-btn-primary mt-4"
        disabled={!hasSelection || generating}
        onClick={() => void generate()}
      >
        <Package size={16} aria-hidden="true" />
        {generating ? "Creating pack..." : "Generate PDF"}
      </button>
      <p
        className="mt-2 min-h-5 text-xs text-[var(--am-text-muted)]"
        role="status"
        aria-live="polite"
      >
        {message ?? ""}
      </p>
    </section>
  );
}
