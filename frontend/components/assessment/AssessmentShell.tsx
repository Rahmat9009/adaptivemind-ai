"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { LearningDNAConstellation } from "@/components/three/LearningDNAConstellation";
import {
  assessmentQuestions,
  calculateLearningDNA,
  getPrimaryLearningStyle,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
import { easeOutExpo } from "@/lib/motion";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";

const storageKey = "adaptivemind-learning-dna";

interface StoredLearningDNA {
  selectedAnswers: Array<number | null>;
  scores: LearningScores | null;
  primaryLearningStyle: LearningDimension | null;
  completedAt: string | null;
}

const emptyScores: LearningScores = { visual: 0, examples: 0, analogies: 0, stories: 0, challenges: 0 };

function createEmptyAnswers(): Array<number | null> {
  return Array.from({ length: assessmentQuestions.length }, () => null);
}

function isStoredLearningDNA(value: unknown): value is StoredLearningDNA {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.selectedAnswers);
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
        const storedValue: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "null");
        if (isStoredLearningDNA(storedValue)) {
          const restoredAnswers = createEmptyAnswers().map((_, index) => {
            const answer = storedValue.selectedAnswers[index];
            return typeof answer === "number" && answer >= 0 && answer < 4 ? answer : null;
          });
          setAnswers(restoredAnswers);
          const firstIncomplete = restoredAnswers.findIndex((answer) => answer === null);
          setQuestionIndex(firstIncomplete === -1 ? assessmentQuestions.length - 1 : firstIncomplete);
        }
      } catch {
        localStorage.removeItem(storageKey);
      } finally {
        setIsReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  /**
   * Partial Learning DNA — calculated from the questions answered so far.
   * This is what makes the constellation "evolve" as the user answers.
   */
  const partialScores: LearningScores = useMemo(() => {
    const partial = answers.map((a, i) => (i <= questionIndex ? a : null));
    return calculateLearningDNA(partial);
  }, [answers, questionIndex]);

  const answeredCount = answers.filter((a) => a !== null).length;
  const activeDimension = useMemo<LearningDimension | undefined>(() => {
    const sorted = (Object.keys(partialScores) as LearningDimension[]).sort(
      (a, b) => partialScores[b] - partialScores[a],
    );
    return answeredCount > 0 ? sorted[0] : undefined;
  }, [partialScores, answeredCount]);

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

  if (!isReady) return <div className="min-h-screen bg-paper-50" aria-busy="true" />;

  const isLastQuestion = questionIndex === assessmentQuestions.length - 1;

  return (
    <>
      <AppNavigation />
      <main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-paper-50 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <header className="max-w-3xl">
            <p className="eyebrow-num text-ink-500">Learning DNA assessment</p>
            <h1 className="font-display mt-4 text-4xl leading-tight tracking-tight text-ink-950 sm:text-5xl">
              Watch your learning profile form, one answer at a time.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-700">
              There are no right answers. Choose what feels most natural. With each
              choice, the constellation beside you gains detail.
            </p>
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            {/* Left — question */}
            <section className="surface-paper rounded-[2rem] p-6 sm:p-10">
              <ProgressBar current={questionIndex + 1} total={assessmentQuestions.length} />

              <div className="mt-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={questionIndex}
                    initial={reducedMotion ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, x: -24 }}
                    transition={{ duration: reducedMotion ? 0.12 : 0.4, ease: easeOutExpo }}
                  >
                    <QuestionCard questionIndex={questionIndex} selectedAnswer={answers[questionIndex]} onSelect={handleSelect} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <p className="mt-5 min-h-6 text-sm font-medium text-rose-700" role="alert">
                {showRequiredMessage ? "Choose an answer before continuing." : ""}
              </p>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink-900/8 pt-6">
                <button
                  type="button"
                  onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))}
                  disabled={questionIndex === 0}
                  className="rounded-full px-5 py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-paper-50 shadow-lg transition hover:-translate-y-0.5 hover:bg-ink-800"
                >
                  {isLastQuestion ? "Reveal my Learning DNA →" : "Continue →"}
                </button>
              </div>
            </section>

            {/* Right — evolving constellation (sticky on desktop) */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: easeOutExpo }}
              >
                <LearningDNAConstellation
                  scores={answeredCount > 0 ? partialScores : { ...emptyScores, visual: 30, examples: 30, analogies: 30, stories: 30, challenges: 30 }}
                  activeDimension={activeDimension}
                  interactive={false}
                  variant="signature"
                  caption={
                    answeredCount === 0
                      ? "Answer your first question to begin tracing your profile."
                      : `${answeredCount} of ${assessmentQuestions.length} answers · your strongest dimension so far is highlighted.`
                  }
                />
              </motion.div>

              <div className="mt-4 grid grid-cols-5 gap-2 text-center">
                {(Object.keys(partialScores) as LearningDimension[]).map((d) => (
                  <div key={d} className="rounded-xl border border-ink-900/8 bg-paper-50 px-1 py-2">
                    <p className="font-mono text-sm font-semibold tabular-nums text-ink-950">{partialScores[d]}</p>
                    <p className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-ink-500">{d.slice(0, 3)}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
