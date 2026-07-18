"use client";

import { useEffect, useRef, useState } from "react";
import type { TeachingMode, TutorAction, TutorApiResponse, TutorConversationMessage, TutorConversationTurn, TutorFollowUpApiResponse, TutorFollowUpResponse, TutorLesson } from "@/lib/ai/types";
import { learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { isTutorHandoff, tutorHandoffStorageKey } from "@/lib/tutor-handoff";
import { addLessonToHistory, historyRestoreStorageKey, readLearningHistory, saveHistoryConversation, startNewTopicStorageKey } from "@/lib/dashboard-storage";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { LearningDNACompact } from "./LearningDNACompact";
import { LessonActions } from "./LessonActions";
import { LessonCard } from "./LessonCard";
import { LessonFollowUp } from "./LessonFollowUp";
import { TopicForm } from "./TopicForm";
import { TutorEmptyState } from "./TutorEmptyState";
import { TutorErrorState } from "./TutorErrorState";
import { TutorLoadingState } from "./TutorLoadingState";

const profileStorageKey = "adaptivemind-learning-dna";
const lessonStorageKey = "adaptivemind-current-lesson";
const conversationStorageKey = "adaptivemind-lesson-conversation";
const balancedScores: LearningScores = { visual: 50, examples: 50, analogies: 50, stories: 50, challenges: 50 };

interface TutorProfile { scores: LearningScores; isBalanced: boolean; }
interface StoredLessonSession { response: TutorApiResponse; topic: string; subject: string; level: string; teachingMode: TeachingMode; }
interface StoredConversation { lessonTitle: string; turns: TutorConversationTurn[]; }

function isLearningScores(value: unknown): value is LearningScores {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return learningDimensions.every((dimension) => typeof record[dimension] === "number" && record[dimension] >= 0 && record[dimension] <= 100);
}

function isStyles(value: unknown): value is LearningDimension[] {
  return Array.isArray(value) && value.every((style) => typeof style === "string" && learningDimensions.includes(style as LearningDimension));
}

function isTutorLesson(value: unknown): value is TutorLesson {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.title === "string" && typeof record.coreIdea === "string" && typeof record.explanation === "string" && Array.isArray(record.keyPoints) && record.keyPoints.every((point) => typeof point === "string") && typeof record.checkQuestion === "string" && isStyles(record.stylesUsed);
}

function isTeachingMode(value: unknown): value is TeachingMode {
  return value === "adaptive" || value === "visual" || value === "example" || value === "analogy" || value === "story" || value === "challenge";
}

function isLessonAction(value: unknown): value is Exclude<TutorAction, "followup"> {
  return value === "initial" || value === "simpler" || value === "different" || value === "example" || value === "challenge";
}

function isTutorResponse(value: unknown): value is TutorApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return isTutorLesson(record.lesson) && (record.source === "provider" || record.source === "demo") && isTeachingMode(record.teachingMode) && isLessonAction(record.action);
}

function isFollowUpResponse(value: unknown): value is TutorFollowUpResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.answer === "string" && record.answer.length > 0 && isStyles(record.stylesUsed);
}

function isFollowUpApiResponse(value: unknown): value is TutorFollowUpApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return isFollowUpResponse(record.followUp) && (record.source === "provider" || record.source === "demo") && isTeachingMode(record.teachingMode) && record.action === "followup";
}

function isMessage(value: unknown): value is TutorConversationMessage {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && (record.role === "student" || record.role === "tutor") && typeof record.content === "string" && typeof record.createdAt === "string";
}

function isTurn(value: unknown): value is TutorConversationTurn {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return isMessage(record.student) && isMessage(record.tutor) && isFollowUpResponse(record.response);
}

function normalizeStoredLesson(value: unknown): StoredLessonSession | null {
  if (isTutorResponse(value)) return { response: value, topic: "", subject: "Science", level: "High school", teachingMode: value.teachingMode };
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!isTutorResponse(record.response) || typeof record.topic !== "string" || typeof record.subject !== "string" || typeof record.level !== "string" || !isTeachingMode(record.teachingMode)) return null;
  return { response: record.response, topic: record.topic, subject: record.subject, level: record.level, teachingMode: record.teachingMode };
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

