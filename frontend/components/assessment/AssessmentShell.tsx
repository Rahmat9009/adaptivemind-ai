"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { AppNavigation } from "@/components/layout/AppNavigation";
import {
  assessmentQuestions,
  calculateLearningDNA,
  getPrimaryLearningStyle,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
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
  if (typeof value !== "object" || value === null) {
    return false;
  }

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
    return <div className="min-h-screen bg-[#f7f9fc]" aria-busy="true" />;
  }

  const isLastQuestion = questionIndex === assessmentQuestions.length - 1;

  return (
    <><AppNavigation /><main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-[#f7f9fc] px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_90%_90%,rgba(99,102,241,0.14),transparent_32%)]" />
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-2xl shadow-slate-900/8 backdrop-blur-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Learning DNA assessment</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Find the approaches that help ideas click.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Choose what feels most natural. Your first profile takes about two minutes and will evolve as you learn.</p>

          <div className="mt-8"><ProgressBar current={questionIndex + 1} total={assessmentQuestions.length} /></div>

          <form className="mt-10" onSubmit={(event) => { event.preventDefault(); handleContinue(); }}>
            <motion.div key={questionIndex} initial={reducedMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? undefined : { opacity: 0, x: -18 }} transition={{ duration: reducedMotion ? 0.12 : 0.24 }}>
              <QuestionCard questionIndex={questionIndex} selectedAnswer={answers[questionIndex]} onSelect={handleSelect} />
            </motion.div>
            <p className="mt-4 min-h-6 text-sm font-medium text-rose-600" role="alert">{showRequiredMessage ? "Choose an answer before continuing." : ""}</p>

            <div className="mt-7 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <button type="button" onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))} disabled={questionIndex === 0} className="rounded-full px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">Back</button>
              <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4">{isLastQuestion ? "See my Learning DNA" : "Continue"}</button>
            </div>
          </form>
        </section>
      </div>
    </main></>
  );
}
