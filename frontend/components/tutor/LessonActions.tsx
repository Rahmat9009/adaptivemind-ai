import type { TutorAction } from "@/lib/ai/types";

interface LessonActionsProps {
  isLoading: boolean;
  onAction: (
    action: Exclude<TutorAction, "initial" | "followup" | "evaluate">,
  ) => void;
  onNewLesson: () => void;
}

const actions: Array<{
  action: Exclude<TutorAction, "initial" | "followup" | "evaluate">;
  label: string;
}> = [
  { action: "different", label: "Explain differently" },
  { action: "simpler", label: "Make it simpler" },
  { action: "example", label: "Give me an example" },
  { action: "challenge", label: "Challenge me" },
];

export function LessonActions({
  isLoading,
  onAction,
  onNewLesson,
}: LessonActionsProps) {
  return (
    <div
      className="mt-6 flex flex-wrap items-center gap-2"
      aria-label="Lesson controls"
    >
      {actions.map(({ action, label }) => (
        <button
          key={action}
          type="button"
          onClick={() => onAction(action)}
          disabled={isLoading}
          className="rounded-full border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--am-text-secondary)] shadow-sm transition-all duration-[var(--am-duration-quick)] hover:border-[var(--am-primary)]/30 hover:text-[var(--am-primary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        onClick={onNewLesson}
        className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--am-text-muted)] transition-colors hover:text-[var(--am-text-primary)]"
      >
        New topic
      </button>
    </div>
  );
}
