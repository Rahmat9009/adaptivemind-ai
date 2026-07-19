"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/am/PageShell";
import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import {
  markDashboardVisited,
  readLearningHistory,
  type LessonHistoryEntry,
} from "@/lib/dashboard-storage";
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
  return ["visual", "examples", "analogies", "stories", "challenges"].every(
    (dimension) => typeof record[dimension] === "number",
  );
}

function getStreak(history: LessonHistoryEntry[]): number {
  const dates = new Set(
    history.map((entry) => new Date(entry.date).toDateString()),
  );
  let streak = 0;
  const day = new Date();
  while (dates.has(day.toDateString())) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

export function DashboardShell() {
  const [scores, setScores] = useState<LearningScores | null>(null);
  const [history, setHistory] = useState<LessonHistoryEntry[]>([]);
  const [mastery, setMastery] = useState<
    ReturnType<typeof getMasterySummary>
  >({
    entries: [],
    mastered: 0,
    developing: 0,
    needsReview: 0,
    averageRecentScore: null,
  });
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored: unknown = JSON.parse(
          localStorage.getItem(profileStorageKey) ?? "null",
        );
        if (
          typeof stored === "object" &&
          stored !== null &&
          isLearningScores((stored as Record<string, unknown>).scores)
        )
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

  if (!isReady)
    return (
      <div className="min-h-screen bg-[var(--am-bg-reading)]" aria-busy="true" />
    );

  // No scores yet — empty state
  if (!scores)
    return (
      <PageShell>
        <section className="mx-auto max-w-xl rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-8 text-center shadow-[var(--am-shadow-sm)]">
          <h1 className="text-2xl font-semibold text-[var(--am-text-primary)]">
            Start with your Learning DNA
          </h1>
          <p className="mt-3 leading-7 text-[var(--am-text-secondary)]">
            Your dashboard becomes personal after the short assessment.
          </p>
          <Link
            href="/assessment"
            className="am-btn am-btn-primary mt-6 inline-flex"
          >
            Take the assessment
          </Link>
        </section>
      </PageShell>
    );

  const profile = buildTeachingProfile(scores);
  const streak = getStreak(history);
  const topicsExplored = new Set(
    history.map((entry) => entry.topic.trim().toLowerCase()),
  ).size;
  const latest = history[0];

  return (
    <PageShell heading="" subheading="">
      <div className="space-y-8">
        {/* Header */}
        <DashboardHeader
          streak={streak}
          lessonsCompleted={history.length}
          primaryLabel={
            profile.primaryDimension[0].toUpperCase() +
            profile.primaryDimension.slice(1)
          }
        />

        {/* Quick actions — two-column layout */}
        <QuickActions hasHistory={history.length > 0} />

        {/* Learning DNA + side column */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <LearningDNACard scores={scores} />

          <div className="space-y-6">
            <PersonalizationCard scores={scores} />
            <ProgressCard
              lessonsCompleted={history.length}
              topicsExplored={topicsExplored}
              streak={streak}
              lastLessonDate={
                latest
                  ? new Date(latest.date).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null
              }
            />
          </div>
        </div>

        {/* Study Plan */}
        <StudyPlanCard plan={studyPlan} />

        {/* Mastery */}
        <MasteryOverview
          entries={mastery.entries}
          mastered={mastery.mastered}
          developing={mastery.developing}
          needsReview={mastery.needsReview}
          averageRecentScore={mastery.averageRecentScore}
        />

        {/* Recommendations + History or Empty */}
        {history.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <RecommendationCard
              recommendation={getLessonRecommendation(latest.topic)}
            />
            <RecentLessons history={history} />
          </div>
        ) : (
          <EmptyDashboard />
        )}
      </div>
    </PageShell>
  );
}
