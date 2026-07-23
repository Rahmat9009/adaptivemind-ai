/**
 * Centralized, typed IndexedDB persistence for durable local learning data.
 * Invalid records are discarded individually so one corrupt value never
 * removes an otherwise valid learner library.
 */

import {
  isHistoryEntry,
  type LessonHistoryEntry,
} from "./dashboard-storage";
import {
  normalizeStudyPlan,
  type StudyPlan,
} from "./study-planner";
import {
  MAX_LEARNING_ACTIVITIES,
  isLearningActivity,
  type LearningActivity,
} from "./learning-activity";

export const DB_NAME = "adaptivemind";
export const DB_VERSION = 3;
export const MAX_OFFLINE_QUEUE_ITEMS = 500;

export const STORES = {
  lessons: "lessons",
  plans: "plans",
  offlineQueue: "offline-queue",
  activities: "activities",
} as const;

export type SavedLessonKind = "manual" | "automatic";

export interface SavedLessonRecord extends LessonHistoryEntry {
  storageVersion: 1;
  savedAt: string;
  saveKind: SavedLessonKind;
  objective: string;
  summary: string;
  misconceptions: string[];
  practiceQuestions: string[];
  whyThisMode: string;
  sizeBytes: number;
}

export interface OfflineProgressItem {
  id: string;
  type: "lesson-complete" | "plan-task-toggle" | "evaluation";
  payload: unknown;
  createdAt: string;
  synced: boolean;
}

interface AdaptiveMindDB {
  lessons: SavedLessonRecord;
  plans: StudyPlan;
  "offline-queue": OfflineProgressItem;
  activities: LearningActivity;
}

export class LocalStorageError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "unavailable"
      | "quota"
      | "blocked"
      | "invalid"
      | "unknown",
  ) {
    super(message);
    this.name = "LocalStorageError";
  }
}

function normalizeStorageError(error: unknown): LocalStorageError {
  if (error instanceof LocalStorageError) return error;
  if (
    error instanceof DOMException
    && (
      error.name === "QuotaExceededError"
      || error.name === "NS_ERROR_DOM_QUOTA_REACHED"
    )
  ) {
    return new LocalStorageError(
      "This browser does not have enough local storage available.",
      "quota",
    );
  }
  return new LocalStorageError(
    "Local learning storage is temporarily unavailable.",
    "unknown",
  );
}

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new LocalStorageError(
        "This browser does not support local learning storage.",
        "unavailable",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(
        new LocalStorageError(
          "Local learning storage took too long to open.",
          "unavailable",
        ),
      );
    }, 5_000);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.lessons)) {
        db.createObjectStore(STORES.lessons, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.plans)) {
        db.createObjectStore(STORES.plans, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.offlineQueue)) {
        const store = db.createObjectStore(STORES.offlineQueue, {
          keyPath: "id",
        });
        store.createIndex("synced", "synced", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.activities)) {
        const store = db.createObjectStore(STORES.activities, {
          keyPath: "id",
        });
        store.createIndex("occurredAt", "occurredAt", { unique: false });
      }
    };
    request.onsuccess = () => {
      clearTimeout(timeout);
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      reject(normalizeStorageError(request.error));
    };
    request.onblocked = () => {
      if (settled) return;
      clearTimeout(timeout);
      settled = true;
      reject(
        new LocalStorageError(
          "Close other AdaptiveMind tabs, then try local storage again.",
          "blocked",
        ),
      );
    };
  });
}

async function getAll<K extends keyof AdaptiveMindDB>(
  storeName: K,
): Promise<unknown[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as unknown[]);
    request.onerror = () => reject(normalizeStorageError(request.error));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
    tx.onabort = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
  });
}

async function getByKey<K extends keyof AdaptiveMindDB>(
  storeName: K,
  key: string,
): Promise<unknown> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(normalizeStorageError(request.error));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
    tx.onabort = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
  });
}

async function put<K extends keyof AdaptiveMindDB>(
  storeName: K,
  value: AdaptiveMindDB[K],
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
    tx.onabort = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
  });
}

async function putAll<K extends keyof AdaptiveMindDB>(
  storeName: K,
  values: AdaptiveMindDB[K][],
): Promise<void> {
  if (values.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    for (const value of values) store.put(value);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
    tx.onabort = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
  });
}

async function remove<K extends keyof AdaptiveMindDB>(
  storeName: K,
  key: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
    tx.onabort = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
  });
}

export async function clearStore(
  storeName: keyof AdaptiveMindDB,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
    tx.onabort = () => {
      db.close();
      reject(normalizeStorageError(tx.error));
    };
  });
}

function isoOrFallback(value: unknown, fallback: string): string {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : fallback;
}

function stringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 800))
    .filter(Boolean)
    .slice(0, 12);
}

