"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import type {
  TeachingMode,
  TutorAction,
  TutorApiResponse,
  TutorConversationMessage,
  TutorConversationTurn,
  TutorFollowUpApiResponse,
  TutorFollowUpResponse,
  TutorLesson,
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
} from "@/lib/dashboard-storage";
import { updateTopicMastery } from "@/lib/mastery";
import {
  loadLearningDNA2,
  saveLearningDNA2,
  recordCheckOutcome,
} from "@/lib/learning-dna-v2";
import {
  defaultApproachState,
  updateApproachState,
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
import { loadReadingSettings, type ReadingSettings } from "./ReadingPreferences";
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

const profileStorageKey = "adaptivemind-learning-dna";
const lessonStorageKey = "adaptivemind-current-lesson";
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

function isLessonAction(
  value: unknown,
): value is Exclude<TutorAction, "followup" | "evaluate"> {
  return (
    value === "initial" ||
    value === "simpler" ||
    value === "different" ||
    value === "example" ||
    value === "challenge"
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
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [hints, setHints] = useState<[string, string, string, string] | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>(() => {
    try { return loadReadingSettings(); } catch { return { textSize: "normal" as const, lineSpacing: "normal" as const, contentWidth: "normal" as const, reducedVisualDensity: false, highContrast: false }; }
  });
  const [showReadingPrefs, setShowReadingPrefs] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null);
  const [quickRecallRecord, setQuickRecallRecord] = useState<QuickRecallRecord | null>(null);
  const [quickRecallStatus, setQuickRecallStatus] = useState<"due" | "completed" | "full-review-recommended" | "not-due">("not-due");
  const [peerAgentState, setPeerAgentState] = useState<PeerAgentState>("prompt");
  const [peerAgentMessages, setPeerAgentMessages] = useState<PeerAgentMessage[]>([]);
  const [isPeerLoading, setIsPeerLoading] = useState(false);
  const [peerError, setPeerError] = useState<string | null>(null);
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
        body: JSON.stringify({ ...body, requestId }),
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
        const session = restoredLesson
          ? {
              response: restoredLesson.response,
              topic: restoredLesson.topic,
              subject: restoredLesson.subject,
              level: restoredLesson.level,
              teachingMode: restoredLesson.teachingMode,
            }
          : startNewTopic
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
          if (restoredLesson) {
            setHistoryId(restoredLesson.id);
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
          const params = new URLSearchParams(window.location.search);
          const suggestedTopic = params.get("topic");
          const suggestedSubject = params.get("subject");
          const suggestedLevel = params.get("level");
          if (suggestedTopic) setTopic(suggestedTopic.slice(0, 160));
          if (suggestedSubject) setSubject(suggestedSubject.slice(0, 50));
          if (suggestedLevel) setLevel(suggestedLevel.slice(0, 50));
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
    action: Exclude<TutorAction, "followup" | "evaluate">,
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
      });
      if (!isTutorResponse(payload))
        throw new Error(
          "The tutor returned an incomplete lesson. Please try again.",
        );
      setResponse(payload);
      clearConversation();
      const historyEntry = addLessonToHistory({
        topic: topic.trim(),
        subject,
        level,
        teachingMode,
        stylesUsed: payload.lesson.stylesUsed,
        response: payload,
      });
      setHistoryId(historyEntry.id);
      localStorage.setItem(
        lessonStorageKey,
        JSON.stringify({
          response: payload,
          topic: topic.trim(),
          subject,
          level,
          teachingMode,
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

  async function evaluateUnderstanding(answer: string) {
    if (!profile || !response || !topic.trim()) return;
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
          checkQuestion: response.lesson.checkQuestion,
          lessonCoreIdea: response.lesson.coreIdea,
          lessonContext: response.lesson.explanation.slice(0, 500),
      });
      if (!isEvaluationApiResponse(payload))
        throw new Error("Ada returned an incomplete understanding check.");
      setEvaluation(payload.evaluation);
      setEvaluationSource(payload.source);
      const mastery = updateTopicMastery(
        topic.trim(),
        subject,
        payload.evaluation.score,
        payload.evaluation.status,
      );
      if (historyId)
        saveHistoryEvaluation(historyId, {
          score: payload.evaluation.score,
          status: payload.evaluation.status,
          masteryLevel: mastery.masteryLevel,
          evaluatedAt: new Date().toISOString(),
        });

      // ── LD2.0 data wiring ──
      // Record outcome in Learning DNA evidence model
      try {
        const dna = loadLearningDNA2();
        const { getPrimaryLearningStyle } = await import("@/lib/learning-dna");
        const approach: import("@/lib/learning-dna").LearningDimension =
          teachingMode !== "adaptive"
            ? (teachingMode as import("@/lib/learning-dna").LearningDimension)
            : getPrimaryLearningStyle(profile.scores);
        const updatedDna = recordCheckOutcome(dna, approach, {
          score: payload.evaluation.score,
          confidenceBefore: 50,
          confidenceAfter: payload.evaluation.confidenceInsight
            ? 75
            : 50,
          hintCount: 0,
          retryCount: 0,
          switchedAway: false,
        });
        saveLearningDNA2(updatedDna);
      } catch { /* non-critical, silently skip */ }

      // Update Thompson sampling state
      try {
        const { getPrimaryLearningStyle } = await import("@/lib/learning-dna");
        const approach: import("@/lib/learning-dna").LearningDimension =
          teachingMode !== "adaptive"
            ? (teachingMode as import("@/lib/learning-dna").LearningDimension)
            : getPrimaryLearningStyle(profile.scores);
        const state = defaultApproachState();
        const success = payload.evaluation.score >= 60;
        updateApproachState(state, approach, success);
      } catch { /* non-critical */ }

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
        const approach: import("@/lib/explanation-history").ExplanationRecord["approach"] =
          teachingMode !== "adaptive"
            ? (teachingMode as import("@/lib/learning-dna").LearningDimension)
            : "adaptive";
        addExplanationRecord({
          conceptId: topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          conceptLabel: topic.trim(),
          timestamp: new Date().toISOString(),
          approach,
          lessonId: historyId ?? "unknown",
          reasonSelected: teachingMode === "adaptive" ? "Thompson sampling" : "Learner choice",
          learnerConfidence: confidenceBefore ?? 50,
          checkType: "understanding",
          evaluationStatus: payload.evaluation.status,
          evaluationScore: payload.evaluation.score,
          hintsUsed: hintLevel,
          retries: 0,
          masteryBefore: 0,
          masteryAfter: mastery.masteryLevel === "mastered" ? 100 : mastery.masteryLevel === "proficient" ? 75 : mastery.masteryLevel === "developing" ? 50 : 25,
          switchedAway: false,
          learnerFeedback: null,
          recommendationOutcome: payload.evaluation.status,
        });
      } catch { /* non-critical */ }

      // ── Schedule quick recall ──
      try {
        const qr = scheduleQuickRecall(topic.trim(), topic.trim(), subject);
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
    setHints(null);
    setHintLevel(0);
    setHasAttempted(false);
    setConfidenceBefore(null);
    setQuickRecallRecord(null);
    setQuickRecallStatus("not-due");
    clearConversation();
    localStorage.removeItem(lessonStorageKey);
  }

  async function requestExplainBack(learnerResponse: string) {
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
          lessonContext: response.lesson.explanation.slice(0, 500),
      });
      if (!isExplainBackApiResponse(payload))
        throw new Error("Ada could not evaluate this explanation.");
      const evalResult = payload.evaluation;
      setExplainBackFeedback({
        understood: evalResult.understood,
        missing: evalResult.missing,
        misconception: evalResult.misconception,
        followUpQuestion: evalResult.followUpQuestion,
        isComplete: evalResult.isComplete,
      });
      setExplainBackState("feedback");
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
  }

  function handleExplainBackNext() {
    setExplainBackState("prompt");
    setExplainBackFeedback(null);
  }

  async function requestHints(level?: number) {
    if (!profile || !response || !topic.trim()) return;
    setIsHintLoading(true);
    try {
      const payload = await postTutorRequest({
          topic: topic.trim(),
          subject,
          level,
          scores: profile.scores,
          action: "hint",
          teachingMode,
          currentHintLevel: level ?? hintLevel,
          lessonContext: response.lesson.explanation.slice(0, 500),
          challengeContext: response.lesson.challenge,
      });
      if (payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>).hints)) {
        setHints((payload as { hints: [string, string, string, string] }).hints);
        setHintLevel((prev) => Math.min(prev + 1, 3) as 0 | 1 | 2 | 3 | 4);
      }
    } catch {
      // Silently fail for hints — not critical
    } finally {
      setIsHintLoading(false);
    }
  }

  // ── Peer Agent handlers ──
  function startPeerSession() {
    setPeerAgentState("active");
    setPeerAgentMessages([]);
    setPeerError(null);
    // Initial peer prompt
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
          question: `The student just explained "${topic.trim()}" to you as a confused classmate. You are playing the role of a classmate who just heard their explanation. Respond naturally as a confused peer who is trying to understand, asking a follow-up question or expressing confusion about one specific part. Keep it brief (2-3 sentences). Do NOT break character. Do NOT reveal you are an AI.`,
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
        conceptId: topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        conceptLabel: topic.trim(),
        timestamp: new Date().toISOString(),
        approach: teachingMode !== "adaptive"
          ? (teachingMode as import("@/lib/learning-dna").LearningDimension)
          : "adaptive",
        lessonId: historyId ?? "unknown",
        reasonSelected: "Peer agent session",
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
            topic={topic}
            subject={subject}
            level={level}
            scores={profile.scores}
            teachingMode={teachingMode}
            isLoading={isLoading}
            onTopicChange={setTopic}
            onSubjectChange={setSubject}
            onLevelChange={setLevel}
            onTeachingModeChange={setTeachingMode}
            onSubmit={() => requestLesson("initial")}
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
              onModeChange={setTeachingMode}
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
          <ExplanationHistoryView currentConcept={topic.trim()} />
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
              <LessonCard response={response} />
              <LessonActions
                isLoading={isLoading}
                onAction={requestLesson}
                onNewLesson={startNewLesson}
              />

              {/* Hint Ladder for challenges */}
              {response.lesson.challenge && hints && (
                <HintLadder
                  hints={hints}
                  currentLevel={hintLevel as 0 | 1 | 2 | 3 | 4}
                  isLoading={isHintLoading}
                  onRequestHint={requestHints}
                  gateType="attempt"
                  hasAttempted={hasAttempted}
                  onAttempt={() => {
                    setHasAttempted(true);
                  }}
                  isChallenge={true}
                />
              )}

              {/* Understanding check */}
              <UnderstandingCheck
                question={response.lesson.checkQuestion}
                isLoading={isEvaluating}
                error={evaluationError}
                onSubmit={evaluateUnderstanding}
              />

              {/* Evaluation feedback */}
              {evaluation && (
                <UnderstandingFeedback
                  evaluation={evaluation}
                  source={evaluationSource}
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
                  isSimulated={true}
                  onSubmit={(answer) => {
                    // Score the answer (simple heuristic for demo)
                    const score = Math.min(100, Math.max(0, answer.length * 2));
                    completeQuickRecall(quickRecallRecord.skillId, score);
                    setQuickRecallStatus(getQuickRecallStatus(quickRecallRecord.skillId));
                  }}
                  onRetry={() => {
                    const simulated = simulateQuickRecallDue(quickRecallRecord.skillId);
                    setQuickRecallRecord(simulated);
                    setQuickRecallStatus("due");
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
