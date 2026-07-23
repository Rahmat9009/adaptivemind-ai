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
import {
  getLearningActivities,
  getPendingOfflineItems,
  saveLearningActivities,
} from "@/lib/idb";
import {
  deriveActivitiesFromExplanationHistory,
  getLearningMomentum,
  type LearningActivity,
} from "@/lib/learning-activity";
import {
  loadExplanationHistory,
  type ExplanationHistory,
} from "@/lib/explanation-history";
import {
  classifyCalibration,
  loadCalibrationRecords,
  type CalibrationSummary,
} from "@/lib/confidence-calibration";
import { useOfflineLessons } from "@/hooks/useOfflineLessons";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { DashboardHeader } from "./DashboardHeader";
import { EmptyDashboard } from "./EmptyDashboard";
import { LearningDNACard } from "./LearningDNACard";
import { PersonalizationCard } from "./PersonalizationCard";
import { ProgressCard } from "./ProgressCard";
import { QuickActions } from "./QuickActions";
import { RecentLessons } from "./RecentLessons";
import { MasteryOverview } from "./MasteryOverview";
import { StudyPlanCard } from "./StudyPlanCard";
import { readStudyPlan, type StudyPlan } from "@/lib/study-planner";
import { LearningDNAEvidence } from "./LearningDNAEvidence";
import { SpacedReviewCard } from "./SpacedReviewCard";
import { PrivacySummary } from "./PrivacySummary";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { ConfidenceInsightCard } from "./ConfidenceInsightCard";
import { ExplanationHistorySummary } from "./ExplanationHistorySummary";
import { OfflineLibraryCard } from "./OfflineLibraryCard";
import {
  NextLearningAction,
  type NextLearningActionData,
} from "./NextLearningAction";

const profileStorageKey = "adaptivemind-learning-dna";

function isLearningScores(value: unknown): value is LearningScores {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["visual", "examples", "analogies", "stories", "challenges"].every(
    (dimension) => typeof record[dimension] === "number",
  );
}

function getNextAction(
  dueReviews: ReturnType<typeof getDueReviews>,
  plan: StudyPlan | null,
  history: LessonHistoryEntry[],
): NextLearningActionData {
  const due = dueReviews[0];
  if (due) {
    return {
      label: "Quick recall due",
      topic: due.topic,
      reason:
        "This topic is due for retrieval practice based on its local review schedule.",
      href: `/tutor?topic=${encodeURIComponent(due.topic)}&review=true`,
    };
  }

  const nextTask = plan?.days
    .flatMap((day) => day.tasks)
    .find((task) => !task.completed);
  if (nextTask) {
    return {
      label: `Study plan: ${nextTask.type.replace("-", " ")}`,
      topic: nextTask.topic,
      reason: nextTask.reason,
      href: `/tutor?topic=${encodeURIComponent(nextTask.topic)}`,
    };
  }

  const latest = history[0];
  const recommendation = latest
    ? getLessonRecommendation(latest.topic)
    : null;
  if (recommendation) {
    return {
      label: "Strengthen recent understanding",
      topic: recommendation.topic,
      reason: recommendation.reason,
      href: `/tutor?topic=${encodeURIComponent(recommendation.topic)}&subject=${encodeURIComponent(recommendation.subject)}&level=${encodeURIComponent(recommendation.level)}`,
    };
  }

  return {
    label: "Start gathering learning evidence",
    topic: "Choose any educational topic",
    reason:
      "No outcome evidence is available yet. Complete one lesson and understanding check to give Ada a reliable starting point.",
    href: "/tutor",
  };
}

