"use client";

import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import { learningDimensionLabels, type LearningDimension } from "@/lib/learning-dna";
import type { TutorApiResponse } from "@/lib/ai/types";

interface LessonCardProps {
  response: TutorApiResponse;
}

const dnaColors: Record<LearningDimension, string> = {
  visual: "#22d3ee",
  examples: "#f59e0b",
  analogies: "#8b5cf6",
  stories: "#fb7185",
  challenges: "#fb6a4a",
};

export function LessonCard({ response }: LessonCardProps) {
  const { lesson, source, action } = response;

  const actionLabel = {
    initial: "Personalized lesson",
    simpler: "Simplified explanation",
    different: "A different lens",
    example: "Worked example",
    challenge: "Reasoning challenge",
  }[action];

  return (
    <motion.article
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)] sm:p-8"
      aria-labelledby="lesson-title"
    >
      {/* Header row */}
      <motion.div variants={slideUp} className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--am-primary)]/70">
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
          {source === "demo" && (
            <span className="rounded-full border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-2.5 py-1 text-[10px] font-semibold text-[var(--am-text-muted)]">
              Demo
            </span>
          )}
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        variants={slideUp}
        id="lesson-title"
        className="mt-4 text-2xl font-semibold tracking-tight text-[var(--am-text-primary)] sm:text-3xl"
      >
        {lesson.title}
      </motion.h2>

      {/* Core Idea */}
      <motion.section variants={slideUp} className="mt-7">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-text-muted)]">
          Core idea
        </h3>
        <p className="mt-2 text-lg font-medium leading-8 text-[var(--am-text-primary)]">
          {lesson.coreIdea}
        </p>
      </motion.section>

      {/* Explanation */}
      <motion.section variants={slideUp} className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-text-muted)]">
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
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-text-muted)]">
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
          {lesson.hint && (
            <details className="mt-4 rounded-[var(--am-radius-md)] bg-[var(--am-bg-elevated)]/80 px-4 py-3 text-sm text-[var(--am-text-secondary)]">
              <summary className="cursor-pointer font-semibold text-[var(--am-text-primary)]">
                Optional hint
              </summary>
              <p className="mt-2 leading-6">{lesson.hint}</p>
            </details>
          )}
        </motion.section>
      )}
    </motion.article>
  );
}
