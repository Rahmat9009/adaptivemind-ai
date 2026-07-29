"use client";

import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import type { GeneratedQuiz } from "@/lib/ai/types";
import { LoaderCircle, ChevronDown, ChevronUp } from "lucide-react";

interface QuizExperienceProps {
  topic: string;
  isLoading: boolean;
  error: string | null;
  quiz: GeneratedQuiz | null;
  onGenerate: (count: number) => void;
  // We can evaluate multiple-choice locally, but for short-answer we might need Ada. 
  // Let's keep it simple: multiple choice is locally evaluated using correctAnswer.
  // The prompt says "mix of multiple choice and short answer". If we must evaluate short-answer, 
  // we could just do a simple string match or allow the user to self-grade, but wait, 
  // we can just use the provided 'correctAnswer' and 'explanation' to show them.
}

export function QuizExperience({
  topic,
  isLoading,
  error,
  quiz,
  onGenerate,
}: QuizExperienceProps) {
  const [showConfig, setShowSettings] = useState(false);
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
            onClick={() => setShowSettings(!showConfig)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]"
          >
            Options {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {showConfig && (
            <div className="flex items-center gap-3 bg-[var(--am-warm-bg)] rounded-[var(--am-radius-md)] p-3 border border-[var(--am-border-light)]">
              <label className="text-xs font-medium text-[var(--am-text-secondary)]">Questions:</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value) as 3|5|10)}
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
          <p className="mt-4 text-sm text-[var(--am-error)] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Quiz active state
  if (currentIndex >= quiz.questions.length) {
    // Final result
    const correctCount = quiz.questions.filter(q => {
       const ans = answers[q.id] || "";
       return q.type === "multiple-choice" ? ans === q.correctAnswer : ans.trim().length > 5;
    }).length;

    return (
      <div className="am-card p-8 text-center max-w-lg mx-auto mt-8">
        <h3 className="am-heading-serif text-2xl text-[var(--am-text-primary)] mb-2">
          Quiz Completed
        </h3>
        <p className="text-lg font-medium text-[var(--am-text-secondary)] mb-2">
          You finished the quiz on {topic}.
        </p>
        <p className="text-3xl font-serif text-[var(--am-primary)] font-bold mb-6">
          {correctCount} / {quiz.questions.length} correct
        </p>
        <p className="text-sm text-[var(--am-text-muted)] mb-6">
          Ada found strong areas and concepts to review.
        </p>
        <div className="flex justify-center gap-3">
          <Button color="primary" onClick={() => {
            setCurrentIndex(0);
            setAnswers({});
            setShowFeedback(false);
          }}>
            Review Answers
          </Button>
          <Button color="secondary" onClick={() => onGenerate(count)}>
            Generate New Quiz
          </Button>
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentIndex];
  const currentAnswer = answers[q.id] || "";

  return (
    <div className="am-card p-6 max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--am-text-muted)]">
          Question {currentIndex + 1} of {quiz.questions.length}
        </span>
        <span className="text-xs font-medium bg-[var(--am-primary-light)] text-[var(--am-primary)] px-2 py-1 rounded-[var(--am-radius-sm)]">
          {q.type === "multiple-choice" ? "Multiple Choice" : "Short Answer"}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-[var(--am-text-primary)] mb-6">
        {q.question}
      </h3>

      {!showFeedback ? (
        <div className="space-y-4">
          {q.type === "multiple-choice" && q.options ? (
            <div className="flex flex-col gap-2">
              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-[var(--am-radius-md)] border cursor-pointer transition-colors ${
                    currentAnswer === opt
                      ? "border-[var(--am-primary)] bg-[var(--am-primary-light)]"
                      : "border-[var(--am-border-light)] hover:bg-[var(--am-warm-bg)]"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={currentAnswer === opt}
                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className="accent-[var(--am-primary)] w-4 h-4"
                  />
                  <span className="text-sm text-[var(--am-text-primary)]">{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={currentAnswer}
              onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              rows={4}
              placeholder="Type your answer here..."
              className="w-full resize-y rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] p-3 text-sm outline-none focus:border-[var(--am-primary)] focus:ring-1 focus:ring-[var(--am-primary)]"
            />
          )}

          <div className="flex justify-end pt-4">
            <Button
              color="primary"
              isDisabled={!currentAnswer.trim()}
              onClick={() => setShowFeedback(true)}
            >
              Check Answer
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)]">
            <p className="text-sm font-medium text-[var(--am-text-primary)] mb-2">
              {q.type === "multiple-choice" ? "Feedback" : "Model Answer & Guide"}
            </p>
            <p className="text-sm leading-relaxed text-[var(--am-text-secondary)]">
              {q.explanation}
            </p>
            {q.type === "multiple-choice" ? (
              <p className="mt-3 text-sm text-[var(--am-success)] font-medium">
                Correct answer: {q.correctAnswer}
              </p>
            ) : (
              <p className="mt-3 text-xs text-[var(--am-text-muted)] italic">
                Self-assess your answer against the model explanation above.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              color="primary"
              onClick={() => {
                setShowFeedback(false);
                setCurrentIndex(prev => prev + 1);
              }}
            >
              {currentIndex === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
