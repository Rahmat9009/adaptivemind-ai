import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import {
  getAllLessons,
  normalizeSavedLessonRecord,
  removeLesson,
  saveLesson,
  type SavedLessonKind,
  type SavedLessonRecord,
} from "@/lib/idb";

export const MAX_OFFLINE_LESSONS = 25;
export const MAX_AUTOMATIC_LESSONS = 3;
export const MAX_OFFLINE_LESSON_BYTES = 1_500_000;
export const MAX_OFFLINE_LIBRARY_BYTES = 12_000_000;
export const offlineLessonSettingsStorageKey =
  "adaptivemind-offline-lesson-settings";
export const offlineLessonsChangedEvent =
  "adaptivemind-offline-lessons-changed";

export interface OfflineLessonSettings {
  autoCacheRecent: boolean;
}

export class OfflineLessonError extends Error {
  constructor(
    message: string,
    public readonly code: "too-large" | "library-full" | "storage",
  ) {
    super(message);
    this.name = "OfflineLessonError";
  }
}

export function loadOfflineLessonSettings(): OfflineLessonSettings {
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem(offlineLessonSettingsStorageKey) ?? "null",
    );
    return {
      autoCacheRecent:
        typeof raw === "object"
        && raw !== null
        && (raw as Record<string, unknown>).autoCacheRecent === true,
    };
  } catch {
    return { autoCacheRecent: false };
  }
}

export function saveOfflineLessonSettings(
  settings: OfflineLessonSettings,
): OfflineLessonSettings {
  const normalized = {
    autoCacheRecent: settings.autoCacheRecent === true,
  };
  localStorage.setItem(
    offlineLessonSettingsStorageKey,
    JSON.stringify(normalized),
  );
  return normalized;
}

export function buildSavedLessonRecord(
  entry: LessonHistoryEntry,
  options: {
    kind: SavedLessonKind;
    whyThisMode?: string;
    savedAt?: string;
  },
): SavedLessonRecord {
  const lesson = entry.response.lesson;
  const misconceptions = [
    ...(entry.evaluation?.needsReview ?? []),
    ...(entry.evaluation?.misconception
      ? [entry.evaluation.misconception]
      : []),
  ];
  const record = normalizeSavedLessonRecord({
    ...entry,
    storageVersion: 1,
    savedAt: options.savedAt ?? new Date().toISOString(),
    saveKind: options.kind,
    objective: `Build understanding of ${entry.topic}.`,
    summary: lesson.coreIdea,
    misconceptions,
    practiceQuestions: [
      lesson.checkQuestion,
      lesson.practicePrompt,
      lesson.challenge,
    ].filter((item): item is string => Boolean(item)),
    whyThisMode:
      options.whyThisMode
      ?? entry.recommendationReason
      ?? "This lesson used the selected teaching approach.",
    sizeBytes: 0,
  });
  if (!record) {
    throw new OfflineLessonError(
      "This lesson cannot be prepared for offline use.",
      "storage",
    );
  }
  return record;
}

export function chooseOfflineLessonEvictions(
  current: SavedLessonRecord[],
  candidate: SavedLessonRecord,
): {
  evictIds: string[];
  accepted: boolean;
  reason?: "too-large" | "library-full";
} {
  if (candidate.sizeBytes > MAX_OFFLINE_LESSON_BYTES) {
    return { evictIds: [], accepted: false, reason: "too-large" };
  }

  const existing = current.find((lesson) => lesson.id === candidate.id);
  const withoutCandidate = current.filter(
    (lesson) => lesson.id !== candidate.id,
  );
  const normalizedCandidate =
    existing?.saveKind === "manual" && candidate.saveKind === "automatic"
      ? { ...candidate, saveKind: "manual" as const }
      : candidate;
  const evictionCandidates = withoutCandidate
    .filter((lesson) => lesson.saveKind === "automatic")
    .sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt));
  const evictIds = new Set<string>();

  if (normalizedCandidate.saveKind === "automatic") {
    const automatic = [
      ...withoutCandidate.filter(
        (lesson) => lesson.saveKind === "automatic",
      ),
      normalizedCandidate,
    ].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
    for (const stale of automatic.slice(MAX_AUTOMATIC_LESSONS)) {
      if (stale.id !== normalizedCandidate.id) evictIds.add(stale.id);
    }
  }

  const retained = () => withoutCandidate.filter(
    (lesson) => !evictIds.has(lesson.id),
  );
  while (
    retained().length + 1 > MAX_OFFLINE_LESSONS
    && evictionCandidates.length > 0
  ) {
    const next = evictionCandidates.shift();
    if (next) evictIds.add(next.id);
  }
  while (
    retained().reduce((sum, lesson) => sum + lesson.sizeBytes, 0)
      + normalizedCandidate.sizeBytes
      > MAX_OFFLINE_LIBRARY_BYTES
    && evictionCandidates.length > 0
  ) {
    const next = evictionCandidates.shift();
    if (next) evictIds.add(next.id);
  }

  const retainedRecords = retained();
  const countFits = retainedRecords.length + 1 <= MAX_OFFLINE_LESSONS;
  const bytesFit =
    retainedRecords.reduce((sum, lesson) => sum + lesson.sizeBytes, 0)
      + normalizedCandidate.sizeBytes
    <= MAX_OFFLINE_LIBRARY_BYTES;
  return countFits && bytesFit
    ? { evictIds: [...evictIds], accepted: true }
    : { evictIds: [...evictIds], accepted: false, reason: "library-full" };
}

function notifyOfflineLessonsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(offlineLessonsChangedEvent));
  }
}

export async function saveOfflineLesson(
  entry: LessonHistoryEntry,
  options: {
    kind: SavedLessonKind;
    whyThisMode?: string;
  },
): Promise<SavedLessonRecord> {
  const current = await getAllLessons();
  const existing = current.find((lesson) => lesson.id === entry.id);
  const candidate = buildSavedLessonRecord(entry, {
    ...options,
    kind:
      existing?.saveKind === "manual" && options.kind === "automatic"
        ? "manual"
        : options.kind,
    savedAt: existing?.savedAt,
  });
  const decision = chooseOfflineLessonEvictions(current, candidate);
  if (!decision.accepted) {
    throw new OfflineLessonError(
      decision.reason === "too-large"
        ? "This lesson is too large to save offline."
        : "The offline lesson library is full. Remove a saved lesson and try again.",
      decision.reason ?? "library-full",
    );
  }
  await Promise.all(decision.evictIds.map(removeLesson));
  await saveLesson(candidate);
  notifyOfflineLessonsChanged();
  return candidate;
}

export async function deleteOfflineLesson(id: string): Promise<void> {
  await removeLesson(id);
  notifyOfflineLessonsChanged();
}

export async function autoCacheOfflineLesson(
  entry: LessonHistoryEntry,
): Promise<SavedLessonRecord | null> {
  if (!loadOfflineLessonSettings().autoCacheRecent) return null;
  return saveOfflineLesson(entry, {
    kind: "automatic",
    whyThisMode: entry.recommendationReason,
  });
}

export async function refreshOfflineLessonIfSaved(
  entry: LessonHistoryEntry,
): Promise<SavedLessonRecord | null> {
  const existing = (await getAllLessons()).find(
    (lesson) => lesson.id === entry.id,
  );
  if (!existing) return null;
  return saveOfflineLesson(entry, {
    kind: existing.saveKind,
    whyThisMode: existing.whyThisMode,
  });
}
