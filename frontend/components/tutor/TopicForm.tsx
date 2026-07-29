"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import type { TeachingMode } from "@/lib/ai/types";
import type {
  SourceGroundingMode,
  TutorSource,
} from "@/lib/sources";
import {
  learningDimensionLabels,
  type LearningScores,
} from "@/lib/learning-dna";
import { AdaComposer } from "./AdaComposer";

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
  onSubmit: (
    sources: TutorSource[],
    sourceMode: SourceGroundingMode | undefined,
  ) => Promise<void> | void;
}

const suggestions = [
  "How does ATP power a cell?",
  "Explain binary search",
  "Why do markets reach equilibrium?",
  "Teach me from a PDF",
];

const teachingModes: Array<{
  value: TeachingMode;
  label: string;
  description: string;
}> = [
  { value: "adaptive", label: "Use my Learning DNA", description: "Ada starts with your Learning DNA." },
  { value: "visual", label: "Visual breakdown", description: "See the structure and relationships." },
  { value: "example", label: "Practical example", description: "Start with a concrete situation." },
  { value: "analogy", label: "Analogy", description: "Connect the idea to something familiar." },
  { value: "story", label: "Story", description: "Use a concise, contextual scenario." },
  { value: "challenge", label: "Challenge", description: "Reason through a guided question." },
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
  const [showSettings, setShowSettings] = useState(false);
  const profile = buildTeachingProfile(scores);
  const [primary] = profile.dominantDimensions;

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-5 sm:p-7 w-full max-w-3xl mx-auto border-none shadow-none bg-transparent"
    >
      <motion.div variants={slideUp} className="text-center mb-8">
        <h1 className="am-heading-serif text-3xl text-[var(--am-text-primary)]">
          What would you like to understand?
        </h1>
        <p className="mt-2 text-base text-[var(--am-text-secondary)]">
          Ask any topic or learn from your own material.
        </p>
      </motion.div>

      <motion.div variants={slideUp} className="mb-4 text-center">
        <p className="text-sm font-medium text-[var(--am-text-muted)]">
          Ada will begin with {learningDimensionLabels[primary]} based on your current Learning DNA.
        </p>
      </motion.div>

      <motion.div variants={slideUp}>
        <AdaComposer
          topic={topic}
          isLoading={isLoading}
          onTopicChange={onTopicChange}
          onSubmit={onSubmit}
        />
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onTopicChange(s)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--am-border-light)] bg-[var(--am-surface)] text-[var(--am-text-secondary)] hover:border-[var(--am-border)] hover:text-[var(--am-text-primary)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={slideUp} className="mt-6">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)] mx-auto"
        >
          Learning settings
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={showSettings ? "rotate-180" : ""}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {showSettings && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-[var(--am-surface)] border border-[var(--am-border-light)] rounded-[var(--am-radius-lg)] p-4 text-left">
            <label className="text-sm font-medium text-[var(--am-text-secondary)]">
              Subject
              <select
                value={subject}
                onChange={(event) => onSubjectChange(event.target.value)}
                className="mt-1 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] px-3 py-2 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              >
                <option>Science</option>
                <option>Mathematics</option>
                <option>Computer science</option>
                <option>Economics</option>
                <option>History</option>
                <option>Geography</option>
                <option>Literature</option>
                <option>Language learning</option>
                <option>General learning</option>
              </select>
            </label>
            <label className="text-sm font-medium text-[var(--am-text-secondary)]">
              Level
              <select
                value={level}
                onChange={(event) => onLevelChange(event.target.value)}
                className="mt-1 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] px-3 py-2 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              >
                <option>High school</option>
                <option>University</option>
                <option>Independent learner</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label className="text-sm font-medium text-[var(--am-text-secondary)]">
              Approach
              <select
                value={teachingMode}
                onChange={(event) => onTeachingModeChange(event.target.value as TeachingMode)}
                className="mt-1 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] px-3 py-2 text-sm text-[var(--am-text-primary)] outline-none focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15"
              >
                {teachingModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
