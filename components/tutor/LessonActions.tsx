import type { TutorAction } from "@/lib/ai/types";
import { dnaHex } from "@/lib/learning-dna-visuals";
import type { LearningDimension } from "@/lib/learning-dna";

interface LessonActionsProps {
  isLoading: boolean;
  onAction: (action: Exclude<TutorAction, "initial" | "followup" | "evaluate">) => void;
  onNewLesson: () => void;
}

const actions: Array<{ action: Exclude<TutorAction, "initial" | "followup" | "evaluate">; label: string; hint: string; dimension: LearningDimension }> = [
  { action: "different", label: "Explain differently", hint: "Reframe via a new lens", dimension: "analogies" },
  { action: "simpler", label: "Make it simpler", hint: "Shorter, less jargon", dimension: "visual" },
  { action: "example", label: "Give me an example", hint: "A worked case", dimension: "examples" },
  { action: "challenge", label: "Challenge me", hint: "Reason first", dimension: "challenges" },
];

export function LessonActions({ isLoading, onAction, onNewLesson }: LessonActionsProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Lesson controls">
      {actions.map(({ action, label, hint, dimension }) => (
        <button
          key={action}
          type="button"
          onClick={() => onAction(action)}
          disabled={isLoading}
          title={hint}
          className="group rounded-full border border-ink-900/12 bg-paper-50 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: isLoading ? undefined : `color-mix(in srgb, ${dnaHex[dimension]} 30%, transparent)` }}
          onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.borderColor = dnaHex[dimension]; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--color-ink-900) 12%, transparent)"; }}
        >
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle transition group-hover:scale-125" style={{ background: dnaHex[dimension] }} />
          {label}
        </button>
      ))}
      <button
        type="button"
        onClick={onNewLesson}
        className="ml-auto rounded-full px-4 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-900/5 hover:text-ink-950"
      >
        Start new lesson
      </button>
    </div>
  );
}
