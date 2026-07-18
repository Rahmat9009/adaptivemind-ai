"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPrimaryLearningStyle,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
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
  return ["visual", "examples", "analogies", "stories", "challenges"].every((dimension) => typeof record[dimension] === "number");
}

function getStoredResult(): StoredResult | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (typeof value !== "object" || value === null) return null;
    const record = value as Record<string, unknown>;
    if (!isLearningScores(record.scores)) return null;
    const primary = typeof record.primaryLearningStyle === "string" ? record.primaryLearningStyle as LearningDimension : getPrimaryLearningStyle(record.scores);
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

  if (!isReady || !result) return <main className="min-h-screen bg-[#f7f9fc]" aria-busy="true" />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_90%_90%,rgba(99,102,241,0.14),transparent_32%)]" />
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-slate-700 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4"><span aria-hidden="true" className="mr-2">←</span> AdaptiveMind AI</Link>
        <header className="mt-12 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Initial learning profile</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Your Learning DNA</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">This first profile is based on your assessment answers. It will evolve as AdaptiveMind observes your learning behaviour over time.</p>
        </header>
        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <LearningStyleSummary primaryStyle={result.primaryLearningStyle} scores={result.scores} />
          <LearningDNAChart scores={result.scores} isVisible={isVisible} />
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="rounded-full bg-slate-950 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4">Start your first lesson</Link>
          <button type="button" onClick={handleRetake} className="rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4">Retake assessment</button>
        </div>
      </div>
    </main>
  );
}
