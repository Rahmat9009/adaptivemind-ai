"use client";

import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import type { GeneratedQuiz } from "@/lib/ai/types";
import { LoaderCircle, ChevronDown, ChevronUp } from "lucide-react";

export function scoreMultipleChoice(
  quiz: GeneratedQuiz,
  answers: Record<string, string>,
): { correct: number; total: number; selfAssessed: number } {
  const multipleChoice = quiz.questions.filter(
    (question) => question.type === "multiple-choice",
  );
  return {
    correct: multipleChoice.filter(
      (question) => answers[question.id] === String(question.correctOptionIndex),
    ).length,
    total: multipleChoice.length,
    selfAssessed: quiz.questions.length - multipleChoice.length,
  };
}

export function QuizExperience({
  topic,
  isLoading,
  error,
  quiz,
  onGenerate,
}: {
  topic: string;
  isLoading: boolean;
  error: string | null;
  quiz: GeneratedQuiz | null;
  onGenerate: (count: number) => void;
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [count, setCount] = useState<3 | 5 | 10>(5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);

  if (!quiz) {
    return (
      <div className="am-card p-8 text-center max-w-lg mx-auto mt-8">
        <h3 className="am-heading-serif text-2xl text-[var(--am-text-primary)] mb-2">
          Test your knowledge
        </h3>
        <p className="text-sm text-[var(--am-text-secondary)] mb-6">
          Generate a quick quiz to check your understanding of {topic}.
        </p>

        <div className="flex flex-col items-center gap-4">
          <Button
            type="button"
            color="primary"
            size="md"
            isDisabled={isLoading}
            onClick={() => onGenerate(count)}
          >
            {isLoading ? <LoaderCircle size={18} className="animate-spin mr-2" /> : null}
            Generate {count}-question quiz
          </Button>
          <button
            type="button"
            onClick={() => setShowConfig((current) => !current)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]"
          >
            Options {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showConfig && (
            <div className="flex items-center gap-3 bg-[var(--am-warm-bg)] rounded-[var(--am-radius-md)] p-3 border border-[var(--am-border-light)]">
              <label className="text-xs font-medium text-[var(--am-text-secondary)]" htmlFor="quiz-question-count">
                Questions:
              </label>
              <select
                id="quiz-question-count"
                value={count}
                onChange={(event) => setCount(Number(event.target.value) as 3 | 5 | 10)}
                className="bg-[var(--am-surface)] border border-[var(--am-border-light)] rounded-[var(--am-radius-sm)] text-xs px-2 py-1 outline-none"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-4 text-sm text-[var(--am-error)] font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (currentIndex >= quiz.questions.length) {
    const result = scoreMultipleChoice(quiz, answers);
    return (
      <div className="am-card p-8 text-center max-w-lg mx-auto mt-8">
        <h3 className="am-heading-serif text-2xl text-[var(--am-text-primary)] mb-2">
          Quiz completed
        </h3>
        <p className="text-lg font-medium text-[var(--am-text-secondary)] mb-2">
          You finished the quiz on {topic}.
        </p>
        <p className="text-3xl font-serif text-[var(--am-primary)] font-bold mb-3">
          {result.correct} / {result.total} multiple-choice correct
        </p>
        {result.selfAssessed > 0 && (
          <p className="text-sm text-[var(--am-text-muted)] mb-6">
            {result.selfAssessed} short-answer {result.selfAssessed === 1 ? "response was" : "responses were"} self-assessed and not counted as verified mastery.
          </p>
        )}
        <div className="flex justify-center gap-3">
          <Button color="primary" onClick={() => {
            setCurrentIndex(0);
            setShowFeedback(false);
          }}>
            Review answers
          </Button>
          <Button color="secondary" onClick={() => onGenerate(count)}>
            Generate new quiz
          </Button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const currentAnswer = answers[question.id] ?? "";

  return (
    <div className="am-card p-6 max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--am-text-muted)]">
          Question {currentIndex + 1} of {quiz.questions.length}
        </span>
        <span className="text-xs font-medium bg-[var(--am-primary-light)] text-[var(--am-primary)] px-2 py-1 rounded-[var(--am-radius-sm)]">
          {question.type === "multiple-choice" ? "Multiple choice" : "Self-assessed short answer"}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-[var(--am-text-primary)] mb-6">
        {question.prompt}
      </h3>

      {!showFeedback ? (
        <div className="space-y-4">
          {question.type === "multiple-choice" ? (
            <div className="flex flex-col gap-2">
              {question.options.map((option, index) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3 rounded-[var(--am-radius-md)] border cursor-pointer transition-colors ${
                    currentAnswer === String(index)
                      ? "border-[var(--am-primary)] bg-[var(--am-primary-light)]"
                      : "border-[var(--am-border-light)] hover:bg-[var(--am-warm-bg)]"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={index}
                    checked={currentAnswer === String(index)}
                    onChange={() => setAnswers((current) => ({ ...current, [question.id]: String(index) }))}
                    className="accent-[var(--am-primary)] w-4 h-4"
                  />
                  <span className="text-sm text-[var(--am-text-primary)]">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={currentAnswer}
              onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
              rows={4}
              placeholder="Type your answer here…"
              className="w-full resize-y rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] p-3 text-sm outline-none focus:border-[var(--am-primary)] focus:ring-1 focus:ring-[var(--am-primary)]"
            />
          )}
          <div className="flex justify-end pt-4">
            <Button color="primary" isDisabled={!currentAnswer.trim()} onClick={() => setShowFeedback(true)}>
              {question.type === "multiple-choice" ? "Check answer" : "Compare with model answer"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)]">
            {question.type === "multiple-choice" ? (
              <>
                <p className="text-sm font-medium text-[var(--am-text-primary)] mb-2">Feedback</p>
                <p className="text-sm leading-relaxed text-[var(--am-text-secondary)]">{question.explanation}</p>
                <p className="mt-3 text-sm text-[var(--am-success)] font-medium">
                  Correct answer: {question.options[question.correctOptionIndex]}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[var(--am-text-primary)] mb-2">Model answer</p>
                <p className="text-sm leading-relaxed text-[var(--am-text-secondary)]">{question.modelAnswer}</p>
                <p className="mt-3 text-sm text-[var(--am-text-secondary)]">{question.guidance}</p>
                <p className="mt-3 text-xs text-[var(--am-text-muted)] italic">
                  Self-assess only. Ada does not mark this response correct or incorrect, and it is not counted as verified mastery.
                </p>
              </>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button color="primary" onClick={() => {
              setShowFeedback(false);
              setCurrentIndex((current) => current + 1);
            }}>
              {currentIndex === quiz.questions.length - 1 ? "Finish quiz" : "Next question"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
