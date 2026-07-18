"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TutorAction, TutorApiResponse, TutorLesson } from "@/lib/ai/types";
import { learningDimensions, type LearningScores } from "@/lib/learning-dna";
import { LearningDNACompact } from "./LearningDNACompact";
import { LessonActions } from "./LessonActions";
import { LessonCard } from "./LessonCard";
import { TopicForm } from "./TopicForm";
import { TutorEmptyState } from "./TutorEmptyState";
import { TutorErrorState } from "./TutorErrorState";
import { TutorLoadingState } from "./TutorLoadingState";

const profileStorageKey = "adaptivemind-learning-dna";
const lessonStorageKey = "adaptivemind-current-lesson";
const balancedScores: LearningScores = { visual: 50, examples: 50, analogies: 50, stories: 50, challenges: 50 };

interface TutorProfile { scores: LearningScores; isBalanced: boolean; }

function isLearningScores(value: unknown): value is LearningScores {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return learningDimensions.every((dimension) => typeof record[dimension] === "number" && record[dimension] >= 0 && record[dimension] <= 100);
}

function isTutorLesson(value: unknown): value is TutorLesson {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.title === "string" && typeof record.coreIdea === "string" && typeof record.explanation === "string" && Array.isArray(record.keyPoints) && record.keyPoints.every((point) => typeof point === "string") && typeof record.checkQuestion === "string" && Array.isArray(record.stylesUsed);
}

function isTutorResponse(value: unknown): value is TutorApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return isTutorLesson(record.lesson) && (record.source === "provider" || record.source === "demo");
}

function getErrorMessage(value: unknown): string {
  if (typeof value !== "object" || value === null) return "Please try again.";
  const message = (value as Record<string, unknown>).error;
  return typeof message === "string" ? message : "Please try again.";
}

function getSavedProfile(): TutorProfile | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(profileStorageKey) ?? "null");
    if (typeof value !== "object" || value === null) return null;
    const record = value as Record<string, unknown>;
    return isLearningScores(record.scores) ? { scores: record.scores, isBalanced: false } : null;
  } catch { return null; }
}

export function TutorShell() {
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Science");
  const [level, setLevel] = useState("High school");
  const [response, setResponse] = useState<TutorApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfile(getSavedProfile());
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(lessonStorageKey) ?? "null");
        if (isTutorResponse(stored)) setResponse(stored);
      } catch { localStorage.removeItem(lessonStorageKey); }
      setIsReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function requestLesson(action: TutorAction) {
    if (!profile || !topic.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const apiResponse = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic.trim(), subject, level, scores: profile.scores, action }) });
      const payload: unknown = await apiResponse.json();
      if (!apiResponse.ok) {
        throw new Error(getErrorMessage(payload));
      }
      if (!isTutorResponse(payload)) throw new Error("The tutor returned an incomplete lesson. Please try again.");
      setResponse(payload);
      localStorage.setItem(lessonStorageKey, JSON.stringify(payload));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Please check your connection and try again.");
    } finally { setIsLoading(false); }
  }

  function startNewLesson() {
    setResponse(null);
    setError(null);
    setTopic("");
    localStorage.removeItem(lessonStorageKey);
  }

  if (!isReady) return <main className="min-h-screen bg-[#f7f9fc]" aria-busy="true" />;
  if (!profile) return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f9fc] px-5 py-10"><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(99,102,241,0.14),transparent_32%)]" /><TutorEmptyState onUseBalancedProfile={() => setProfile({ scores: balancedScores, isBalanced: true })} /></main>;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(99,102,241,0.14),transparent_32%)]" />
      <div className="mx-auto max-w-6xl"><Link href="/" className="inline-flex items-center text-sm font-semibold text-slate-700 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4"><span aria-hidden="true" className="mr-2">←</span> AdaptiveMind AI</Link>
        <header className="mt-10 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Adaptive AI tutor</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">A lesson shaped around your current preferences.</h1><p className="mt-4 text-lg leading-8 text-slate-600">Ask about a topic and AdaptiveMind will start with the explanation styles your assessment currently emphasizes.</p></header>
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:items-start"><div className="space-y-5"><LearningDNACompact scores={profile.scores} isBalanced={profile.isBalanced} /><TopicForm topic={topic} subject={subject} level={level} isLoading={isLoading} onTopicChange={setTopic} onSubjectChange={setSubject} onLevelChange={setLevel} onSubmit={() => requestLesson("initial")} /></div><div>{error ? <TutorErrorState message={error} /> : null}{isLoading ? <TutorLoadingState /> : null}{!isLoading && response ? <><LessonCard response={response} /><LessonActions isLoading={isLoading} onAction={requestLesson} onNewLesson={startNewLesson} /></> : null}{!isLoading && !response && !error ? <section className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-10 text-center text-slate-500"><p className="font-medium text-slate-700">Your focused lesson will appear here.</p><p className="mt-2 text-sm leading-6">Choose a suggested topic or enter one of your own to begin.</p></section> : null}</div></div>
      </div>
    </main>
  );
}
