"use client";

import { type RefObject, useState } from "react";
import { motion } from "motion/react";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/motion";
import type {
  TutorConversationTurn,
  TutorLesson,
} from "@/lib/ai/types";

interface LessonFollowUpProps {
  lesson: TutorLesson;
  conversation: TutorConversationTurn[];
  isLoading: boolean;
  error: string | null;
  onAsk: (question: string) => Promise<boolean>;
  latestTurnRef: RefObject<HTMLDivElement | null>;
}

function getSuggestions(lesson: TutorLesson): string[] {
  return [
    "Can you explain the core idea more simply?",
    lesson.example
      ? "Why does this example connect to the topic?"
      : "Can you give me a concrete example?",
    "Can you test my understanding?",
  ];
}

export function LessonFollowUp({
  lesson,
  conversation,
  isLoading,
  error,
  onAsk,
  latestTurnRef,
}: LessonFollowUpProps) {
  const [question, setQuestion] = useState("");
  const suggestions = getSuggestions(lesson);

  async function submitQuestion(value = question) {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    const didSend = await onAsk(trimmed);
    if (didSend) setQuestion("");
  }

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mt-8 border-t border-[var(--am-border-light)] pt-8"
      aria-labelledby="ada-follow-up-heading"
    >
      <motion.div variants={slideUp} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-primary)]/70">
            Follow-up
          </p>
          <h2
            id="ada-follow-up-heading"
            className="mt-1 text-xl font-semibold text-[var(--am-text-primary)]"
          >
            Ask Ada about this lesson
          </h2>
        </div>
        <p className="text-xs text-[var(--am-text-muted)]">
          Focused answers stay with this lesson.
        </p>
      </motion.div>

      {/* Conversation history */}
      {conversation.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-5 space-y-4"
          aria-live="polite"
        >
          {conversation.map((turn) => (
            <motion.div
              key={turn.student.id}
              variants={staggerItem}
              className="space-y-2"
            >
              <div className="ml-auto max-w-[88%] rounded-[var(--am-radius-xl)] rounded-br-sm bg-[var(--am-text-primary)] px-4 py-3 text-sm leading-6 text-white">
                {turn.student.content}
              </div>
              <div className="max-w-[92%] rounded-[var(--am-radius-xl)] rounded-bl-sm border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] px-4 py-4 text-sm leading-6 text-[var(--am-text-secondary)] shadow-sm">
                <p>{turn.response.answer}</p>
                {turn.response.keyPoint && (
                  <p className="border-l-2 border-[var(--am-primary)] pl-3 mt-3 font-medium text-[var(--am-text-primary)]">
                    {turn.response.keyPoint}
                  </p>
                )}
                {turn.response.example && (
                  <p className="mt-3 text-[var(--am-text-secondary)]">
                    <span className="font-semibold text-[var(--am-text-primary)]">
                      Example:{" "}
                    </span>
                    {turn.response.example}
                  </p>
                )}
                {turn.response.analogy && (
                  <p className="mt-3 text-[var(--am-text-secondary)]">
                    <span className="font-semibold text-[var(--am-text-primary)]">
                      Analogy:{" "}
                    </span>
                    {turn.response.analogy}
                  </p>
                )}
                {turn.response.checkQuestion && (
                  <p className="mt-3 rounded-[var(--am-radius-md)] bg-[var(--am-primary-light)] px-3 py-2 text-sm font-medium text-[var(--am-primary)]">
                    Check: {turn.response.checkQuestion}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={latestTurnRef} />
        </motion.div>
      )}

      {/* Suggested questions */}
      <motion.div
        variants={slideUp}
        className="mt-5 flex flex-wrap gap-2"
        aria-label="Suggested questions"
      >
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void submitQuestion(suggestion)}
            disabled={isLoading}
            className="rounded-full border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] px-3 py-2 text-left text-sm font-medium text-[var(--am-text-secondary)] transition-colors hover:border-[var(--am-primary)]/30 hover:text-[var(--am-primary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {suggestion}
          </button>
        ))}
      </motion.div>

      {/* Input */}
      <motion.form
        variants={slideUp}
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitQuestion();
        }}
      >
        <label htmlFor="lesson-follow-up" className="sr-only">
          Ask Ada a focused question about this lesson
        </label>
        <textarea
          id="lesson-follow-up"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submitQuestion();
            }
          }}
          maxLength={500}
          rows={2}
          placeholder="Ask a focused question about this lesson..."
          disabled={isLoading}
          className="w-full resize-y rounded-[var(--am-radius-lg)] border border-[var(--am-border)] bg-[var(--am-bg-reading)] px-4 py-3 text-sm leading-6 text-[var(--am-text-primary)] outline-none transition placeholder:text-[var(--am-text-muted)] focus:border-[var(--am-primary)] focus:ring-2 focus:ring-[var(--am-primary)]/15 disabled:opacity-50"
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-[var(--am-text-muted)]">
            Press Enter to ask. Use Shift+Enter for a new line.
          </p>
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="am-btn am-btn-primary py-2.5 px-5 text-sm"
          >
            {isLoading ? "Ada is thinking..." : "Ask"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm font-medium text-[var(--am-error)]" role="alert">
            {error}
          </p>
        )}
      </motion.form>
    </motion.section>
  );
}
