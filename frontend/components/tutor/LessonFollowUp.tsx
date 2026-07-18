"use client";

import { type RefObject, useState } from "react";
import type { TutorConversationTurn, TutorLesson } from "@/lib/ai/types";

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
    <section className="mt-8 border-t border-slate-200 pt-8" aria-labelledby="ada-follow-up-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Lesson follow-up</p>
          <h2 id="ada-follow-up-heading" className="mt-1 text-xl font-semibold text-slate-950">Ask Ada about this lesson</h2>
        </div>
        <p className="text-sm text-slate-500">Focused answers stay with this lesson.</p>
      </div>

      {conversation.length > 0 ? <div className="mt-5 space-y-4" aria-live="polite">
        {conversation.map((turn) => <div key={turn.student.id} className="space-y-3">
          <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-slate-900 px-4 py-3 text-sm leading-6 text-white">{turn.student.content}</div>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 shadow-sm">
            <p>{turn.response.answer}</p>
            {turn.response.keyPoint ? <p className="mt-3 border-l-2 border-teal-400 pl-3 font-medium text-slate-800">{turn.response.keyPoint}</p> : null}
            {turn.response.example ? <p className="mt-3 text-slate-600"><span className="font-semibold text-slate-800">Example: </span>{turn.response.example}</p> : null}
            {turn.response.analogy ? <p className="mt-3 text-slate-600"><span className="font-semibold text-slate-800">Analogy: </span>{turn.response.analogy}</p> : null}
            {turn.response.checkQuestion ? <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 font-medium text-teal-950">Check: {turn.response.checkQuestion}</p> : null}
          </div>
        </div>)}
        <div ref={latestTurnRef} />
      </div> : null}

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Suggested questions">
        {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void submitQuestion(suggestion)} disabled={isLoading} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">{suggestion}</button>)}
      </div>

      <form className="mt-4" onSubmit={(event) => { event.preventDefault(); void submitQuestion(); }}>
        <label htmlFor="lesson-follow-up" className="sr-only">Ask Ada a focused question about this lesson</label>
        <textarea id="lesson-follow-up" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitQuestion(); } }} maxLength={500} rows={3} placeholder="Ask a focused question about this lesson..." disabled={isLoading} className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50" />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">Press Enter to ask. Use Shift+Enter for a new line.</p>
          <button type="submit" disabled={isLoading || !question.trim()} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-55 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">{isLoading ? "Ada is thinking..." : "Ask"}</button>
        </div>
        {error ? <p className="mt-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}
      </form>
    </section>
  );
}
