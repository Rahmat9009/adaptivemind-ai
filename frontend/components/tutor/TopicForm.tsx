"use client";

import { motion } from "motion/react";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/motion";
import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import type { TeachingMode } from "@/lib/ai/types";
import {
  learningDimensionLabels,
  type LearningScores,
} from "@/lib/learning-dna";

interface TopicFormProps {
  topic: string;
  subject: string;
  level: string;
  scores: LearningScores;
  teachingMode: TeachingMode;
  isLoading: boolean;
  onTopicChange: (topic: string) => void;
  onSubjectChange: (subject: string) => void;
  onLevelChange: (level: string) => void;
  onTeachingModeChange: (mode: TeachingMode) => void;
  onSubmit: () => void;
}

const suggestions = [
  "Photosynthesis",
  "Newton's First Law",
  "The Pythagorean theorem",
];

const teachingModes: Array<{
  value: TeachingMode;
  label: string;
  description: string;
}> = [
  {
    value: "adaptive",
    label: "Use my Learning DNA",
    description: "Ada blends your strongest preferences.",
  },
  {
    value: "visual",
    label: "Visual breakdown",
    description: "See the structure and relationships.",
  },
  {
    value: "example",
    label: "Practical example",
    description: "Start with a concrete situation.",
  },
  {
    value: "analogy",
    label: "Analogy",
    description: "Connect the idea to something familiar.",
  },
  {
    value: "story",
    label: "Story",
    description: "Use a concise, contextual scenario.",
  },
  {
    value: "challenge",
    label: "Challenge",
    description: "Reason through a guided question.",
  },
];

export function TopicForm({
  topic,
  subject,
  level,
  scores,
  teachingMode,
  isLoading,
  onTopicChange,
  onSubjectChange,
  onLevelChange,
  onTeachingModeChange,
  onSubmit,
}: TopicFormProps) {
  const profile = buildTeachingProfile(scores);
  const [primary, secondary] = profile.dominantDimensions;
  const selectedMode = teachingModes.find(
    (mode) => mode.value === teachingMode,
  );

  return (
    <motion.form
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-5 shadow-[var(--am-shadow-sm)] sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <motion.div variants={slideUp}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-text-muted)]">
          What to learn
        </p>

        <label htmlFor="topic" className="sr-only">
          Ask Ada what you want to learn
        </label>
        <input
          id="topic"
          value={topic}
          onChange={(event) => onTopicChange(event.target.value)}
          maxLength={160}
          placeholder="For example, explain Newton's First Law"
          className="mt-3 w-full rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-4 py-3.5 text-base text-[var(--am-text-primary)] outline-none transition placeholder:text-[var(--am-text-muted)] focus:border-[var(--am-primary)] focus:bg-[var(--am-bg-elevated)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
          autoComplete="off"
        />
      </motion.div>

      <motion.div variants={slideUp} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-[var(--am-text-secondary)]">
          Subject
          <select
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            className="mt-1 w-full rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] px-3 py-2.5 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
          >
            <option>Science</option>
            <option>Mathematics</option>
            <option>History</option>
            <option>Literature</option>
            <option>General learning</option>
          </select>
        </label>
        <label className="text-sm font-medium text-[var(--am-text-secondary)]">
          Level
          <select
            value={level}
            onChange={(event) => onLevelChange(event.target.value)}
            className="mt-1 w-full rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] px-3 py-2.5 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
          >
            <option>High school</option>
            <option>University</option>
            <option>Independent learner</option>
            <option>Beginner</option>
          </select>
        </label>
      </motion.div>

      {/* Teaching mode selector */}
      <motion.fieldset
        variants={slideUp}
        className="mt-6 border-t border-[var(--am-border-light)] pt-6"
      >
        <legend className="text-sm font-semibold text-[var(--am-text-primary)]">
          Teaching mode
        </legend>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-3 grid gap-2 sm:grid-cols-2"
        >
          {teachingModes.map((mode) => {
            const isSelected = teachingMode === mode.value;
            return (
              <motion.label
                key={mode.value}
                variants={staggerItem}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-[var(--am-radius-lg)] border p-3 transition-all ${
                  isSelected
                    ? "border-[var(--am-primary)] bg-[var(--am-primary-light)]"
                    : "border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] hover:border-[var(--am-primary)]/30 hover:bg-[var(--am-bg-reading)]"
                }`}
              >
                <input
                  type="radio"
                  name="teaching-mode"
                  value={mode.value}
                  checked={isSelected}
                  onChange={() => onTeachingModeChange(mode.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-[var(--am-text-primary)]">
                  {mode.label}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--am-text-secondary)]">
                  {mode.description}
                </span>
              </motion.label>
            );
          })}
        </motion.div>
        <p className="mt-3 text-xs leading-5 text-[var(--am-text-muted)]">
          Your profile favors{" "}
          <span className="font-medium text-[var(--am-text-secondary)]">
            {learningDimensionLabels[primary]} +{" "}
            {learningDimensionLabels[secondary]}
          </span>
          .{" "}
          {teachingMode === "adaptive"
            ? "Ada will use both as a starting point."
            : `You chose ${selectedMode?.label}.`}
        </p>
      </motion.fieldset>

      {/* Bottom: suggestions + submit */}
      <motion.div
        variants={slideUp}
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-wrap gap-2" aria-label="Example topics">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onTopicChange(suggestion)}
              className="rounded-full border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-3 py-1.5 text-xs font-medium text-[var(--am-text-secondary)] transition-colors hover:border-[var(--am-primary)]/40 hover:text-[var(--am-primary)]"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="am-btn am-btn-primary"
        >
          {isLoading ? "Preparing lesson..." : "Teach me"}
        </button>
      </motion.div>
    </motion.form>
  );
}
