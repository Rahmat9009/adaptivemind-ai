import { assessmentQuestions } from "@/lib/learning-dna";
import { AnswerOption } from "./AnswerOption";

interface QuestionCardProps {
  questionIndex: number;
  selectedAnswer: number | null;
  onSelect: (answerIndex: number) => void;
}

export function QuestionCard({ questionIndex, selectedAnswer, onSelect }: QuestionCardProps) {
  const question = assessmentQuestions[questionIndex];
  const questionId = `question-${questionIndex + 1}`;

  return (
    <fieldset>
      <legend className="max-w-2xl font-display text-3xl leading-tight tracking-tight text-ink-950 sm:text-4xl">
        {question.prompt}
      </legend>
      <div className="mt-9 grid gap-3">
        {question.answers.map((answer, answerIndex) => (
          <AnswerOption
            key={answer.label}
            answer={answer}
            index={answerIndex}
            questionId={questionId}
            isSelected={selectedAnswer === answerIndex}
            onSelect={onSelect}
          />
        ))}
      </div>
    </fieldset>
  );
}