export function normalizeSavedLessonRecord(
  value: unknown,
): SavedLessonRecord | null {
  if (!isHistoryEntry(value)) return null;
  const raw = value as LessonHistoryEntry & Partial<SavedLessonRecord>;
  const savedAt = isoOrFallback(raw.savedAt, raw.date);
  const practiceFallback = [
    raw.response.lesson.checkQuestion,
    raw.response.lesson.practicePrompt,
    raw.response.lesson.challenge,
  ].filter((item): item is string => Boolean(item));
  const misconceptionsFallback = [
    ...(raw.evaluation?.needsReview ?? []),
    ...(raw.evaluation?.misconception
      ? [raw.evaluation.misconception]
      : []),
  ];
  const normalizedWithoutSize = {
    ...raw,
    storageVersion: 1 as const,
    savedAt,
    saveKind:
      raw.saveKind === "automatic" ? "automatic" as const : "manual" as const,
    objective:
      typeof raw.objective === "string" && raw.objective.trim()
        ? raw.objective.trim().slice(0, 800)
        : `Build understanding of ${raw.topic}.`,
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary.trim().slice(0, 1_200)
        : raw.response.lesson.coreIdea,
    misconceptions: stringArray(
      raw.misconceptions,
      misconceptionsFallback,
    ),
    practiceQuestions: stringArray(
      raw.practiceQuestions,
      practiceFallback,
    ),
    whyThisMode:
      typeof raw.whyThisMode === "string" && raw.whyThisMode.trim()
        ? raw.whyThisMode.trim().slice(0, 800)
        : raw.recommendationReason
          ?? "This explanation used the selected teaching approach.",
  };
  const encoded = JSON.stringify(normalizedWithoutSize);
  const sizeBytes = typeof TextEncoder === "undefined"
    ? encoded.length * 2
    : new TextEncoder().encode(encoded).byteLength;
  return {
    ...normalizedWithoutSize,
    sizeBytes,
  };
}

export async function getAllLessons(): Promise<SavedLessonRecord[]> {
  const raw = await getAll(STORES.lessons);
  const valid: SavedLessonRecord[] = [];
  for (const value of raw) {
    const normalized = normalizeSavedLessonRecord(value);
    if (normalized) {
      valid.push(normalized);
      if (JSON.stringify(normalized) !== JSON.stringify(value)) {
        await put(STORES.lessons, normalized).catch(() => undefined);
      }
      continue;
    }
    if (
      typeof value === "object"
      && value !== null
      && typeof (value as Record<string, unknown>).id === "string"
    ) {
      await remove(
        STORES.lessons,
        (value as Record<string, string>).id,
      ).catch(() => undefined);
    }
  }
  return valid.sort(
    (a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt),
  );
}

export async function saveLesson(
  entry: SavedLessonRecord,
): Promise<void> {
  const normalized = normalizeSavedLessonRecord(entry);
  if (!normalized) {
    throw new LocalStorageError("The saved lesson is invalid.", "invalid");
  }
  await put(STORES.lessons, normalized);
}

export async function saveLessons(
  entries: SavedLessonRecord[],
): Promise<void> {
  const normalized = entries
    .map(normalizeSavedLessonRecord)
    .filter((entry): entry is SavedLessonRecord => entry !== null);
  if (normalized.length !== entries.length) {
    throw new LocalStorageError(
      "One or more saved lessons are invalid.",
      "invalid",
    );
  }
  await putAll(STORES.lessons, normalized);
}

export async function removeLesson(id: string): Promise<void> {
  await remove(STORES.lessons, id);
}

export async function getPlan(id: string): Promise<StudyPlan | null> {
  const raw = await getByKey(STORES.plans, id);
  const normalized = normalizeStudyPlan(raw);
  if (!normalized && raw !== undefined) {
    await remove(STORES.plans, id).catch(() => undefined);
  } else if (
    normalized
    && JSON.stringify(normalized) !== JSON.stringify(raw)
  ) {
    await put(STORES.plans, normalized).catch(() => undefined);
  }
  return normalized;
}

export async function getAllPlans(): Promise<StudyPlan[]> {
  const raw = await getAll(STORES.plans);
  const valid: StudyPlan[] = [];
  for (const value of raw) {
    const normalized = normalizeStudyPlan(value);
    if (normalized) {
      valid.push(normalized);
      if (JSON.stringify(normalized) !== JSON.stringify(value)) {
        await put(STORES.plans, normalized).catch(() => undefined);
      }
      continue;
    }
    if (
      typeof value === "object"
      && value !== null
      && typeof (value as Record<string, unknown>).id === "string"
    ) {
      await remove(
        STORES.plans,
        (value as Record<string, string>).id,
      ).catch(() => undefined);
    }
  }
  return valid.sort(
    (a, b) =>
      Date.parse(b.updatedAt ?? b.createdAt)
      - Date.parse(a.updatedAt ?? a.createdAt),
  );
}

