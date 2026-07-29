import type { TeachingMode, TutorApiResponse, TutorConversationTurn, UnderstandingEvaluation } from "@/lib/ai/types";
import type { MasteryLevel } from "@/lib/mastery";
import { learningDimensions, type LearningDimension } from "@/lib/learning-dna";

export const learningHistoryStorageKey = "adaptivemind-learning-history";
export const dashboardStorageKey = "adaptivemind-dashboard";
export const historyRestoreStorageKey = "adaptivemind-history-restore";
export const startNewTopicStorageKey = "adaptivemind-start-new-topic";

export interface LessonHistoryEntry {
  id: string;
  topic: string;
  subject: string;
  level: string;
  date: string;
  teachingMode: TeachingMode;
  stylesUsed: LearningDimension[];
  response: TutorApiResponse;
  conversation?: TutorConversationTurn[];
  recommendationReason?: string;
  evaluation?: {
    score: number;
    status: UnderstandingEvaluation["status"];
    masteryLevel: MasteryLevel;
    evaluatedAt: string;
    needsReview?: string[];
    misconception?: string;
  };
}

function isTeachingMode(value: unknown): value is TeachingMode {
  return value === "adaptive" || value === "visual" || value === "example" || value === "analogy" || value === "story" || value === "challenge";
}

function isStyles(value: unknown): value is LearningDimension[] {
  return Array.isArray(value) && value.every((style) => typeof style === "string" && learningDimensions.includes(style as LearningDimension));
}

function isResponseSource(value: unknown): boolean {
  return value === "live-primary"
    || value === "live-fallback"
    || value === "local-fallback"
    || value === "provider"
    || value === "demo";
}

function isLessonResponse(value: unknown): value is TutorApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const lesson = record.lesson as Record<string, unknown> | undefined;
  return typeof lesson === "object" && lesson !== null && typeof lesson.title === "string" && typeof lesson.coreIdea === "string" && typeof lesson.explanation === "string" && Array.isArray(lesson.keyPoints) && typeof lesson.checkQuestion === "string" && isStyles(lesson.stylesUsed) && isResponseSource(record.source) && isTeachingMode(record.teachingMode) && ["initial", "simpler", "different", "example", "challenge", "visualize"].includes(record.action as string);
}

export function isHistoryEntry(value: unknown): value is LessonHistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const evaluation = record.evaluation;
  const validEvaluation =
    evaluation === undefined
    || (
      typeof evaluation === "object"
      && evaluation !== null
      && typeof (evaluation as Record<string, unknown>).score === "number"
      && typeof (evaluation as Record<string, unknown>).status === "string"
      && typeof (evaluation as Record<string, unknown>).masteryLevel === "string"
      && typeof (evaluation as Record<string, unknown>).evaluatedAt === "string"
    );
  return typeof record.id === "string"
    && typeof record.topic === "string"
    && typeof record.subject === "string"
    && typeof record.level === "string"
    && typeof record.date === "string"
    && isTeachingMode(record.teachingMode)
    && isStyles(record.stylesUsed)
    && isLessonResponse(record.response)
    && (
      record.conversation === undefined
      || Array.isArray(record.conversation)
    )
    && (
      record.recommendationReason === undefined
      || typeof record.recommendationReason === "string"
    )
    && validEvaluation;
}

export function readLearningHistory(): LessonHistoryEntry[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(learningHistoryStorageKey) ?? "[]");
    return Array.isArray(value) ? value.filter(isHistoryEntry).slice(0, 30) : [];
  } catch { return []; }
}

export function writeLearningHistory(entries: LessonHistoryEntry[]) {
  localStorage.setItem(learningHistoryStorageKey, JSON.stringify(entries.slice(0, 30)));
}

export function addLessonToHistory(entry: Omit<LessonHistoryEntry, "id" | "date" | "conversation">): LessonHistoryEntry {
  const historyEntry: LessonHistoryEntry = { ...entry, id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date: new Date().toISOString() };
  writeLearningHistory([historyEntry, ...readLearningHistory()]);
  return historyEntry;
}

export function saveHistoryConversation(id: string, conversation: TutorConversationTurn[]) {
  writeLearningHistory(readLearningHistory().map((entry) => entry.id === id ? { ...entry, conversation } : entry));
}

export function saveHistoryEvaluation(id: string, evaluation: LessonHistoryEntry["evaluation"]) { writeLearningHistory(readLearningHistory().map((entry) => entry.id === id ? { ...entry, evaluation } : entry)); }

export function readDashboardState(): { lastVisitedAt?: string } {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(dashboardStorageKey) ?? "{}");
    if (typeof value !== "object" || value === null) return {};
    const lastVisitedAt = (value as Record<string, unknown>).lastVisitedAt;
    return typeof lastVisitedAt === "string" ? { lastVisitedAt } : {};
  } catch { return {}; }
}

export function markDashboardVisited() {
  localStorage.setItem(dashboardStorageKey, JSON.stringify({ ...readDashboardState(), lastVisitedAt: new Date().toISOString() }));
}
