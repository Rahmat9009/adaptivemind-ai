"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import { learningDimensionLabels, type LearningDimension } from "@/lib/learning-dna";
import type { TutorApiResponse } from "@/lib/ai/types";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import { LessonExportActions } from "./LessonExportActions";

const SpeechPlayer = dynamic(
  () => import("./SpeechPlayer").then((module) => module.SpeechPlayer),
  { ssr: false },
);

const VisualLessonEngine = dynamic(
  () =>
    import("@/components/visuals/VisualLessonEngine").then(
      (module) => module.VisualLessonEngine,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="mt-7 min-h-48 border-y border-[var(--am-border-light)] py-6 text-sm text-[var(--am-text-muted)]"
        role="status"
      >
        Preparing the visual explanation...
      </div>
    ),
  },
);

interface LessonCardProps {
  response: TutorApiResponse;
  historyEntry?: LessonHistoryEntry;
}

const dnaColors: Record<LearningDimension, string> = {
  visual: "#0891B2",
  examples: "#B45309",
  analogies: "#7C3AED",
  stories: "#BE185D",
  challenges: "#DC2626",
};

export function LessonCard({
  response,
  historyEntry,
}: LessonCardProps) {
  const { lesson, source, action } = response;
  const sourceById = new Map(
    (response.sources ?? []).map((item) => [item.id, item]),
  );

  const actionLabel = {
    initial: "Personalized lesson",
    simpler: "Simplified explanation",
    different: "A different lens",
    example: "Worked example",
    challenge: "Reasoning challenge",
    visualize: "Visual explanation",
  }[action];

  return (
    <motion.article
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6 sm:p-8"
      aria-labelledby="lesson-title"
    >
      {/* Header row */}
      <motion.div variants={slideUp} className="flex flex-wrap items-center justify-between gap-3">
        <p className="am-label text-[var(--am-primary)]/70">
          {actionLabel}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {lesson.stylesUsed.map((style) => (
            <span
              key={style}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{
                backgroundColor: `${dnaColors[style]}15`,
                color: dnaColors[style],
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: dnaColors[style] }}
              />
              {learningDimensionLabels[style]}
            </span>
          ))}
          {(source === "local-fallback" || source === "demo") && (
            <span className="rounded-full border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-2.5 py-1 text-[10px] font-semibold text-[var(--am-text-muted)]">
              Local fallback
            </span>
          )}
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        variants={slideUp}
        id="lesson-title"
        className="am-heading-serif mt-4 text-2xl text-[var(--am-text-primary)] sm:text-3xl"
      >
        {lesson.title}
      </motion.h2>

      {lesson.clarificationQuestion && (
        <motion.p
          variants={slideUp}
          className="mt-4 rounded-[var(--am-radius-lg)] border border-[var(--am-primary)]/25 bg-[var(--am-primary-light)] px-4 py-3 text-sm font-medium leading-6 text-[var(--am-text-primary)]"
        >
          {lesson.clarificationQuestion}
        </motion.p>
      )}

      {response.sources?.length ? (
        <motion.section
          variants={slideUp}
          className="mt-6 border-y border-[var(--am-border-light)] py-4"
          aria-labelledby="lesson-sources-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="lesson-sources-title" className="am-label text-[var(--am-text-muted)]">
              Sources used
            </h3>
            <span className="text-xs font-medium text-[var(--am-text-secondary)]">
              {response.sourceMode === "source-only"
                ? "Source only"
                : "Source + background knowledge"}
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-[var(--am-text-secondary)]">
            {response.sources.map((item) => (
              <li key={item.id} className="flex flex-wrap gap-x-2">
                <span className="font-medium text-[var(--am-text-primary)]">
                  {item.title}
                </span>
                <span>
                  {item.type.toUpperCase()}
                  {item.domain ? ` · ${item.domain}` : ""}
                </span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--am-primary)] underline underline-offset-2"
                  >
                    Original page
                  </a>
                )}
              </li>
            ))}
          </ul>

          {lesson.sourceGrounding?.statements.length ? (
            <div className="mt-3">
              <p className="text-xs font-semibold text-[var(--am-text-secondary)]">
                Source-supported statements
              </p>
              <ul className="mt-1 space-y-2">
                {lesson.sourceGrounding.statements.map((statement, index) => {
                  const attribution = sourceById.get(statement.sourceId);
                  return (
                    <li
                      key={`${statement.sourceId}-${statement.reference ?? index}`}
                      className="text-xs leading-5 text-[var(--am-text-secondary)]"
                    >
                      {statement.statement}{" "}
                      <span className="font-semibold text-[var(--am-text-primary)]">
                        [{attribution?.title ?? "Attached source"}
                        {statement.reference ? `, ${statement.reference}` : ""}]
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <p className="mt-3 text-xs leading-5 text-[var(--am-text-muted)]">
            {lesson.sourceGrounding?.outsideKnowledgeUsed
              ? "Ada also used background knowledge and marked source-supported statements separately."
              : "Ada did not report adding outside knowledge to this response."}
          </p>
        </motion.section>
      ) : null}

      {/* Core Idea */}
      <motion.section variants={slideUp} className="mt-7">
        <h3 className="am-label text-[var(--am-text-muted)]">
          Core idea
        </h3>
        <p className="mt-2 text-lg font-medium leading-8 text-[var(--am-text-primary)]">
          {lesson.coreIdea}
        </p>
      </motion.section>

      {/* Explanation */}
      <motion.section variants={slideUp} className="mt-6">
        <h3 className="am-label text-[var(--am-text-muted)]">
          {action === "simpler"
            ? "Simplified explanation"
            : action === "challenge"
              ? "Reasoning setup"
              : action === "different"
                ? "A different lens"
                : "Explanation"}
        </h3>
        <p className="mt-2 leading-7 text-[var(--am-text-secondary)]">
          {lesson.explanation}
        </p>
      </motion.section>

      {lesson.visual && (
        <VisualLessonEngine
          key={`${response.requestId ?? lesson.title}-visual`}
          visual={lesson.visual}
        />
      )}

      {/* Example */}
      {lesson.example && (
        <motion.section
          variants={slideUp}
          className="mt-6 rounded-[var(--am-radius-xl)] border border-[var(--am-dna-examples)]/20 bg-[var(--am-dna-examples)]/8 p-5"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--am-text-primary)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: dnaColors.examples }}
            />
            {action === "example" ? "Worked example" : "Example"}
          </h3>
          <p className="mt-2 leading-7 text-[var(--am-text-secondary)]">
            {lesson.example}
          </p>
        </motion.section>
      )}

      {/* Analogy */}
      {lesson.analogy && (
        <motion.section
          variants={slideUp}
          className="mt-4 rounded-[var(--am-radius-xl)] border border-[var(--am-dna-analogies)]/20 bg-[var(--am-dna-analogies)]/8 p-5"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--am-text-primary)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: dnaColors.analogies }}
            />
            Analogy
          </h3>
          <p className="mt-2 leading-7 text-[var(--am-text-secondary)]">
            {lesson.analogy}
          </p>
        </motion.section>
      )}

      {/* Key Points */}
      <motion.section variants={slideUp} className="mt-6">
        <h3 className="am-label text-[var(--am-text-muted)]">
          Key points
        </h3>
        <ul className="mt-3 space-y-2">
          {lesson.keyPoints.map((point) => (
            <li
              key={point}
              className="flex gap-3 text-sm leading-6 text-[var(--am-text-secondary)]"
            >
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: dnaColors[lesson.stylesUsed[0] ?? "visual"] }}
              />
              {point}
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Practice prompt */}
      {lesson.practicePrompt && (
        <motion.section
          variants={slideUp}
          className="mt-6 rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] p-5"
        >
          <h3 className="text-sm font-semibold text-[var(--am-text-primary)]">
            Try a similar one
          </h3>
          <p className="mt-2 leading-7 text-[var(--am-text-secondary)]">
            {lesson.practicePrompt}
          </p>
        </motion.section>
      )}

      {/* Challenge */}
      {lesson.challenge && (
        <motion.section
          variants={slideUp}
          className="mt-6 rounded-[var(--am-radius-xl)] border border-[var(--am-dna-challenges)]/20 bg-[var(--am-dna-challenges)]/8 p-5"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--am-text-primary)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: dnaColors.challenges }}
            />
            Your challenge
          </h3>
          <p className="mt-2 leading-7 text-[var(--am-text-secondary)]">
            {lesson.challenge}
          </p>
        </motion.section>
      )}

      <SpeechPlayer
        key={response.requestId ?? lesson.title}
        text={[
          lesson.title,
          lesson.coreIdea,
          lesson.explanation,
          lesson.example,
          lesson.analogy,
          ...lesson.keyPoints,
        ].filter(Boolean).join(". ")}
      />
      {historyEntry && <LessonExportActions entry={historyEntry} />}
    </motion.article>
  );
}
