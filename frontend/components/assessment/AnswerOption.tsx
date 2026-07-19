import type { AssessmentAnswer, LearningDimension } from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";

interface AnswerOptionProps {
  answer: AssessmentAnswer;
  index: number;
  isSelected: boolean;
  questionId: string;
  onSelect: (index: number) => void;
}

/** Returns the dimension whose contribution is highest in this answer (the "tint" for the option). */
function primaryDimension(answer: AssessmentAnswer): LearningDimension | null {
  const entries = Object.entries(answer.contributions) as [LearningDimension, number][];
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? entries[0][0] : null;
}

export function AnswerOption({
  answer,
  index,
  isSelected,
  questionId,
  onSelect,
}: AnswerOptionProps) {
  const inputId = `${questionId}-answer-${index}`;
  const tint = primaryDimension(answer);
  const tintColor = tint ? dnaHex[tint] : "var(--color-ink-500)";

  return (
    <label
      htmlFor={inputId}
      className={`group relative block cursor-pointer rounded-2xl border bg-paper-50 p-5 transition-all duration-300 hover:-translate-y-0.5 ${
        isSelected
          ? "border-transparent shadow-[0_0_0_1.5px_var(--color-dna-visual),0_18px_40px_-28px_rgba(20,27,58,0.4)]"
          : "border-ink-900/10 hover:border-ink-900/20"
      }`}
      style={isSelected && tint ? { boxShadow: `0 0 0 1.5px ${tintColor}, 0 18px 40px -28px rgba(20,27,58,0.4)` } : undefined}
    >
      <input
        id={inputId}
        name={questionId}
        type="radio"
        checked={isSelected}
        onChange={() => onSelect(index)}
        className="peer sr-only"
      />
      <span className="flex gap-4">
        <span
          className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition"
          style={{
            borderColor: isSelected ? tintColor : "color-mix(in srgb, var(--color-ink-900) 25%, transparent)",
            backgroundColor: isSelected ? tintColor : "transparent",
          }}
          aria-hidden="true"
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-paper-50 transition"
            style={{ opacity: isSelected ? 1 : 0 }}
          />
        </span>
        <span>
          <span className="block text-base font-semibold text-ink-950">{answer.label}</span>
          <span className="mt-1 block text-sm leading-6 text-ink-600">{answer.description}</span>
        </span>
      </span>
      {tint ? (
        <span
          className="absolute right-5 top-5 h-1.5 w-1.5 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-60"
          style={{ background: tintColor }}
          aria-hidden="true"
        />
      ) : null}
    </label>
  );
}