function createMessage(role: TutorConversationMessage["role"], content: string): TutorConversationMessage {
  return { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, content, createdAt: new Date().toISOString() };
}

export function TutorShell() {
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Science");
  const [level, setLevel] = useState("High school");
  const [teachingMode, setTeachingMode] = useState<TeachingMode>("adaptive");
  const [response, setResponse] = useState<TutorApiResponse | null>(null);
  const [conversation, setConversation] = useState<TutorConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const latestTurnRef = useRef<HTMLDivElement>(null);

  function clearConversation() {
    setConversation([]);
    setFollowUpError(null);
    localStorage.removeItem(conversationStorageKey);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfile(getSavedProfile());
      try {
        const startNewTopic = sessionStorage.getItem(startNewTopicStorageKey) === "true";
        sessionStorage.removeItem(startNewTopicStorageKey);
        const restoreId = startNewTopic ? null : sessionStorage.getItem(historyRestoreStorageKey);
        const restoredLesson = restoreId ? readLearningHistory().find((entry) => entry.id === restoreId) : null;
        sessionStorage.removeItem(historyRestoreStorageKey);
        const session = restoredLesson ? { response: restoredLesson.response, topic: restoredLesson.topic, subject: restoredLesson.subject, level: restoredLesson.level, teachingMode: restoredLesson.teachingMode } : startNewTopic ? null : normalizeStoredLesson(JSON.parse(localStorage.getItem(lessonStorageKey) ?? "null"));
        if (session) {
          setResponse(session.response);
          setTopic(session.topic);
          setSubject(session.subject);
          setLevel(session.level);
          setTeachingMode(session.teachingMode);
          if (restoredLesson) {
            setHistoryId(restoredLesson.id);
            if (restoredLesson.conversation) setConversation(restoredLesson.conversation.slice(-4));
          }
          const storedConversation: unknown = restoredLesson ? null : JSON.parse(localStorage.getItem(conversationStorageKey) ?? "null");
          if (typeof storedConversation === "object" && storedConversation !== null) {
            const record = storedConversation as Record<string, unknown>;
            if (record.lessonTitle === session.response.lesson.title && Array.isArray(record.turns) && record.turns.length <= 4 && record.turns.every(isTurn)) setConversation(record.turns);
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
      } catch { localStorage.removeItem(lessonStorageKey); localStorage.removeItem(conversationStorageKey); }
      try {
        const handoff: unknown = JSON.parse(sessionStorage.getItem(tutorHandoffStorageKey) ?? "null");
        if (isTutorHandoff(handoff)) setHandoffMessage(handoff.message);
        sessionStorage.removeItem(tutorHandoffStorageKey);
      } catch { sessionStorage.removeItem(tutorHandoffStorageKey); }
      setIsReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => { if (conversation.length) latestTurnRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [conversation.length]);

  async function requestLesson(action: Exclude<TutorAction, "followup">) {
    if (!profile || !topic.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const previousLesson = response?.lesson;
      const apiResponse = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic.trim(), subject, level, scores: profile.scores, action, teachingMode, previousStyles: previousLesson?.stylesUsed, previousTeachingMode: response?.teachingMode, previousTitle: previousLesson?.title, previousExplanation: previousLesson?.explanation.slice(0, 360) }) });
      const payload: unknown = await apiResponse.json();
      if (!apiResponse.ok) throw new Error(getErrorMessage(payload));
      if (!isTutorResponse(payload)) throw new Error("The tutor returned an incomplete lesson. Please try again.");
      setResponse(payload);
      clearConversation();
      const historyEntry = addLessonToHistory({ topic: topic.trim(), subject, level, teachingMode, stylesUsed: payload.lesson.stylesUsed, response: payload });
      setHistoryId(historyEntry.id);
      localStorage.setItem(lessonStorageKey, JSON.stringify({ response: payload, topic: topic.trim(), subject, level, teachingMode } satisfies StoredLessonSession));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Please check your connection and try again."); } finally { setIsLoading(false); }
  }

  async function requestFollowUp(question: string): Promise<boolean> {
    if (!profile || !response || !topic.trim()) return false;
    setIsFollowUpLoading(true);
    setFollowUpError(null);
    const student = createMessage("student", question);
    const recentConversation = conversation.slice(-3).flatMap((turn) => [turn.student, turn.tutor]);
    try {
      const apiResponse = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic.trim(), subject, level, scores: profile.scores, action: "followup", teachingMode, question, currentLesson: { title: response.lesson.title, coreIdea: response.lesson.coreIdea, explanation: response.lesson.explanation.slice(0, 360), stylesUsed: response.lesson.stylesUsed }, conversation: recentConversation }) });
      const payload: unknown = await apiResponse.json();
      if (!apiResponse.ok) throw new Error(getErrorMessage(payload));
      if (!isFollowUpApiResponse(payload)) throw new Error("Ada returned an incomplete follow-up. Please try again.");
      const tutor = createMessage("tutor", payload.followUp.answer);
      const nextConversation = [...conversation, { student, tutor, response: payload.followUp }].slice(-4);
      setConversation(nextConversation);
      localStorage.setItem(conversationStorageKey, JSON.stringify({ lessonTitle: response.lesson.title, turns: nextConversation } satisfies StoredConversation));
      if (historyId) saveHistoryConversation(historyId, nextConversation);
      return true;
    } catch (requestError) {
      setFollowUpError(requestError instanceof Error ? requestError.message : "Please check your connection and try again.");
      return false;
    } finally { setIsFollowUpLoading(false); }
  }

  function startNewLesson() {
    setResponse(null);
    setError(null);
    setTopic("");
    setHistoryId(null);
    clearConversation();
    localStorage.removeItem(lessonStorageKey);
  }

  if (!isReady) return <main className="min-h-screen bg-[#f7f9fc]" aria-busy="true" />;
  if (!profile) return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f9fc] px-5 py-10"><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(99,102,241,0.14),transparent_32%)]" /><TutorEmptyState onUseBalancedProfile={() => setProfile({ scores: balancedScores, isBalanced: true })} /></main>;

  return <><AppNavigation /><main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-[#f7f9fc] px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(99,102,241,0.14),transparent_32%)]" />
    <div className="mx-auto max-w-6xl">
      <header className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Adaptive AI tutor</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">A lesson shaped around your current preferences.</h1><p className="mt-4 text-lg leading-8 text-slate-600">Ask Ada about a topic, then choose how you would like to be taught.</p>{handoffMessage ? <p className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/80 px-4 py-3 text-sm font-medium leading-6 text-teal-900" role="status">{handoffMessage}</p> : null}</header>
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:items-start"><div className="space-y-5"><LearningDNACompact scores={profile.scores} isBalanced={profile.isBalanced} /><TopicForm topic={topic} subject={subject} level={level} scores={profile.scores} teachingMode={teachingMode} isLoading={isLoading} onTopicChange={setTopic} onSubjectChange={setSubject} onLevelChange={setLevel} onTeachingModeChange={setTeachingMode} onSubmit={() => requestLesson("initial")} /></div><div>{error ? <TutorErrorState message={error} /> : null}{isLoading ? <TutorLoadingState /> : null}{!isLoading && response ? <><LessonCard response={response} /><LessonActions isLoading={isLoading} onAction={requestLesson} onNewLesson={startNewLesson} />{topic.trim() ? <LessonFollowUp lesson={response.lesson} conversation={conversation} isLoading={isFollowUpLoading} error={followUpError} onAsk={requestFollowUp} latestTurnRef={latestTurnRef} /> : null}</> : null}{!isLoading && !response && !error ? <section className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-10 text-center text-slate-500"><p className="font-medium text-slate-700">Ada will build your focused lesson here.</p><p className="mt-2 text-sm leading-6">Choose a suggested topic or enter one of your own to begin.</p></section> : null}</div></div>
    </div>
  </main></>;
}
