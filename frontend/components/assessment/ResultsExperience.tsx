"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  getPrimaryLearningStyle,
  learningDimensionLabels,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";
import { easeOutExpo } from "@/lib/motion";
import { LearningDNAChart } from "./LearningDNAChart";
import { LearningStyleSummary } from "./LearningStyleSummary";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { LearningDNAConstellation } from "@/components/three/LearningDNAConstellation";

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
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedResult = getStoredResult();
      if (!storedResult) {
        router.replace("/assessment");
        return;
      }
      setResult(storedResult);
      setIsReady(true);
      // Sequence the reveal: constellation first, then chart bars, then summary
      const t1 = window.setTimeout(() => setIsVisible(true), 350);
      return () => window.clearTimeout(t1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  function handleRetake() {
    localStorage.removeItem(storageKey);
    router.push("/assessment");
  }

  if (!isReady || !result) return <main className="min-h-screen bg-paper-50" aria-busy="true" />;

  const { scores, primaryLearningStyle: primary } = result;
  const color = dnaHex[primary];

  return (
    <>
      <AppNavigation />
      <main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-paper-50 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        {/* Ambient tint from the user's primary dimension — the page adopts their color */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-70 transition-opacity duration-1000"
          style={{ background: `radial-gradient(circle at 50% 0%, ${color}10, transparent 50%)` }}
        />

        <div className="mx-auto max-w-5xl">
          {/* Reveal sequence — staged */}
          <motion.header
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo }}
            className="max-w-3xl"
          >
            <p className="eyebrow-num text-ink-500">Your Learning DNA</p>
            <h1 className="font-display mt-5 text-4xl leading-[1.02] tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
              This is the shape of how you learn.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-700">
              An initial profile, traced from eight answers. It is not a label —
              it is a starting point that Ada will keep reshaping as you learn.
            </p>
          </motion.header>

          {/* Signature reveal — the constellation materializes, then the primary dimension is announced */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, ease: easeOutExpo, delay: 0.2 }}
            className="mt-10"
          >
            <LearningDNAConstellation
              scores={scores}
              activeDimension={primary}
              interactive
              caption="Your five dimensions, connected. The brightest is where Ada begins."
            />
          </motion.div>

          {/* Primary dimension — large editorial reveal */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.55 }}
            className="mt-12 flex flex-col items-center text-center"
          >
            <p className="eyebrow-num text-ink-500">Your primary dimension</p>
            <motion.h2
              initial={reducedMotion ? false : { opacity: 0, y: 30, letterSpacing: "0.04em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "-0.03em" }}
              transition={{ duration: 0.9, ease: easeOutExpo, delay: 0.7 }}
              className="font-display mt-4 text-6xl leading-none tracking-tight sm:text-7xl lg:text-8xl"
              style={{ color }}
            >
              {learningDimensionLabels[primary]}
            </motion.h2>
            <motion.p
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.95 }}
              className="mt-5 max-w-lg text-base leading-7 text-ink-700"
            >
              You think most clearly through {learningDimensionLabels[primary].toLowerCase()}.
              Ada will lead with this and weave in your supporting dimensions when they help.
            </motion.p>
          </motion.div>

          {/* Detail row — summary + full chart */}
          <div className="mt-14 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easeOutExpo, delay: 1.05 }}
            >
              <LearningStyleSummary primaryStyle={primary} scores={scores} />
            </motion.div>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easeOutExpo, delay: 1.15 }}
            >
              <LearningDNAChart scores={scores} isVisible={isVisible} />
            </motion.div>
          </div>

          {/* Next steps */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 1.3 }}
            className="mt-14 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-xl text-ink-950">Ready to meet Ada?</p>
              <p className="mt-1 text-sm text-ink-600">Your first lesson will already know how you learn.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleRetake}
                className="rounded-full border border-ink-900/15 px-6 py-3.5 text-sm font-semibold text-ink-800 transition hover:bg-ink-900/5"
              >
                Retake assessment
              </button>
              <Link
                href="/dashboard"
                className="rounded-full bg-ink-950 px-7 py-3.5 text-center text-sm font-semibold text-paper-50 shadow-lg transition hover:-translate-y-0.5 hover:bg-ink-800"
              >
                Go to my dashboard →
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
