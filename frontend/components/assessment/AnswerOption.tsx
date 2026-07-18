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
    <label
      htmlFor={inputId}
      className="group relative block cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-500 has-[:focus-visible]:ring-offset-4"
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
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 transition peer-checked:border-teal-600 peer-checked:bg-teal-600"
          aria-hidden="true"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white opacity-0 transition peer-checked:opacity-100" />
        </span>
        <span>
          <span className="block text-base font-semibold text-slate-900">{answer.label}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">{answer.description}</span>
        </span>
      </span>
      {isSelected ? <span className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-teal-500 ring-offset-1" /> : null}
    </label>
  );
}
