import type { TutorAction } from "@/lib/ai/types";

interface LessonActionsProps {
  isLoading: boolean;
  onAction: (action: Exclude<TutorAction, "initial">) => void;
  onNewLesson: () => void;
}

const actions: Array<{ action: Exclude<TutorAction, "initial">; label: string }> = [
  { action: "different", label: "Explain differently" },
  { action: "simpler", label: "Make it simpler" },
  { action: "example", label: "Give me an example" },
  { action: "challenge", label: "Challenge me" },
];

export function LessonActions({ isLoading, onAction, onNewLesson }: LessonActionsProps) {
  return (
    <div className="mt-6 flex flex-wrap gap-2" aria-label="Lesson controls">
      {actions.map(({ action, label }) => <button key={action} type="button" onClick={() => onAction(action)} disabled={isLoading} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-3">{label}</button>)}
      <button type="button" onClick={onNewLesson} className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-3">Start new lesson</button>
    </div>
  );
}
