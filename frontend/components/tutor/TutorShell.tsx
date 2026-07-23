"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import type {
  TeachingMode,
  TutorApiResponse,
  TutorConversationMessage,
  TutorConversationTurn,
  TutorFollowUpApiResponse,
  TutorFollowUpResponse,
  TutorLesson,
  TutorLessonAction,
  TutorResponseSource,
  UnderstandingEvaluation,
  UnderstandingEvaluationApiResponse,
  ExplainBackApiResponse,
} from "@/lib/ai/types";
import {
  learningDimensions,
  type LearningDimension,
  type LearningScores,
} from "@/lib/learning-dna";
import { isTutorHandoff, tutorHandoffStorageKey } from "@/lib/tutor-handoff";
import {
  addLessonToHistory,
  historyRestoreStorageKey,
  readLearningHistory,
  saveHistoryConversation,
  saveHistoryEvaluation,
  startNewTopicStorageKey,
  type LessonHistoryEntry,
} from "@/lib/dashboard-storage";
import {
  createMasteryEvidenceId,
  getTopicMastery,
  normalizeTopicId,
  updateTopicMastery,
} from "@/lib/mastery";
import {
  loadLearningDNA2,
  saveLearningDNA2,
  recordCheckOutcome,
} from "@/lib/learning-dna-v2";
import {
  teachingModeToDimension,
} from "@/lib/mode-effectiveness";
import {
  getReviewCard,
  upsertReviewCard,
  updateReviewCard,
} from "@/lib/spaced-review";
import { PageShell } from "@/components/am/PageShell";
import { LearningDNACompact } from "./LearningDNACompact";
import { LessonActions } from "./LessonActions";
import { LessonCard } from "./LessonCard";
import { LessonFollowUp } from "./LessonFollowUp";
import { TopicForm } from "./TopicForm";
import { TutorEmptyState } from "./TutorEmptyState";
import { TutorErrorState } from "./TutorErrorState";
import { TutorLoadingState } from "./TutorLoadingState";
import { UnderstandingCheck } from "./UnderstandingCheck";
import { UnderstandingFeedback } from "./UnderstandingFeedback";
import { ExplainBack, type ExplainBackFeedback, type ExplainBackState } from "./ExplainBack";
import { HintLadder } from "./HintLadder";
import {
  defaultReadingSettings,
  loadReadingSettings,
  type ReadingSettings,
} from "@/lib/reading-preferences";
import { ReadingPreferencesInline } from "./ReadingPreferencesInline";
import { ConfidenceCoaching } from "./ConfidenceCoaching";
import { WhyThisMode } from "./WhyThisMode";
import { QuickRecall } from "./QuickRecall";
import {
  scheduleQuickRecall,
  simulateQuickRecallDue,
  getQuickRecallStatus,
  completeQuickRecall,
  type QuickRecallRecord,
} from "@/lib/quick-recall";
import { LearnerTransparency } from "./LearnerTransparency";
import { PreferenceOverridesUI } from "./PreferenceOverridesUI";
import { ExplanationHistoryView } from "./ExplanationHistoryView";
import { PeerAgent, type PeerAgentState, type PeerAgentMessage } from "./PeerAgent";
import {
  addExplanationRecord,
  getExplanationHistoryForConcept,
} from "@/lib/explanation-history";
import { loadPreferenceOverrides } from "@/lib/preference-overrides";
import { saveCalibrationRecord } from "@/lib/confidence-calibration";
import { saveLearningActivity } from "@/lib/idb";
import type {
  SourceGroundingMode,
  TutorSource,
} from "@/lib/sources";

const profileStorageKey = "adaptivemind-learning-dna";
const lessonStorageKey = "adaptivemind-current-lesson";
const tutorDraftStorageKey = "adaptivemind-tutor-draft";
const conversationStorageKey = "adaptivemind-lesson-conversation";
const balancedScores: LearningScores = {
  visual: 50,
  examples: 50,
  analogies: 50,
  stories: 50,
  challenges: 50,
};

interface TutorProfile {
  scores: LearningScores;
  isBalanced: boolean;
}
interface StoredLessonSession {
  response: TutorApiResponse;
  topic: string;
  subject: string;
  level: string;
  teachingMode: TeachingMode;
  historyId?: string;
}
interface StoredConversation {
  lessonTitle: string;
  turns: TutorConversationTurn[];
}

function isLearningScores(value: unknown): value is LearningScores {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return learningDimensions.every(
    (dimension) =>
      typeof record[dimension] === "number" &&
      record[dimension] >= 0 &&
      record[dimension] <= 100,
  );
}

function isStyles(value: unknown): value is LearningDimension[] {
  return (
    Array.isArray(value) &&
    value.every(
      (style) =>
        typeof style === "string" &&
        learningDimensions.includes(style as LearningDimension),
    )
  );
}

function isTutorLesson(value: unknown): value is TutorLesson {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.title === "string" &&
    typeof record.coreIdea === "string" &&
    typeof record.explanation === "string" &&
    Array.isArray(record.keyPoints) &&
    record.keyPoints.every((point: unknown) => typeof point === "string") &&
    typeof record.checkQuestion === "string" &&
    isStyles(record.stylesUsed)
  );
}

function isTeachingMode(value: unknown): value is TeachingMode {
  return (
    value === "adaptive" ||
    value === "visual" ||
    value === "example" ||
    value === "analogy" ||
    value === "story" ||
    value === "challenge"
  );
}

function isTutorResponseSource(value: unknown): value is TutorResponseSource {
  return (
    value === "live-primary" ||
    value === "live-fallback" ||
    value === "local-fallback" ||
    value === "provider" ||
    value === "demo"
  );
}

function isLessonAction(value: unknown): value is TutorLessonAction {
  return (
    value === "initial" ||
    value === "simpler" ||
    value === "different" ||
    value === "example" ||
    value === "challenge" ||
    value === "visualize"
  );
}

function isTutorResponse(value: unknown): value is TutorApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isTutorLesson(record.lesson) &&
    isTutorResponseSource(record.source) &&
    isTeachingMode(record.teachingMode) &&
    isLessonAction(record.action)
  );
}

function isFollowUpResponse(
  value: unknown,
): value is TutorFollowUpResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.answer === "string" &&
    record.answer.length > 0 &&
    isStyles(record.stylesUsed)
  );
}

function isFollowUpApiResponse(
  value: unknown,
): value is TutorFollowUpApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isFollowUpResponse(record.followUp) &&
    isTutorResponseSource(record.source) &&
    isTeachingMode(record.teachingMode) &&
    record.action === "followup"
  );
}

