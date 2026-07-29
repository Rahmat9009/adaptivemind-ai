"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { LearningDNAConstellation } from "@/components/three/LearningDNAConstellation";
import {
  assessmentQuestions,
  calculateLearningDNA,
  getPrimaryLearningStyle,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";

const storageKey = "adaptivemind-learning-dna";

interface StoredLearningDNA {
  selectedAnswers: Array<number | null>;
  scores: LearningScores | null;
  primaryLearningStyle: LearningDimension | null;
  completedAt: string | null;
}

function createEmptyAnswers(): Array<number | null> {
  return Array.from({ length: assessmentQuestions.length }, () => null);
}

function isStoredLearningDNA(value: unknown): value is StoredLearningDNA {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.selectedAnswers);
}

function getLiveScores(answers: Array<number | null>): LearningScores {
  const filled = answers.map((a) => a ?? 0);
  return calculateLearningDNA(filled);
}

export function AssessmentShell() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Array<number | null>>(createEmptyAnswers);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showRequiredMessage, setShowRequiredMessage] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedValue: unknown = JSON.parse(
          localStorage.getItem(storageKey) ?? "null",
        );
        if (isStoredLearningDNA(storedValue)) {
          const restoredAnswers = createEmptyAnswers().map((_, index) => {
            const answer = storedValue.selectedAnswers[index];
            return typeof answer === "number" && answer >= 0 && answer < 4 ? answer : null;
          });
          setAnswers(restoredAnswers);
          const firstIncomplete = restoredAnswers.findIndex(
            (answer) => answer === null,
          );
          setQuestionIndex(
            firstIncomplete === -1 ? assessmentQuestions.length - 1 : firstIncomplete,
          );
        }
      } catch {
        localStorage.removeItem(storageKey);
      } finally {
        setIsReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function saveProgress(nextAnswers: Array<number | null>) {
    const savedProfile: StoredLearningDNA = {
      selectedAnswers: nextAnswers,
      scores: null,
      primaryLearningStyle: null,
      completedAt: null,
    };
    localStorage.setItem(storageKey, JSON.stringify(savedProfile));
  }

  function handleSelect(answerIndex: number) {
    const nextAnswers = answers.map((answer, index) =>
      index === questionIndex ? answerIndex : answer,
    );
    setAnswers(nextAnswers);
    setShowRequiredMessage(false);
    saveProgress(nextAnswers);
  }

  function handleContinue() {
    if (answers[questionIndex] === null) {
      setShowRequiredMessage(true);
      return;
    }

    if (questionIndex < assessmentQuestions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }

    const scores = calculateLearningDNA(answers);
    const profile: StoredLearningDNA = {
      selectedAnswers: answers,
      scores,
      primaryLearningStyle: getPrimaryLearningStyle(scores),
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(profile));
    router.push("/assessment/results");
  }

  if (!isReady) {
    return <div className="min-h-screen bg-[var(--am-bg)]" aria-busy="true" />;
  }

  const isLastQuestion = questionIndex === assessmentQuestions.length - 1;
  const liveScores = getLiveScores(answers);
  const hasAnyAnswer = answers.some((a) => a !== null);

  return (
    <main id="main-content" className="min-h-screen bg-[var(--am-bg)]">
      {/* Assessment header */}
      <header className="mx-auto max-w-6xl px-5 pt-11 pb-4 sm:px-8 lg:px-10">
        <p className="am-label text-[var(--am-primary)]/70">
          Learning DNA assessment
        </p>
        <h1 className="am-heading-serif mt-2 text-3xl text-[var(--am-text-primary)] sm:text-4xl">
          Which approaches should Ada try first?
        </h1>
        <p className="mt-2 max-w-xl text-base leading-7 text-[var(--am-text-secondary)]">
          Choose what feels most useful right now. This starting hypothesis
          takes about two minutes and will evolve from your learning outcomes.
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left: Question */}
          <div className="flex-1">
            <div className="am-card p-6 sm:p-8">
              <div className="mb-6">
                <ProgressBar current={questionIndex + 1} total={assessmentQuestions.length} />
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleContinue();
                }}
              >
                <QuestionCard
                  questionIndex={questionIndex}
                  selectedAnswer={answers[questionIndex]}
                  onSelect={handleSelect}
                />

                <p className="mt-4 min-h-5 text-sm font-medium text-[var(--am-error)]" role="alert">
                  {showRequiredMessage ? "Choose an answer before continuing." : ""}
                </p>

                <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--am-border-light)] pt-6">
                  <button
                    type="button"
                    onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))}
                    disabled={questionIndex === 0}
                    className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--am-text-secondary)] transition-colors hover:bg-[var(--am-border-light)] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>

                  <button type="submit" className="am-btn am-btn-primary">
                    {isLastQuestion ? "See my Learning DNA" : "Continue"}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-60">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Evolving constellation */}
          {hasAnyAnswer && (
            <motion.aside
              initial={reducedMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="lg:w-80 xl:w-96"
            >
              <div className="sticky top-24">
                <p className="am-label text-[var(--am-text-muted)] mb-3">
                  Your evolving profile
                </p>
                <div className="am-card p-4">
                  <LearningDNAConstellation
                    scores={liveScores}
                    activeDimension={buildTeachingProfile(liveScores).primaryDimension}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--am-text-muted)]">
                  Your answers are building your Learning DNA. Each choice adds context for Ada.
                </p>
              </div>
            </motion.aside>
          )}
        </div>
      </div>
    </main>
  );
}
