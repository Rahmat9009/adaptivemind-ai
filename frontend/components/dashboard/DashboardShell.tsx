"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
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
import { loadLearningDNA2, type LearningDNA2 } from "@/lib/learning-dna-v2";
import { getDueReviews, getUpcomingReviews } from "@/lib/spaced-review";
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
import { LearningDNAEvidence } from "./LearningDNAEvidence";
import { SpacedReviewCard } from "./SpacedReviewCard";
import { PrivacySummary } from "./PrivacySummary";

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
  const [dna2, setDna2] = useState<LearningDNA2 | null>(null);
  const [dueReviews, setDueReviews] = useState<ReturnType<typeof getDueReviews>>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<ReturnType<typeof getUpcomingReviews>>([]);
  const [resetConfirm, setResetConfirm] = useState(false);
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
        setDna2(loadLearningDNA2());
        setDueReviews(getDueReviews());
        setUpcomingReviews(getUpcomingReviews());
        markDashboardVisited();
      } finally {
        setIsReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isReady)
    return <div className="min-h-screen bg-[var(--am-bg)]" aria-busy="true" />;

  if (!scores)
    return (
      <PageShell>
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-xl am-card p-8 text-center"
        >
          <h1 className="am-heading-serif text-2xl text-[var(--am-text-primary)]">
            Start with your Learning DNA
          </h1>
          <p className="mt-3 leading-7 text-[var(--am-text-secondary)]">
            Your dashboard becomes personal after the short assessment.
          </p>
          <Link href="/assessment" className="am-btn am-btn-primary mt-6 inline-flex">
            Take the assessment
          </Link>
        </motion.section>
      </PageShell>
    );

  function handleExportProfile() {
    const data = {
      scores,
      history: history.slice(0, 20),
      mastery: mastery.entries.slice(0, 20),
      dna2,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adaptivemind-profile-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleResetData() {
    localStorage.removeItem(profileStorageKey);
    localStorage.removeItem("adaptivemind-learning-dna-v2");
    localStorage.removeItem("adaptivemind-mastery");
    localStorage.removeItem("adaptivemind-review-cards");
    localStorage.removeItem("adaptivemind-confidence-records");
    localStorage.removeItem("adaptivemind-current-lesson");
    localStorage.removeItem("adaptivemind-lesson-conversation");
    window.location.reload();
  }

  const profile = buildTeachingProfile(scores);
  const streak = getStreak(history);
  const topicsExplored = new Set(
    history.map((entry) => entry.topic.trim().toLowerCase()),
  ).size;
  const latest = history[0];

  return (
    <PageShell heading="" subheading="">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={staggerItem}>
          <DashboardHeader
            streak={streak}
            lessonsCompleted={history.length}
            primaryLabel={
              profile.primaryDimension[0].toUpperCase() +
              profile.primaryDimension.slice(1)
            }
          />
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={staggerItem}>
          <QuickActions hasHistory={history.length > 0} />
        </motion.div>

        {/* Learning DNA + personalization side column */}
        <motion.div variants={staggerItem} className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
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
        </motion.div>

        {/* Study Plan */}
        <motion.div variants={staggerItem}>
          <StudyPlanCard plan={studyPlan} />
        </motion.div>

        {/* Learning DNA Evidence */}
        {dna2 && (
          <motion.div variants={staggerItem}>
            <LearningDNAEvidence dna={dna2} />
          </motion.div>
        )}

        {/* Spaced Review */}
        <motion.div variants={staggerItem}>
          <SpacedReviewCard dueReviews={dueReviews} upcomingReviews={upcomingReviews} />
        </motion.div>

        {/* Mastery */}
        <motion.div variants={staggerItem}>
          <MasteryOverview
            entries={mastery.entries}
            mastered={mastery.mastered}
            developing={mastery.developing}
            needsReview={mastery.needsReview}
            averageRecentScore={mastery.averageRecentScore}
          />
        </motion.div>

        {/* Recommendations + History */}
        {history.length > 0 ? (
          <motion.div variants={staggerItem} className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <RecommendationCard
              recommendation={getLessonRecommendation(latest.topic)}
            />
            <RecentLessons history={history} />
          </motion.div>
        ) : (
          <motion.div variants={staggerItem}>
            <EmptyDashboard />
          </motion.div>
        )}

        {/* Privacy & Data */}
        <motion.div variants={staggerItem}>
          <PrivacySummary
            onExport={handleExportProfile}
            onReset={() => setResetConfirm(true)}
            resetConfirm={resetConfirm}
            onConfirmReset={handleResetData}
            onCancelReset={() => setResetConfirm(false)}
          />
        </motion.div>
      </motion.div>
    </PageShell>
  );
}
