"use client";

import { type RefObject, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { TutorConversationTurn, TutorLesson } from "@/lib/ai/types";
import { easeOutExpo } from "@/lib/motion";

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
    lesson.example ? "Why does this example connect to the topic?" : "Can you give me a concrete example?",
    "Can you test my understanding?",
  ];
}

export function LessonFollowUp({ lesson, conversation, isLoading, error, onAsk, latestTurnRef }: LessonFollowUpProps) {
  const [question, setQuestion] = useState("");
  const suggestions = getSuggestions(lesson);

  async function submitQuestion(value = question) {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    const didSend = await onAsk(trimmed);
    if (didSend) setQuestion("");
  }

  return (
    <section className="surface-paper mt-6 rounded-[2rem] p-6 sm:p-7" aria-labelledby="ada-follow-up-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-num text-ink-500">Follow-up</p>
          <h2 id="ada-follow-up-heading" className="font-display mt-2 text-2xl text-ink-950">Ask Ada about this lesson</h2>
        </div>
        <p className="text-xs text-ink-500">Focused answers stay with this lesson.</p>
      </div>

      {conversation.length > 0 ? (
        <div className="mt-6 space-y-5" aria-live="polite">
          <AnimatePresence initial={false}>
            {conversation.map((turn) => (
              <motion.div
                key={turn.student.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeOutExpo }}
                className="space-y-3"
              >
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-ink-950 px-4 py-3 text-sm leading-6 text-paper-50">
                  {turn.student.content}
                </div>
                <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-ink-900/10 bg-paper-100/50 px-4 py-4 text-sm leading-6 text-ink-700">
                  <p>{turn.response.answer}</p>
                  {turn.response.keyPoint ? <p className="mt-3 border-l-2 border-dna-visual pl-3 font-medium text-ink-800">{turn.response.keyPoint}</p> : null}
                  {turn.response.example ? <p className="mt-3 text-ink-600"><span className="font-semibold text-ink-800">Example: </span>{turn.response.example}</p> : null}
                  {turn.response.analogy ? <p className="mt-3 text-ink-600"><span className="font-semibold text-ink-800">Analogy: </span>{turn.response.analogy}</p> : null}
                  {turn.response.checkQuestion ? <p className="mt-3 rounded-lg bg-dna-visual/10 px-3 py-2 font-medium text-ink-900">Check: {turn.response.checkQuestion}</p> : null}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={latestTurnRef} />
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Suggested questions">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void submitQuestion(suggestion)}
            disabled={isLoading}
            className="rounded-full border border-ink-900/12 bg-paper-50 px-3 py-2 text-left text-sm font-medium text-ink-700 transition hover:border-dna-visual hover:bg-dna-visual/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form className="mt-4" onSubmit={(event) => { event.preventDefault(); void submitQuestion(); }}>
        <label htmlFor="lesson-follow-up" className="sr-only">Ask Ada a focused question about this lesson</label>
        <textarea
          id="lesson-follow-up"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitQuestion(); } }}
          maxLength={500}
          rows={3}
          placeholder="Ask a focused question about this lesson…"
          disabled={isLoading}
          className="w-full resize-y rounded-xl border border-ink-900/12 bg-paper-50 px-4 py-3 text-sm leading-6 text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-dna-visual focus:ring-2 focus:ring-dna-visual/15 disabled:bg-ink-900/3"
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-ink-500">Enter to ask · Shift+Enter for a new line</p>
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="rounded-lg bg-dna-visual px-4 py-2.5 text-sm font-semibold text-midnight-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
            style={{ background: "var(--color-dna-visual)" }}
          >
            {isLoading ? "Ada is thinking…" : "Ask"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}
      </form>
    </section>
  );
}
