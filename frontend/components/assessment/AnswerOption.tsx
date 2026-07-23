import { motion } from "motion/react";
import type { AssessmentAnswer } from "@/lib/learning-dna";

interface AnswerOptionProps {
  answer: AssessmentAnswer;
  index: number;
  isSelected: boolean;
  questionId: string;
  onSelect: (index: number) => void;
}

export function AnswerOption({
  answer,
  index,
  isSelected,
  questionId,
  onSelect,
}: AnswerOptionProps) {
  const inputId = `${questionId}-answer-${index}`;

  return (
    <motion.label
      htmlFor={inputId}
      whileTap={{ scale: 0.99 }}
      className={`group relative block cursor-pointer rounded-[var(--am-radius-xl)] border p-5 transition-all duration-[var(--am-duration-quick)] ${
        isSelected
          ? "border-[var(--am-primary)] bg-[var(--am-primary-light)] shadow-sm"
          : "border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] hover:border-[var(--am-primary)]/40 hover:shadow-[var(--am-shadow-sm)]"
      }`}
    >
      <input
        id={inputId}
        name={questionId}
        type="radio"
        checked={isSelected}
        onChange={() => onSelect(index)}
        className="peer sr-only"
      />

      <div className="flex items-start gap-4">
        {/* Radio indicator */}
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            isSelected
              ? "border-[var(--am-primary)] bg-[var(--am-primary)]"
              : "border-[var(--am-border)] bg-white group-hover:border-[var(--am-primary)]/40"
          }`}
          aria-hidden="true"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full bg-white transition-opacity ${
              isSelected ? "opacity-100" : "opacity-0"
            }`}
          />
        </span>

        <div className="flex-1 min-w-0">
          <span className="block text-base font-semibold text-[var(--am-text-primary)]">
            {answer.label}
          </span>
          <span className="mt-1 block text-sm leading-6 text-[var(--am-text-secondary)]">
            {answer.description}
          </span>
        </div>
      </div>

      {/* Selected ring */}
      {isSelected && (
        <span
          className="pointer-events-none absolute inset-0 rounded-[var(--am-radius-xl)] ring-2 ring-[var(--am-primary)] ring-offset-1"
          aria-hidden="true"
        />
      )}
    </motion.label>
  );
}
