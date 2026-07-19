"use client";

import { motion } from "motion/react";
import { assessmentQuestions } from "@/lib/learning-dna";
import { AnswerOption } from "./AnswerOption";

interface QuestionCardProps {
  questionIndex: number;
  selectedAnswer: number | null;
  onSelect: (answerIndex: number) => void;
}

export function QuestionCard({
  questionIndex,
  selectedAnswer,
  onSelect,
}: QuestionCardProps) {
  const question = assessmentQuestions[questionIndex];
  const questionId = `question-${questionIndex + 1}`;

  return (
    <motion.fieldset
      key={questionIndex}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <legend className="max-w-2xl text-xl font-semibold tracking-tight text-[var(--am-text-primary)] sm:text-2xl">
        {question.prompt}
      </legend>
      <div className="mt-6 grid gap-3">
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
    </motion.fieldset>
  );
}