function isEvaluationApiResponse(
  value: unknown,
): value is UnderstandingEvaluationApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const evaluation = record.evaluation as Record<string, unknown> | undefined;
  return (
    record.action === "evaluate" &&
    isTutorResponseSource(record.source) &&
    typeof evaluation === "object" &&
    evaluation !== null &&
    (evaluation.status === "correct" ||
      evaluation.status === "partial" ||
      evaluation.status === "misconception" ||
      evaluation.status === "uncertain") &&
    typeof evaluation.score === "number" &&
    typeof evaluation.feedback === "string" &&
    Array.isArray(evaluation.stylesUsed)
  );
}

function isExplainBackApiResponse(
  value: unknown,
): value is ExplainBackApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const evaluation = record.evaluation as Record<string, unknown> | undefined;
  return (
    record.action === "explain-back" &&
    isTutorResponseSource(record.source) &&
    typeof evaluation === "object" &&
    evaluation !== null &&
    typeof evaluation.isComplete === "boolean" &&
    typeof evaluation.score === "number" &&
    Array.isArray(evaluation.understood) &&
    Array.isArray(evaluation.missing) &&
    Array.isArray(evaluation.stylesUsed)
  );
}

function isMessage(value: unknown): value is TutorConversationMessage {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.role === "student" || record.role === "tutor") &&
    typeof record.content === "string" &&
    typeof record.createdAt === "string"
  );
}

function isTurn(value: unknown): value is TutorConversationTurn {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isMessage(record.student) &&
    isMessage(record.tutor) &&
    isFollowUpResponse(record.response)
  );
}

function normalizeStoredLesson(
  value: unknown,
): StoredLessonSession | null {
  if (isTutorResponse(value))
    return {
      response: value,
      topic: "",
      subject: "Science",
      level: "High school",
      teachingMode: value.teachingMode,
    };
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    !isTutorResponse(record.response) ||
    typeof record.topic !== "string" ||
    typeof record.subject !== "string" ||
    typeof record.level !== "string" ||
    !isTeachingMode(record.teachingMode)
  )
    return null;
  return {
    response: record.response,
    topic: record.topic,
    subject: record.subject,
    level: record.level,
    teachingMode: record.teachingMode,
    historyId:
      typeof record.historyId === "string"
        ? record.historyId.slice(0, 120)
        : undefined,
  };
}

function getErrorMessage(value: unknown): string {
  if (typeof value !== "object" || value === null) return "Please try again.";
  const message = (value as Record<string, unknown>).error;
  return typeof message === "string" ? message : "Please try again.";
}

function getSavedProfile(): TutorProfile | null {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(profileStorageKey) ?? "null",
    );
    if (typeof value !== "object" || value === null) return null;
    const record = value as Record<string, unknown>;
    return isLearningScores(record.scores)
      ? { scores: record.scores, isBalanced: false }
      : null;
  } catch {
    return null;
  }
}

