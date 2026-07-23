"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPrimaryLearningStyle,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
import { createTutorHandoff } from "@/lib/tutor-handoff";
import { tutorHandoffStorageKey } from "@/lib/tutor-handoff";
import { LearningDNAChart } from "./LearningDNAChart";
import { LearningStyleSummary } from "./LearningStyleSummary";

const storageKey = "adaptivemind-learning-dna";

interface StoredResult {
  scores: LearningScores;
  primaryLearningStyle: LearningDimension;
}

function isLearningScores(value: unknown): value is LearningScores {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["visual", "examples", "analogies", "stories", "challenges"].every(
    (dimension) => typeof record[dimension] === "number",
  );
}

function getStoredResult(): StoredResult | null {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    );
    if (typeof value !== "object" || value === null) return null;
    const record = value as Record<string, unknown>;
    if (!isLearningScores(record.scores)) return null;
    const primary =
      typeof record.primaryLearningStyle === "string"
        ? (record.primaryLearningStyle as LearningDimension)
        : getPrimaryLearningStyle(record.scores);
    return { scores: record.scores, primaryLearningStyle: primary };
  } catch {
    return null;
  }
}

export function ResultsExperience() {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedResult = getStoredResult();
      if (!storedResult) {
        router.replace("/assessment");
        return;
      }
      setResult(storedResult);
      setIsReady(true);
      requestAnimationFrame(() => setIsVisible(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  function handleRetake() {
    localStorage.removeItem(storageKey);
    router.push("/assessment");
  }

  function handleProceedToTutor() {
    if (result) {
      const handoff = createTutorHandoff(result.scores);
      sessionStorage.setItem(tutorHandoffStorageKey, JSON.stringify(handoff));
    }
    router.push("/tutor");
  }

  if (!isReady || !result) {
    return <div className="min-h-screen bg-[var(--am-bg)]" aria-busy="true" />;
  }

  return (
    <main id="main-content" className="min-h-screen bg-[var(--am-bg)]">
      <div className="mx-auto max-w-6xl px-5 pt-11 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <header className="max-w-2xl">
            <p className="am-label text-[var(--am-primary)]/70">
              Your Learning DNA
            </p>
            <h1 className="am-heading-serif mt-3 text-3xl leading-[1.08] text-[var(--am-text-primary)] sm:text-4xl">
              A profile shaped around how you understand.
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--am-text-secondary)]">
              Based on your choices, here is how Ada will start personalizing
              your lessons. This is a starting hypothesis — as you complete
              lessons, Ada learns which approaches actually help you.
            </p>
          </header>

          {/* Summary + Chart */}
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
            <LearningStyleSummary
              primaryStyle={result.primaryLearningStyle}
              scores={result.scores}
            />
            <LearningDNAChart scores={result.scores} isVisible={isVisible} />
          </div>

          {/* Action row */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="am-btn am-btn-primary">
              Go to dashboard
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-60">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={handleProceedToTutor}
              className="am-btn am-btn-secondary"
            >
              Start your first lesson
            </button>
            <button
              type="button"
              onClick={handleRetake}
              className="am-btn am-btn-ghost"
            >
              Retake assessment
            </button>
          </div>

          <p className="mt-10 text-sm leading-6 text-[var(--am-text-muted)] border-t border-[var(--am-border-light)] pt-6">
            Your Learning DNA starts as an initial hypothesis. As you complete
            lessons, Ada observes which approaches actually help you understand
            and adjusts accordingly.
          </p>
        </div>
      </div>
    </main>
  );
}