export function DashboardShell() {
  const offlineLessons = useOfflineLessons();
  const isOnline = useOnlineStatus();
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
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [explanationHistory, setExplanationHistory] =
    useState<ExplanationHistory>({ concepts: {}, conceptOrder: [] });
  const [calibration, setCalibration] = useState<CalibrationSummary>(() =>
    classifyCalibration([]),
  );
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
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
        const loadedHistory = readLearningHistory();
        const loadedPlan = readStudyPlan();
        const loadedExplanationHistory = loadExplanationHistory();
        setHistory(loadedHistory);
        setMastery(getMasterySummary());
        setStudyPlan(loadedPlan);
        setDna2(loadLearningDNA2());
        setDueReviews(getDueReviews());
        setUpcomingReviews(getUpcomingReviews());
        setExplanationHistory(loadedExplanationHistory);
        setCalibration(classifyCalibration(loadCalibrationRecords()));
        markDashboardVisited();

        const legacyActivities = deriveActivitiesFromExplanationHistory(
          loadedExplanationHistory,
        );
        void Promise.all([
          getLearningActivities(),
          getPendingOfflineItems(),
        ]).then(async ([storedActivities, pendingItems]) => {
          const knownIds = new Set(
            storedActivities.map((activity) => activity.id),
          );
          const missingLegacy = legacyActivities.filter(
            (activity) => !knownIds.has(activity.id),
          );
          if (missingLegacy.length) {
            try {
              await saveLearningActivities(missingLegacy);
            } catch {
              // The in-memory dashboard can still show migrated local evidence.
            }
          }
          if (cancelled) return;
          setActivities(
            [...storedActivities, ...missingLegacy].sort(
              (a, b) =>
                Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
            ),
          );
          setPendingOfflineCount(pendingItems.length);
          setActivitiesLoading(false);
        }).catch(() => {
          if (cancelled) return;
          setActivities(legacyActivities);
          setActivitiesLoading(false);
        });
      } finally {
        setIsReady(true);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!isReady)
    return (
      <PageShell>
        <div
          className="min-h-48 border-y border-[var(--am-border-light)] py-12 text-center text-sm text-[var(--am-text-muted)]"
          aria-busy="true"
          role="status"
        >
          Loading your local learning dashboard...
        </div>
      </PageShell>
    );

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
      activities: activities.slice(0, 100),
      explanationHistory,
      confidenceCalibration: calibration,
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
  const momentum = getLearningMomentum(activities);
  const topicsWithEvidence = new Set(
    activities
      .map((activity) => activity.topic?.trim().toLowerCase())
      .filter((topic): topic is string => Boolean(topic)),
  ).size;
  const nextAction = getNextAction(dueReviews, studyPlan, history);
  const recommendedApproach =
    dna2?.currentRecommendation ?? profile.primaryDimension;
  const totalEvidence = dna2
    ? Object.values(dna2.observedEffectiveness).reduce(
        (sum, evidence) => sum + evidence.evidenceCount,
        0,
      )
    : 0;
  const approachReason = dna2?.recommendationReason
    ?? `This starts from your initial ${profile.primaryDimension} preference. Outcome evidence is still limited.`;
  const lastActivityDate = momentum.latestActivityAt
    ? new Date(momentum.latestActivityAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

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
            activeDays={momentum.activeDaysLast14}
            meaningfulActions={activities.length}
            primaryLabel={
              recommendedApproach[0].toUpperCase()
              + recommendedApproach.slice(1)
            }
          />
        </motion.div>

        <motion.div variants={staggerItem}>
          <NextLearningAction
            action={nextAction}
            approach={recommendedApproach}
            approachReason={approachReason}
            evidenceCount={totalEvidence}
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
              meaningfulActions={activities.length}
              topicsWithEvidence={topicsWithEvidence}
              activeDays={momentum.activeDaysLast14}
              lastActivityDate={lastActivityDate}
            />
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <ActivityHeatmap
            activities={activities}
            loading={activitiesLoading}
          />
          <SpacedReviewCard
            dueReviews={dueReviews}
            upcomingReviews={upcomingReviews}
          />
        </motion.div>

        <motion.div variants={staggerItem}>
          <MasteryOverview
            entries={mastery.entries}
            mastered={mastery.mastered}
            developing={mastery.developing}
            needsReview={mastery.needsReview}
            averageRecentScore={mastery.averageRecentScore}
          />
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="grid gap-8 lg:grid-cols-2"
        >
          <StudyPlanCard plan={studyPlan} />
          <OfflineLibraryCard
            lessonCount={offlineLessons.lessons.length}
            pendingCount={pendingOfflineCount}
            loading={offlineLessons.loading}
            isOnline={isOnline}
          />
        </motion.div>

        {dna2 && (
          <motion.div
            variants={staggerItem}
            className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <LearningDNAEvidence dna={dna2} />
            <ConfidenceInsightCard summary={calibration} />
          </motion.div>
        )}

        <motion.div
          variants={staggerItem}
          className="grid gap-8 lg:grid-cols-2"
        >
          <ExplanationHistorySummary history={explanationHistory} />
          {history.length > 0 ? (
            <RecentLessons history={history} />
          ) : (
            <EmptyDashboard />
          )}
        </motion.div>

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