export async function savePlan(plan: StudyPlan): Promise<void> {
  const normalized = normalizeStudyPlan(plan);
  if (!normalized) {
    throw new LocalStorageError("The study plan is invalid.", "invalid");
  }
  await put(STORES.plans, normalized);
}

export async function removePlan(id: string): Promise<void> {
  await remove(STORES.plans, id);
}

export function isOfflineProgressItem(
  value: unknown,
): value is OfflineProgressItem {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string"
    && record.id.length > 0
    && record.id.length <= 240
    && (
      record.type === "lesson-complete"
      || record.type === "plan-task-toggle"
      || record.type === "evaluation"
    )
    && typeof record.createdAt === "string"
    && Number.isFinite(Date.parse(record.createdAt))
    && typeof record.synced === "boolean";
}

export async function addToOfflineQueue(
  item: Omit<OfflineProgressItem, "id" | "createdAt" | "synced"> & {
    id?: string;
  },
): Promise<OfflineProgressItem> {
  const entry: OfflineProgressItem = {
    type: item.type,
    payload: item.payload,
    id:
      item.id?.slice(0, 240)
      ?? `oq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    synced: false,
  };
  const all = (await getAll(STORES.offlineQueue))
    .filter(isOfflineProgressItem)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  if (
    all.length >= MAX_OFFLINE_QUEUE_ITEMS
    && !all.some((existing) => existing.id === entry.id)
  ) {
    await remove(STORES.offlineQueue, all[0].id);
  }
  await put(STORES.offlineQueue, entry);
  return entry;
}

export async function getAllOfflineItems(): Promise<OfflineProgressItem[]> {
  const raw = await getAll(STORES.offlineQueue);
  const valid: OfflineProgressItem[] = [];
  for (const value of raw) {
    if (isOfflineProgressItem(value)) {
      valid.push(value);
      continue;
    }
    if (
      typeof value === "object"
      && value !== null
      && typeof (value as Record<string, unknown>).id === "string"
    ) {
      await remove(
        STORES.offlineQueue,
        (value as Record<string, string>).id,
      ).catch(() => undefined);
    }
  }
  return valid.sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
}

export async function getPendingOfflineItems(): Promise<
  OfflineProgressItem[]
> {
  return (await getAllOfflineItems()).filter((item) => !item.synced);
}

export async function removeOfflineItem(id: string): Promise<void> {
  await remove(STORES.offlineQueue, id);
}

export async function markOfflineItemSynced(id: string): Promise<void> {
  const value = await getByKey(STORES.offlineQueue, id);
  if (!isOfflineProgressItem(value)) {
    if (value !== undefined) await remove(STORES.offlineQueue, id);
    return;
  }
  await put(STORES.offlineQueue, { ...value, synced: true });
}

export async function clearSyncedOfflineItems(): Promise<void> {
  const raw = await getAll(STORES.offlineQueue);
  const synced = raw
    .filter(isOfflineProgressItem)
    .filter((item) => item.synced);
  await Promise.all(
    synced.map((item) => remove(STORES.offlineQueue, item.id)),
  );
}

export async function getLearningActivities(): Promise<LearningActivity[]> {
  const raw = await getAll(STORES.activities);
  const valid: LearningActivity[] = [];
  for (const value of raw) {
    if (isLearningActivity(value)) {
      valid.push(value);
      continue;
    }
    if (
      typeof value === "object"
      && value !== null
      && typeof (value as Record<string, unknown>).id === "string"
    ) {
      await remove(
        STORES.activities,
        (value as Record<string, string>).id,
      ).catch(() => undefined);
    }
  }
  return valid
    .sort(
      (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
    )
    .slice(0, MAX_LEARNING_ACTIVITIES);
}

async function trimLearningActivities(): Promise<void> {
  const activities = (await getAll(STORES.activities))
    .filter(isLearningActivity)
    .sort(
      (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
    );
  await Promise.all(
    activities
      .slice(MAX_LEARNING_ACTIVITIES)
      .map((activity) => remove(STORES.activities, activity.id)),
  );
}

export async function saveLearningActivity(
  activity: LearningActivity,
): Promise<void> {
  if (!isLearningActivity(activity)) {
    throw new LocalStorageError(
      "The learning activity is invalid.",
      "invalid",
    );
  }
  await put(STORES.activities, activity);
  await trimLearningActivities();
}

export async function saveLearningActivities(
  activities: LearningActivity[],
): Promise<void> {
  const valid = activities
    .filter(isLearningActivity)
    .slice(0, MAX_LEARNING_ACTIVITIES);
  if (valid.length === 0) return;
  await putAll(STORES.activities, valid);
  await trimLearningActivities();
}

export async function removeLearningActivity(id: string): Promise<void> {
  await remove(STORES.activities, id);
}

export async function clearAllIndexedDBData(): Promise<void> {
  await Promise.all(
    Object.values(STORES).map((store) => clearStore(store)),
  );
}