function createMessage(
  role: TutorConversationMessage["role"],
  content: string,
): TutorConversationMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function TutorShell() {
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Science");
  const [level, setLevel] = useState("High school");
  const [teachingMode, setTeachingMode] = useState<TeachingMode>("adaptive");
  const [response, setResponse] = useState<TutorApiResponse | null>(null);
  const [conversation, setConversation] = useState<TutorConversationTurn[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<UnderstandingEvaluation | null>(
    null,
  );
  const [evaluationSource, setEvaluationSource] =
    useState<TutorResponseSource>("live-primary");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [explainBackFeedback, setExplainBackFeedback] = useState<ExplainBackFeedback | null>(null);
  const [explainBackState, setExplainBackState] = useState<ExplainBackState>("prompt");
  const [isExplainBackLoading, setIsExplainBackLoading] = useState(false);
  const [explainBackError, setExplainBackError] = useState<string | null>(null);
  const [explainBackConfidence, setExplainBackConfidence] = useState<number | null>(null);
  const [explainBackRetries, setExplainBackRetries] = useState(0);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [hints, setHints] = useState<[string, string, string, string] | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [challengeStartedAt, setChallengeStartedAt] = useState<number | null>(null);
  const [timeBeforeFirstAttempt, setTimeBeforeFirstAttempt] = useState<number | null>(null);
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>(() => {
    try {
      return loadReadingSettings();
    } catch {
      return { ...defaultReadingSettings };
    }
  });
  const [showReadingPrefs, setShowReadingPrefs] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null);
  const [masteryReason, setMasteryReason] = useState<string | null>(null);
  const [understandingRetries, setUnderstandingRetries] = useState(0);
  const [didSwitchMode, setDidSwitchMode] = useState(false);
  const [quickRecallRecord, setQuickRecallRecord] = useState<QuickRecallRecord | null>(null);
  const [quickRecallStatus, setQuickRecallStatus] = useState<"due" | "completed" | "full-review-recommended" | "not-due">("not-due");
  const [quickRecallConfidence, setQuickRecallConfidence] = useState<number | null>(null);
  const [isQuickRecallLoading, setIsQuickRecallLoading] = useState(false);
  const [quickRecallError, setQuickRecallError] = useState<string | null>(null);
  const [quickRecallResult, setQuickRecallResult] = useState<{
    score: number;
    status: "correct" | "partial" | "incorrect";
    feedback: string;
  } | null>(null);
  const [peerAgentState, setPeerAgentState] = useState<PeerAgentState>("prompt");
  const [peerAgentMessages, setPeerAgentMessages] = useState<PeerAgentMessage[]>([]);
  const [isPeerLoading, setIsPeerLoading] = useState(false);
  const [peerError, setPeerError] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<TutorSource[]>([]);
  const [activeSourceMode, setActiveSourceMode] =
    useState<SourceGroundingMode | undefined>(undefined);
  const [composerSessionId, setComposerSessionId] = useState(0);
  const latestTurnRef = useRef<HTMLDivElement>(null);
  const activeRequestsRef = useRef(new Set<AbortController>());
  const lessonRequestPendingRef = useRef(false);

  async function postTutorRequest(
    body: Omit<Record<string, unknown>, "requestId">,
  ): Promise<unknown> {
    const controller = new AbortController();
    const requestId = crypto.randomUUID();
    activeRequestsRef.current.add(controller);
    const timeoutId = window.setTimeout(() => controller.abort(), 35_000);

    try {
      const apiResponse = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          ...getLearnerRequestContext(),
          requestId,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      const payload: unknown = await apiResponse.json().catch(() => null);
      if (!apiResponse.ok) throw new Error(getErrorMessage(payload));
      return payload;
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        throw new Error("Ada took too long to respond. Your previous lesson is still available.");
      }
      throw requestError;
    } finally {
      window.clearTimeout(timeoutId);
      activeRequestsRef.current.delete(controller);
    }
  }

  function getLearnerRequestContext() {
    try {
      const dna = loadLearningDNA2();
      const preferences = loadPreferenceOverrides();
      const evidenceCount = Object.values(dna.observedEffectiveness).reduce(
        (sum, evidence) => sum + evidence.evidenceCount,
        0,
      );
      return {
        adaptationContext: {
          recommendedApproach: dna.currentRecommendation,
          recommendationReason: dna.recommendationReason,
          evidenceCount,
          confidence: dna.recommendationConfidence,
        },
        learnerPreferences: {
          detailPreference: preferences.detailPreference,
          conciseStories: preferences.conciseStories,
          startChallengesEasy: preferences.startChallengesEasy,
          likedDomains: preferences.likedDomains,
          bannedDomains: preferences.bannedDomains,
          dislikedPatterns: preferences.dislikedPatterns,
        },
      };
    } catch {
      return {};
    }
  }

  function clearConversation() {
    setConversation([]);
    setFollowUpError(null);
    localStorage.removeItem(conversationStorageKey);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfile(getSavedProfile());
      try {
        const startNewTopic =
          sessionStorage.getItem(startNewTopicStorageKey) === "true";
        sessionStorage.removeItem(startNewTopicStorageKey);
        const restoreId = startNewTopic
          ? null
          : sessionStorage.getItem(historyRestoreStorageKey);
        const restoredLesson = restoreId
          ? readLearningHistory().find((entry) => entry.id === restoreId)
          : null;
        sessionStorage.removeItem(historyRestoreStorageKey);
        const params = new URLSearchParams(window.location.search);
        const suggestedTopic = params.get("topic");
        const suggestedSubject = params.get("subject");
        const suggestedLevel = params.get("level");
        const session = restoredLesson
          ? {
              response: restoredLesson.response,
              topic: restoredLesson.topic,
              subject: restoredLesson.subject,
              level: restoredLesson.level,
              teachingMode: restoredLesson.teachingMode,
              historyId: restoredLesson.id,
            }
          : startNewTopic
            ? null
            : suggestedTopic
              ? null
            : normalizeStoredLesson(
                JSON.parse(
                  localStorage.getItem(lessonStorageKey) ?? "null",
                ),
              );
        if (session) {
          setResponse(session.response);
          setTopic(session.topic);
          setSubject(session.subject);
          setLevel(session.level);
          setTeachingMode(session.teachingMode);
          if (session.historyId) setHistoryId(session.historyId);
          if (restoredLesson) {
            if (restoredLesson.conversation)
              setConversation(restoredLesson.conversation.slice(-4));
          }
          const storedConversation: unknown = restoredLesson
            ? null
            : JSON.parse(
                localStorage.getItem(conversationStorageKey) ?? "null",
              );
          if (
            typeof storedConversation === "object" &&
            storedConversation !== null
          ) {
            const record = storedConversation as Record<string, unknown>;
            if (
              record.lessonTitle === session.response.lesson.title &&
              Array.isArray(record.turns) &&
              record.turns.length <= 4 &&
              record.turns.every(isTurn)
            )
              setConversation(record.turns);
          }
        } else {
          if (suggestedTopic) setTopic(suggestedTopic.slice(0, 500));
          if (suggestedSubject) setSubject(suggestedSubject.slice(0, 50));
          if (suggestedLevel) setLevel(suggestedLevel.slice(0, 50));
        }
        const savedDraft = localStorage.getItem(tutorDraftStorageKey);
        if (!startNewTopic && !suggestedTopic && savedDraft?.trim()) {
          setTopic(savedDraft.slice(0, 500));
        }
      } catch {
        localStorage.removeItem(lessonStorageKey);
        localStorage.removeItem(conversationStorageKey);
      }
      try {
        const handoff: unknown = JSON.parse(
          sessionStorage.getItem(tutorHandoffStorageKey) ?? "null",
        );
        if (isTutorHandoff(handoff)) setHandoffMessage(handoff.message);
        sessionStorage.removeItem(tutorHandoffStorageKey);
      } catch {
        sessionStorage.removeItem(tutorHandoffStorageKey);
      }
      setIsReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      if (topic.trim()) {
        localStorage.setItem(tutorDraftStorageKey, topic.slice(0, 500));
      } else {
        localStorage.removeItem(tutorDraftStorageKey);
      }
    } catch {
      // The active Tutor session still works when draft storage is unavailable.
    }
  }, [isReady, topic]);

  useEffect(() => () => {
    for (const controller of activeRequestsRef.current) controller.abort();
    activeRequestsRef.current.clear();
  }, []);

  useEffect(() => {
    if (conversation.length)
      latestTurnRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [conversation.length]);

  async function requestLesson(
    action: TutorLessonAction,
    submittedSources: TutorSource[] = activeSources,
    submittedSourceMode: SourceGroundingMode | undefined = activeSourceMode,
  ) {
    if (!profile || !topic.trim() || lessonRequestPendingRef.current) return;
    lessonRequestPendingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const previousLesson = response?.lesson;
      const evaluationContext = evaluation
        ? ` Latest understanding check: ${evaluation.status}; focus: ${evaluation.needsReview.join(", ")}.`
        : "";
      const payload = await postTutorRequest({
          topic: topic.trim(),
          subject,
          level,
          scores: profile.scores,
          action,
          teachingMode,
          previousStyles: previousLesson?.stylesUsed,
          previousTeachingMode: response?.teachingMode,
          previousTitle: previousLesson?.title,
          previousExplanation: `${previousLesson?.explanation?.slice(0, 250) ?? ""}${evaluationContext}`.slice(
            0,
            360,
          ),
          sources: submittedSources.length ? submittedSources : undefined,
          sourceMode: submittedSources.length
            ? submittedSourceMode
            : undefined,
      });
      if (!isTutorResponse(payload))
        throw new Error(
          "The tutor returned an incomplete lesson. Please try again.",
        );
      setResponse(payload);
      localStorage.removeItem(tutorDraftStorageKey);
      setEvaluation(null);
      setConfidenceBefore(null);
      setMasteryReason(null);
      setUnderstandingRetries(0);
      setExplainBackFeedback(null);
      setExplainBackState("prompt");
      setExplainBackConfidence(null);
      setExplainBackRetries(0);
      setHints(null);
      setHintLevel(0);
      setHintError(null);
      setHasAttempted(false);
      setChallengeStartedAt(payload.lesson.challenge ? Date.now() : null);
      setTimeBeforeFirstAttempt(null);
      setActiveSources(submittedSources);
      setActiveSourceMode(
        submittedSources.length ? submittedSourceMode : undefined,
      );
      clearConversation();
      let recommendationReason =
        "This lesson used the selected teaching approach.";
      try {
        recommendationReason =
          teachingMode === "adaptive"
            ? loadLearningDNA2().recommendationReason
            : `You selected ${teachingMode} mode. Ada will use the outcome to improve later recommendations.`;
      } catch {
        // The lesson remains usable without Learning DNA metadata.
      }
      const historyEntry = addLessonToHistory({
        topic: topic.trim(),
        subject,
        level,
        teachingMode,
        stylesUsed: payload.lesson.stylesUsed,
        response: payload,
        recommendationReason,
      });
      setHistoryId(historyEntry.id);
      void import("@/lib/offline-lessons")
        .then(({ autoCacheOfflineLesson }) =>
          autoCacheOfflineLesson(historyEntry),
        )
        .catch(() => {
          // Automatic caching is optional and never blocks the live lesson.
        });
      localStorage.setItem(
        lessonStorageKey,
        JSON.stringify({
          response: payload,
          topic: topic.trim(),
          subject,
          level,
          teachingMode,
          historyId: historyEntry.id,
        } satisfies StoredLessonSession),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Please check your connection and try again.",
      );
    } finally {
      lessonRequestPendingRef.current = false;
      setIsLoading(false);
    }
  }

  async function requestFollowUp(question: string): Promise<boolean> {
    if (!profile || !response || !topic.trim()) return false;
    setIsFollowUpLoading(true);
    setFollowUpError(null);
    const student = createMessage("student", question);
    const recentConversation = conversation
      .slice(-3)
      .flatMap((turn) => [turn.student, turn.tutor]);
    try {
      const payload = await postTutorRequest({
          topic: topic.trim(),
          subject,
          level,
          scores: profile.scores,
          action: "followup",
          teachingMode,
          question,
          currentLesson: {
            title: response.lesson.title,
            coreIdea: response.lesson.coreIdea,
            explanation: response.lesson.explanation.slice(0, 360),
            stylesUsed: response.lesson.stylesUsed,
          },
          conversation: recentConversation,
          sources: activeSources.length ? activeSources : undefined,
          sourceMode: activeSources.length ? activeSourceMode : undefined,
      });
      if (!isFollowUpApiResponse(payload))
        throw new Error(
          "Ada returned an incomplete follow-up. Please try again.",
        );
      const tutor = createMessage("tutor", payload.followUp.answer);
      const nextConversation = [
        ...conversation,
        { student, tutor, response: payload.followUp },
      ].slice(-4);
      setConversation(nextConversation);
      localStorage.setItem(
        conversationStorageKey,
        JSON.stringify({
          lessonTitle: response.lesson.title,
          turns: nextConversation,
        } satisfies StoredConversation),
      );
      if (historyId) saveHistoryConversation(historyId, nextConversation);
      return true;
    } catch (requestError) {
      setFollowUpError(
        requestError instanceof Error
          ? requestError.message
          : "Please check your connection and try again.",
      );
      return false;
    } finally {
      setIsFollowUpLoading(false);
    }
  }

  async function evaluateUnderstanding(answer: string, confidence: number) {
    if (!profile || !response || !topic.trim()) return;
    setConfidenceBefore(confidence);
    setIsEvaluating(true);
    setEvaluationError(null);
    try {
      const payload = await postTutorRequest({
          topic: topic.trim(),
          subject,
          level,
          scores: profile.scores,
          action: "evaluate",
          teachingMode,
          learnerAnswer: answer,
          learnerConfidence: confidence,
          checkQuestion: response.lesson.checkQuestion,
          lessonCoreIdea: response.lesson.coreIdea,
          lessonContext: response.lesson.explanation.slice(0, 500),
      });
      if (!isEvaluationApiResponse(payload))
        throw new Error("Ada returned an incomplete understanding check.");
      setEvaluation(payload.evaluation);
      setEvaluationSource(payload.source);
      const existingMastery = getTopicMastery().find(
        (entry) => entry.topicId === normalizeTopicId(topic.trim()),
      );
      const masteryBefore = existingMastery?.masteryPercent ?? 10;
      const evidenceId = createMasteryEvidenceId(
        topic.trim(),
        `${historyId ?? response.requestId ?? response.lesson.title}:understanding`,
        answer,
      );
      const mastery = updateTopicMastery(
        topic.trim(),
        subject,
        payload.evaluation.score,
        payload.evaluation.status,
        {
          evidenceId,
          kind: response.action === "challenge" ? "challenge" : "retrieval",
          hintsUsed: hintLevel,
          retries: understandingRetries,
          independent: response.action === "challenge" && hintLevel === 0,
        },
      );
      setMasteryReason(mastery.lastChangeReason);
      if (historyId)
        saveHistoryEvaluation(historyId, {
          score: payload.evaluation.score,
          status: payload.evaluation.status,
          masteryLevel: mastery.masteryLevel,
          evaluatedAt: new Date().toISOString(),
          needsReview: payload.evaluation.needsReview,
          misconception: payload.evaluation.misconception,
        });
      if (historyId) {
        const updatedHistoryEntry = readLearningHistory().find(
          (entry) => entry.id === historyId,
        );
        if (updatedHistoryEntry) {
          void import("@/lib/offline-lessons")
            .then(({ refreshOfflineLessonIfSaved }) =>
              refreshOfflineLessonIfSaved(updatedHistoryEntry),
            )
            .catch(() => {
              // Evaluation remains recorded even if an offline copy cannot update.
            });
        }
      }
      if (!mastery.lastEvidenceApplied) return;
      void saveLearningActivity({
        id: `activity:${evidenceId}`,
        type: "understanding-check",
        occurredAt: new Date().toISOString(),
        topic: topic.trim(),
        score: payload.evaluation.score,
      }).catch(() => {
        // The learning flow remains usable when IndexedDB is unavailable.
      });

      // ── LD2.0 data wiring ──
      // Record outcome in Learning DNA evidence model
      try {
        const dna = loadLearningDNA2();
        const approach = teachingModeToDimension(
          teachingMode,
          dna.currentRecommendation,
        );
        const updatedDna = recordCheckOutcome(dna, approach, {
          score: payload.evaluation.score,
          confidenceBefore: confidence,
          confidenceAfter: confidence,
          hintCount: hintLevel,
          retryCount: understandingRetries,
          switchedAway: didSwitchMode,
          evidenceId,
        });
        saveLearningDNA2(updatedDna);
        saveCalibrationRecord({
          selfReported: confidence,
          actualScore: payload.evaluation.score,
          timestamp: new Date().toISOString(),
          skillId: normalizeTopicId(topic.trim()),
          approach,
        });
      } catch { /* non-critical, silently skip */ }

      // Create or update SM-2 review card
      try {
        const quality = payload.evaluation.status === "correct" ? 5
          : payload.evaluation.status === "partial" ? 3
          : 1;
        const existing = getReviewCard(topic.trim());
        if (existing) {
          upsertReviewCard(updateReviewCard(existing, quality, topic.trim(), topic.trim(), subject));
        } else {
          const newCard = {
            skillId: topic.trim(),
            topic: topic.trim(),
            subject,
            repetition: 0,
            easeFactor: 2.5,
            interval: 0,
            qualityHistory: [] as number[],
          };
          upsertReviewCard(updateReviewCard(newCard, quality, topic.trim(), topic.trim(), subject));
        }
      } catch { /* non-critical */ }

      // ── Explanation history ──
      try {
        const dna = loadLearningDNA2();
        const approach = teachingModeToDimension(
          teachingMode,
          dna.currentRecommendation,
        );
        addExplanationRecord({
          conceptId: normalizeTopicId(topic.trim()),
          conceptLabel: topic.trim(),
          timestamp: new Date().toISOString(),
          approach,
          lessonId: historyId ?? "unknown",
          reasonSelected: teachingMode === "adaptive"
            ? dna.recommendationReason
            : "Learner selected this approach.",
          learnerConfidence: confidence,
          checkType: "understanding",
          evaluationStatus: payload.evaluation.status,
          evaluationScore: payload.evaluation.score,
          hintsUsed: hintLevel,
          retries: understandingRetries,
          masteryBefore,
          masteryAfter: mastery.masteryPercent,
          switchedAway: didSwitchMode,
          learnerFeedback: null,
          recommendationOutcome: payload.evaluation.status,
          attemptMade: response.action === "challenge" && hasAttempted,
          timeBeforeFirstAttemptSeconds:
            response.action === "challenge"
              ? timeBeforeFirstAttempt ?? undefined
              : undefined,
          highestHintLevel: hintLevel,
          eventualIndependentSuccess:
            response.action === "challenge"
              ? payload.evaluation.status === "correct" && hintLevel === 0
              : undefined,
        });
      } catch { /* non-critical */ }

      setDidSwitchMode(false);
      if (payload.evaluation.status !== "correct") {
        setUnderstandingRetries((current) => current + 1);
      }

      // ── Schedule quick recall ──
      try {
        const qr = scheduleQuickRecall(
          topic.trim(),
          topic.trim(),
          subject,
          false,
          `Without looking back, explain the central mechanism of ${topic.trim()} and give one consequence or application.`,
        );
        setQuickRecallRecord(qr);
        setQuickRecallStatus(getQuickRecallStatus(topic.trim()));
      } catch { /* non-critical */ }
    } catch (requestError) {
      setEvaluationError(
        requestError instanceof Error
          ? requestError.message
          : "Please try again.",
      );
    } finally {
      setIsEvaluating(false);
    }
  }

  function startNewLesson() {
    for (const controller of activeRequestsRef.current) controller.abort();
    activeRequestsRef.current.clear();
    lessonRequestPendingRef.current = false;
    setIsLoading(false);
    setResponse(null);
    setError(null);
    setTopic("");
    setHistoryId(null);
    setEvaluation(null);
    setExplainBackFeedback(null);
    setExplainBackState("prompt");
    setExplainBackConfidence(null);
    setExplainBackRetries(0);
    setHints(null);
    setHintLevel(0);
    setHintError(null);
    setHasAttempted(false);
    setChallengeStartedAt(null);
    setTimeBeforeFirstAttempt(null);
    setConfidenceBefore(null);
    setMasteryReason(null);
    setUnderstandingRetries(0);
    setDidSwitchMode(false);
    setQuickRecallRecord(null);
    setQuickRecallStatus("not-due");
    setQuickRecallConfidence(null);
    setQuickRecallResult(null);
    setQuickRecallError(null);
    setIsQuickRecallLoading(false);
    setActiveSources([]);
    setActiveSourceMode(undefined);
    setComposerSessionId((current) => current + 1);
    clearConversation();
    localStorage.removeItem(lessonStorageKey);
    localStorage.removeItem(tutorDraftStorageKey);
  }

  function handleTeachingModeChange(mode: TeachingMode) {
    if (response && mode !== teachingMode) setDidSwitchMode(true);
    setTeachingMode(mode);
  }

  async function requestExplainBack(
    learnerResponse: string,
    confidence: number,
  ) {
    if (!profile || !response || !topic.trim()) return;
    setIsExplainBackLoading(true);
    setExplainBackError(null);
    try {
      const payload = await postTutorRequest({
          topic: topic.trim(),
          subject,
          level,
          scores: profile.scores,
          action: "explain-back",
          teachingMode,
          learnerResponse,
          learnerConfidence: confidence,
          lessonContext: response.lesson.explanation.slice(0, 500),
      });
      if (!isExplainBackApiResponse(payload))
        throw new Error("Ada could not evaluate this explanation.");
      const evalResult = payload.evaluation;
      const evaluationStatus: UnderstandingEvaluation["status"] =
        evalResult.isComplete && evalResult.score >= 70
          ? "correct"
          : evalResult.misconception
            ? "misconception"
            : evalResult.score >= 40
              ? "partial"
              : "uncertain";
      const existingMastery = getTopicMastery().find(
        (entry) => entry.topicId === normalizeTopicId(topic.trim()),
      );
      const masteryBefore = existingMastery?.masteryPercent ?? 10;
      const evidenceId = createMasteryEvidenceId(
        topic.trim(),
        `${historyId ?? response.requestId ?? response.lesson.title}:explain-back`,
        learnerResponse,
      );
      const mastery = updateTopicMastery(
        topic.trim(),
        subject,
        evalResult.score,
        evaluationStatus,
        {
          evidenceId,
          kind: "explain-back",
          retries: explainBackRetries,
        },
      );
      setExplainBackFeedback({
        understood: evalResult.understood,
        missing: evalResult.missing,
        misconception: evalResult.misconception,
        followUpQuestion: evalResult.followUpQuestion,
        isComplete: evalResult.isComplete,
        masteryReason: mastery.lastChangeReason,
      });
      setExplainBackState("feedback");

      if (mastery.lastEvidenceApplied) {
        void saveLearningActivity({
          id: `activity:${evidenceId}`,
          type: "explain-back",
          occurredAt: new Date().toISOString(),
          topic: topic.trim(),
          score: evalResult.score,
        }).catch(() => {
          // The learning flow remains usable when IndexedDB is unavailable.
        });
        try {
          const dna = loadLearningDNA2();
          const approach = teachingModeToDimension(
            teachingMode,
            dna.currentRecommendation,
          );
          saveLearningDNA2(recordCheckOutcome(dna, approach, {
            score: evalResult.score,
            confidenceBefore: confidence,
            confidenceAfter: confidence,
            hintCount: 0,
            retryCount: explainBackRetries,
            switchedAway: didSwitchMode,
            evidenceId,
          }));
          saveCalibrationRecord({
            selfReported: confidence,
            actualScore: evalResult.score,
            timestamp: new Date().toISOString(),
            skillId: normalizeTopicId(topic.trim()),
            approach,
          });
          addExplanationRecord({
            conceptId: normalizeTopicId(topic.trim()),
            conceptLabel: topic.trim(),
            timestamp: new Date().toISOString(),
            approach,
            lessonId: `${historyId ?? "lesson"}:explain-back:${explainBackRetries}`,
            reasonSelected: teachingMode === "adaptive"
              ? dna.recommendationReason
              : "Learner selected this approach.",
            learnerConfidence: confidence,
            checkType: "explain-back",
            evaluationStatus,
            evaluationScore: evalResult.score,
            hintsUsed: 0,
            retries: explainBackRetries,
            masteryBefore,
            masteryAfter: mastery.masteryPercent,
            switchedAway: didSwitchMode,
            learnerFeedback: null,
            recommendationOutcome: evalResult.isComplete
              ? "Continue with application practice."
              : "Revise the explanation using the targeted feedback.",
          });
        } catch { /* Local evidence storage is non-critical. */ }
        setDidSwitchMode(false);
        if (!evalResult.isComplete) {
          setExplainBackRetries((current) => current + 1);
        }
      }
    } catch (requestError) {
      setExplainBackError(
        requestError instanceof Error
          ? requestError.message
          : "Please try again.",
      );
    } finally {
      setIsExplainBackLoading(false);
    }
  }

  function handleExplainBackRetry() {
    setExplainBackState("prompt");
    setExplainBackFeedback(null);
    setExplainBackConfidence(null);
  }

  function handleExplainBackNext() {
    setExplainBackState("prompt");
    setExplainBackFeedback(null);
    setExplainBackConfidence(null);
  }

  async function requestHints(level?: number) {
    if (!profile || !response || !topic.trim()) return;
    const requestedLevel = Math.max(
      1,
      Math.min(level ?? hintLevel + 1, 4),
    ) as 1 | 2 | 3 | 4;
    if (hints) {
      setHintLevel(requestedLevel);
      return;
    }
    setIsHintLoading(true);
    setHintError(null);
    try {
      const payload = await postTutorRequest({
          topic: topic.trim(),
          subject,
          level,
          scores: profile.scores,
          action: "hint",
          teachingMode,
          currentHintLevel: requestedLevel - 1,
          lessonContext: response.lesson.explanation.slice(0, 500),
          challengeContext: response.lesson.challenge,
      });
      if (payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>).hints)) {
        setHints((payload as { hints: [string, string, string, string] }).hints);
        setHintLevel(requestedLevel);
      }
    } catch (requestError) {
      setHintError(
        requestError instanceof Error
          ? requestError.message
          : "Ada could not load a hint. Please try again.",
      );
    } finally {
      setIsHintLoading(false);
    }
  }

  async function evaluateQuickRecall(
    answer: string,
    confidence: number,
  ) {
    if (
      !profile
      || !response
      || !quickRecallRecord
      || quickRecallStatus !== "due"
    ) {
      return;
    }
    setIsQuickRecallLoading(true);
    setQuickRecallError(null);
    try {
      const payload = await postTutorRequest({
        topic: quickRecallRecord.topic,
        subject: quickRecallRecord.subject ?? subject,
        level,
        scores: profile.scores,
        action: "evaluate",
        teachingMode,
        learnerAnswer: answer,
        learnerConfidence: confidence,
        checkQuestion: quickRecallRecord.question,
        lessonCoreIdea: response.lesson.coreIdea,
        lessonContext: response.lesson.explanation.slice(0, 500),
      });
      if (!isEvaluationApiResponse(payload)) {
        throw new Error("Ada returned an incomplete recall check.");
      }

      const result = payload.evaluation;
      const completed = completeQuickRecall(
        quickRecallRecord.skillId,
        result.score,
      );
      setQuickRecallRecord(completed.updated);
      setQuickRecallStatus(getQuickRecallStatus(quickRecallRecord.skillId));
      setQuickRecallResult({
        score: result.score,
        status: result.status === "correct"
          ? "correct"
          : result.status === "partial"
            ? "partial"
            : "incorrect",
        feedback: result.feedback,
      });

      const evidenceId = createMasteryEvidenceId(
        quickRecallRecord.topic,
        `quick-recall:${quickRecallRecord.createdAt}`,
        answer,
      );
      const masteryBefore = getTopicMastery().find(
        (entry) => entry.topicId === quickRecallRecord.skillId,
      )?.masteryPercent ?? 10;
      const mastery = updateTopicMastery(
        quickRecallRecord.topic,
        quickRecallRecord.subject ?? subject,
        result.score,
        result.status,
        {
          evidenceId,
          kind: "quick-recall",
          delayed: !quickRecallRecord.simulated
            && Date.parse(quickRecallRecord.dueAt) <= Date.now(),
        },
      );
      if (mastery.lastEvidenceApplied) {
        void saveLearningActivity({
          id: `activity:${evidenceId}`,
          type: "quick-recall",
          occurredAt: new Date().toISOString(),
          topic: quickRecallRecord.topic,
          score: result.score,
        }).catch(() => {
          // The learning flow remains usable when IndexedDB is unavailable.
        });
        const dna = loadLearningDNA2();
        const approach = teachingModeToDimension(
          teachingMode,
          dna.currentRecommendation,
        );
        saveLearningDNA2(recordCheckOutcome(dna, approach, {
          score: result.score,
          confidenceBefore: confidence,
          confidenceAfter: confidence,
          hintCount: 0,
          retryCount: quickRecallRecord.retries,
          switchedAway: false,
          evidenceId,
        }));
        saveCalibrationRecord({
          selfReported: confidence,
          actualScore: result.score,
          timestamp: new Date().toISOString(),
          skillId: quickRecallRecord.skillId,
          approach,
        });
        addExplanationRecord({
          conceptId: quickRecallRecord.skillId,
          conceptLabel: quickRecallRecord.topic,
          timestamp: new Date().toISOString(),
          approach,
          lessonId: `quick-recall:${quickRecallRecord.createdAt}`,
          reasonSelected: dna.recommendationReason,
          learnerConfidence: confidence,
          checkType: "quick-recall",
          evaluationStatus: result.status,
          evaluationScore: result.score,
          hintsUsed: 0,
          retries: quickRecallRecord.retries,
          masteryBefore,
          masteryAfter: mastery.masteryPercent,
          switchedAway: false,
          learnerFeedback: null,
          recommendationOutcome: completed.updated.fullReviewRecommended
            ? "Complete a full review."
            : "Continue with the scheduled review interval.",
        });
      }
    } catch (requestError) {
      setQuickRecallError(
        requestError instanceof Error
          ? requestError.message
          : "Ada could not check this recall.",
      );
    } finally {
      setIsQuickRecallLoading(false);
    }
  }

  // ── Practice-learner role-play handlers ──
  function startPeerSession() {
    setPeerAgentState("active");
    setPeerAgentMessages([]);
    setPeerError(null);
    const initialPrompt = `I heard something about "${topic.trim()}" but I am not sure I understand. Can you explain the main idea to me?`;
    setPeerAgentMessages([{ role: "peer", content: initialPrompt }]);
  }

  async function handlePeerSubmit(explanation: string) {
    if (!response) return;
    setIsPeerLoading(true);
    setPeerError(null);
    const userMsg: PeerAgentMessage = { role: "learner", content: explanation };
    setPeerAgentMessages((prev) => [...prev, userMsg]);
    try {
      const payload = await postTutorRequest({
          topic: topic.trim(),
          subject,
          level,
          scores: profile?.scores ?? balancedScores,
          action: "followup",
          teachingMode,
          question: `Ada is facilitating a transparent practice-learner exercise about "${topic.trim()}". Respond as Ada role-playing a learner who has just heard the student's explanation. Ask one brief follow-up question or identify one specific point that remains unclear. Do not claim to be human and do not conceal that this is an exercise. Keep the response to 2-3 sentences.`,
          currentLesson: {
            title: response.lesson.title,
            coreIdea: response.lesson.coreIdea,
            explanation: response.lesson.explanation.slice(0, 360),
            stylesUsed: response.lesson.stylesUsed,
          },
          conversation: [],
      });
      const answer = payload && typeof payload === "object" && "followUp" in payload
        ? (payload as { followUp: { answer: string } }).followUp?.answer
        : null;
      if (answer) {
        setPeerAgentMessages((prev) => [
          ...prev,
          { role: "peer", content: answer },
        ]);
      }
    } catch {
      setPeerError("Could not get a response. Try again.");
    } finally {
      setIsPeerLoading(false);
    }
  }

  function handlePeerComplete() {
    setPeerAgentState("complete");
    // Record explanation history
    try {
      addExplanationRecord({
        conceptId: normalizeTopicId(topic),
        conceptLabel: topic.trim(),
        timestamp: new Date().toISOString(),
        approach: teachingModeToDimension(teachingMode) ?? "adaptive",
        lessonId: historyId ?? "unknown",
        reasonSelected: "Ada practice-learner role-play",
        learnerConfidence: confidenceBefore ?? 50,
        checkType: "peer-agent",
        evaluationStatus: "correct",
        evaluationScore: 0,
        hintsUsed: 0,
        retries: 0,
        masteryBefore: 0,
        masteryAfter: 0,
        switchedAway: false,
        learnerFeedback: null,
        recommendationOutcome: "peer-session",
      });
    } catch { /* non-critical */ }
  }

  if (!isReady)
    return (
      <div
        className="min-h-screen bg-[var(--am-bg)]"
        aria-busy="true"
      />
    );

  if (!profile)
    return (
      <PageShell>
        <div className="py-12">
          <TutorEmptyState
            onUseBalancedProfile={() =>
              setProfile({ scores: balancedScores, isBalanced: true })
            }
          />
        </div>
      </PageShell>
    );

  const currentHistoryEntry: LessonHistoryEntry | undefined = historyId
    ? readLearningHistory().find((entry) => entry.id === historyId)
    : undefined;

  return (
    <PageShell heading="Ada" subheading="Your adaptive tutor">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        {/* Left: Profile + form */}
        <div className="space-y-6">
          <LearningDNACompact
            scores={profile.scores}
            isBalanced={profile.isBalanced}
          />
          <TopicForm
            key={composerSessionId}
            topic={topic}
            subject={subject}
            level={level}
            scores={profile.scores}
            teachingMode={teachingMode}
            isLoading={isLoading}
            onTopicChange={setTopic}
            onSubjectChange={setSubject}
            onLevelChange={setLevel}
            onTeachingModeChange={handleTeachingModeChange}
            onSubmit={(sources, sourceMode) =>
              requestLesson("initial", sources, sourceMode)
            }
          />

          {/* Reading Preferences toggle */}
          <Button
            type="button"
            color="tertiary"
            size="sm"
            onClick={() => setShowReadingPrefs(!showReadingPrefs)}
            className="w-full"
          >
            <span className="flex items-center justify-between w-full">
              <span>Reading preferences</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </span>
          </Button>
          {showReadingPrefs && (
            <div className="rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-4">
              <ReadingPreferencesInline
                settings={readingSettings}
                onChange={setReadingSettings}
              />
            </div>
          )}

          {/* Why this mode? */}
          {response && (
            <WhyThisMode
              activeMode={teachingMode}
              onModeChange={handleTeachingModeChange}
              availableModes={["adaptive", "visual", "example", "analogy", "story", "challenge"]}
            />
          )}

          {/* Learner transparency */}
          {topic.trim() && (
            <LearnerTransparency topic={topic.trim()} />
          )}

          {/* Preference overrides */}
          <PreferenceOverridesUI />

          {/* Explanation history */}
          <ExplanationHistoryView
            key={topic.trim()}
            currentConcept={topic.trim()}
          />
        </div>

        {/* Right: Lesson content */}
        <div>
          {/* Handoff message */}
          {handoffMessage && (
            <p
              className="mb-6 rounded-[var(--am-radius-lg)] border border-[var(--am-primary)]/20 bg-[var(--am-primary-light)] px-4 py-3 text-sm font-medium text-[var(--am-primary)]"
              role="status"
            >
              {handoffMessage}
            </p>
          )}

          {/* Error */}
          {error && <TutorErrorState message={error} />}

          {/* Loading */}
          {isLoading && !response && <TutorLoadingState />}

          {isLoading && response && (
            <p
              className="mb-3 text-sm text-[var(--am-text-muted)]"
              role="status"
              aria-live="polite"
            >
              Ada is preparing the updated explanation. Your current lesson
              remains available.
            </p>
          )}

          {/* Lesson */}
          {response && (
            <>
              <LessonCard
                response={response}
                historyEntry={currentHistoryEntry}
              />
              <LessonActions
                isLoading={isLoading}
                onAction={requestLesson}
                onNewLesson={startNewLesson}
              />

              {/* Hint Ladder for challenges */}
              {response.lesson.challenge && (
                <HintLadder
                  key={historyId ?? response.lesson.title}
                  hints={hints}
                  currentLevel={hintLevel as 0 | 1 | 2 | 3 | 4}
                  isLoading={isHintLoading}
                  onRequestHint={requestHints}
                  onRequestFullSolution={() => void requestHints(4)}
                  fullSolutionRevealed={hintLevel === 4}
                  gateType="attempt"
                  hasAttempted={hasAttempted}
                  onAttempt={() => {
                    setHasAttempted(true);
                    void saveLearningActivity({
                      id: `activity:challenge:${historyId ?? response.requestId ?? response.lesson.title}`,
                      type: "challenge-attempt",
                      occurredAt: new Date().toISOString(),
                      topic: topic.trim(),
                    }).catch(() => {
                      // The challenge remains usable when IndexedDB is unavailable.
                    });
                    if (timeBeforeFirstAttempt === null) {
                      const elapsed = challengeStartedAt
                        ? Math.max(
                            0,
                            Math.round((Date.now() - challengeStartedAt) / 1000),
                          )
                        : 0;
                      setTimeBeforeFirstAttempt(elapsed);
                    }
                  }}
                  attemptPrompt={response.lesson.challenge}
                  timeBeforeFirstHint={
                    timeBeforeFirstAttempt ?? undefined
                  }
                  isChallenge={true}
                  error={hintError}
                />
              )}

              {/* Understanding check */}
              <UnderstandingCheck
                question={response.lesson.checkQuestion}
                isLoading={isEvaluating}
                error={evaluationError}
                confidence={confidenceBefore}
                onConfidenceChange={setConfidenceBefore}
                onSubmit={evaluateUnderstanding}
              />

              {/* Evaluation feedback */}
              {evaluation && (
                <UnderstandingFeedback
                  evaluation={evaluation}
                  source={evaluationSource}
                  masteryReason={masteryReason}
                  onAction={(nextStep) => {
                    if (nextStep === "simplify")
                      void requestLesson("simpler");
                    else if (nextStep === "example")
                      void requestLesson("example");
                    else if (nextStep === "clarify")
                      void requestLesson("different");
                  }}
                />
              )}

              {/* Confidence coaching */}
              {evaluation && (
                <ConfidenceCoaching
                  confidence={confidenceBefore}
                  score={evaluation.score}
                  calibrationRecords={getExplanationHistoryForConcept(topic.trim()).map(
                    (r) => ({ selfReported: r.learnerConfidence, actualScore: r.evaluationScore }),
                  )}
                  status={evaluation.status}
                />
              )}

              {/* Quick recall */}
              {quickRecallRecord && (
                <QuickRecall
                  topic={quickRecallRecord.topic}
                  recallStatus={quickRecallStatus}
                  isSimulated={quickRecallRecord.simulated}
                  question={quickRecallRecord.question}
                  result={quickRecallResult ?? undefined}
                  isLoading={isQuickRecallLoading}
                  error={quickRecallError}
                  confidence={quickRecallConfidence}
                  onConfidenceChange={setQuickRecallConfidence}
                  onSubmit={(answer, confidence) =>
                    void evaluateQuickRecall(answer, confidence)
                  }
                  onAccelerate={() => {
                    const simulated = simulateQuickRecallDue(
                      quickRecallRecord.skillId,
                    );
                    setQuickRecallRecord(simulated);
                    setQuickRecallStatus("due");
                    setQuickRecallResult(null);
                    setQuickRecallError(null);
                  }}
                  onFullReview={() => void requestLesson("different")}
                />
              )}

              {/* Explain Back */}
              {response.lesson.checkQuestion && (
                <ExplainBack
                  topic={topic.trim()}
                  state={explainBackState}
                  isLoading={isExplainBackLoading}
                  error={explainBackError}
                  feedback={explainBackFeedback}
                  confidence={explainBackConfidence}
                  onConfidenceChange={setExplainBackConfidence}
                  onSubmit={requestExplainBack}
                  onRetry={handleExplainBackRetry}
                  onNext={handleExplainBackNext}
                />
              )}

              {/* Peer Agent */}
              {response.lesson.checkQuestion && (
                <PeerAgent
                  topic={topic.trim()}
                  state={peerAgentState}
                  isLoading={isPeerLoading}
                  error={peerError}
                  messages={peerAgentMessages}
                  onStart={startPeerSession}
                  onSubmit={handlePeerSubmit}
                  onComplete={handlePeerComplete}
                />
              )}

              {/* Follow-up */}
              {topic.trim() && (
                <LessonFollowUp
                  lesson={response.lesson}
                  conversation={conversation}
                  sources={response.sources}
                  isLoading={isFollowUpLoading}
                  error={followUpError}
                  onAsk={requestFollowUp}
                  latestTurnRef={latestTurnRef}
                />
              )}
            </>
          )}

          {/* Empty state (no lesson yet) */}
          {!isLoading && !response && !error && (
            <section className="am-card p-10 text-center border-dashed">
              <p className="am-heading-serif text-base text-[var(--am-text-secondary)]">
                Ada will build your focused lesson here.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--am-text-muted)]">
                Choose a suggested topic or enter one of your own to begin.
              </p>
            </section>
          )}
        </div>
      </div>
    </PageShell>
  );
}
