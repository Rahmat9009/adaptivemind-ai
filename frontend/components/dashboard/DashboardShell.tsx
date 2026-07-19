"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import { markDashboardVisited, readLearningHistory, type LessonHistoryEntry } from "@/lib/dashboard-storage";
import { type LearningScores } from "@/lib/learning-dna";
import { getLessonRecommendation } from "@/lib/recommendations";
import { getMasterySummary } from "@/lib/mastery";
import { DashboardHeader } from "./DashboardHeader";
import { EmptyDashboard } from "./EmptyDashboard";
import { LearningDNACard } from "./LearningDNACard";
import { PersonalizationCard } from "./PersonalizationCard";
import { ProgressCard } from "./ProgressCard";
import { QuickActions } from "./QuickActions";
import { RecentLessons } from "./RecentLessons";
import { RecommendationCard } from "./RecommendationCard";
import { MasteryOverview } from "./MasteryOverview";
import { StudyPlanCard } from "./StudyPlanCard";
import { readStudyPlan, type StudyPlan } from "@/lib/study-planner";

const profileStorageKey = "adaptivemind-learning-dna";

function isLearningScores(value: unknown): value is LearningScores {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["visual", "examples", "analogies", "stories", "challenges"].every((dimension) => typeof record[dimension] === "number");
}

function getStreak(history: LessonHistoryEntry[]): number {
  const dates = new Set(history.map((entry) => new Date(entry.date).toDateString()));
  let streak = 0;
  const day = new Date();
  while (dates.has(day.toDateString())) { streak += 1; day.setDate(day.getDate() - 1); }
  return streak;
}

export function DashboardShell() {
  const [scores, setScores] = useState<LearningScores | null>(null);
  const [history, setHistory] = useState<LessonHistoryEntry[]>([]);
  const [mastery, setMastery] = useState<ReturnType<typeof getMasterySummary>>({ entries: [], mastered: 0, developing: 0, needsReview: 0, averageRecentScore: null });
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(profileStorageKey) ?? "null");
        if (typeof stored === "object" && stored !== null && isLearningScores((stored as Record<string, unknown>).scores))
          setScores((stored as Record<string, unknown>).scores as LearningScores);
        setHistory(readLearningHistory());
        setMastery(getMasterySummary());
        setStudyPlan(readStudyPlan());
        markDashboardVisited();
      } finally {
        setIsReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isReady) return <main className="min-h-screen bg-paper-50" aria-busy="true" />;

  if (!scores) {
    return (
      <>
        <AppNavigation />
        <main className="relative min-h-[calc(100vh-65px)] bg-paper-50 px-5 py-14 sm:px-8 lg:px-12">
          <section className="mx-auto max-w-xl rounded-[2rem] border border-ink-900/10 bg-paper-50 p-8 text-center shadow-sm">
            <h1 className="font-display text-3xl text-ink-950">Start with your Learning DNA</h1>
            <p className="mt-3 leading-7 text-ink-600">Your dashboard becomes personal after the short assessment.</p>
            <Link href="/assessment" className="mt-6 inline-flex rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-paper-50">
              Take the assessment →
            </Link>
          </section>
        </main>
      </>
    );
  }

  const profile = buildTeachingProfile(scores);
  const streak = getStreak(history);
  const topicsExplored = new Set(history.map((entry) => entry.topic.trim().toLowerCase())).size;
  const latest = history[0];

  return (
    <>
      <AppNavigation />
      <main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-paper-50 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="mx-auto max-w-7xl space-y-7">
          <DashboardHeader
            streak={streak}
            lessonsCompleted={history.length}
            primaryLabel={profile.primaryDimension[0].toUpperCase() + profile.primaryDimension.slice(1)}
          />

          <QuickActions hasHistory={history.length > 0} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <LearningDNACard scores={scores} />
            <div className="space-y-6">
              <PersonalizationCard scores={scores} />
              <ProgressCard
                lessonsCompleted={history.length}
                topicsExplored={topicsExplored}
                streak={streak}
                lastLessonDate={latest ? new Date(latest.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : null}
              />
            </div>
          </div>

          <StudyPlanCard plan={studyPlan} />

          <MasteryOverview
            entries={mastery.entries}
            mastered={mastery.mastered}
            developing={mastery.developing}
            needsReview={mastery.needsReview}
            averageRecentScore={mastery.averageRecentScore}
          />

          {history.length ? (
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <RecommendationCard recommendation={getLessonRecommendation(latest.topic)} />
              <RecentLessons history={history} />
            </div>
          ) : (
            <EmptyDashboard />
          )}
        </div>
      </main>
    </>
  );
}
