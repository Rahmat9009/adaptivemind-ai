/**
 * AdaptiveMind IndexedDB Storage Layer
 * Typed centralized storage for lessons, plans, and offline progress queue.
 */

import type { LessonHistoryEntry } from "./dashboard-storage";
import type { StudyPlan } from "./study-planner";
import {
  MAX_LEARNING_ACTIVITIES,
  isLearningActivity,
  type LearningActivity,
} from "./learning-activity";

const DB_NAME = "adaptivemind";
const DB_VERSION = 2;

// ── Store names ──────────────────────────────────────

export const STORES = {
  lessons: "lessons",
  plans: "plans",
  offlineQueue: "offline-queue",
  activities: "activities",
} as const;

// ── Types ────────────────────────────────────────────

export interface OfflineProgressItem {
  id: string;
  type: "lesson-complete" | "plan-task-toggle" | "evaluation";
  payload: unknown;
  createdAt: string;
  synced: boolean;
}

// ── Schema ───────────────────────────────────────────

interface AdaptiveMindDB {
  lessons: LessonHistoryEntry;
  plans: StudyPlan;
  "offline-queue": OfflineProgressItem;
  activities: LearningActivity;
}

// ── Core IDB helpers ─────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
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
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Generic CRUD ─────────────────────────────────────

async function getAll<K extends keyof AdaptiveMindDB>(
  storeName: K,
): Promise<AdaptiveMindDB[K][]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as AdaptiveMindDB[K][]);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function put<K extends keyof AdaptiveMindDB>(
  storeName: K,
  value: AdaptiveMindDB[K],
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put(value);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function putAll<K extends keyof AdaptiveMindDB>(
  storeName: K,
  values: AdaptiveMindDB[K][],
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    for (const value of values) {
      store.put(value);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
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
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// ── Lessons API ──────────────────────────────────────

export async function getAllLessons(): Promise<LessonHistoryEntry[]> {
  return getAll(STORES.lessons);
}

export async function saveLesson(entry: LessonHistoryEntry): Promise<void> {
  await put(STORES.lessons, entry);
}

export async function saveLessons(entries: LessonHistoryEntry[]): Promise<void> {
  await putAll(STORES.lessons, entries);
}

export async function removeLesson(id: string): Promise<void> {
  await remove(STORES.lessons, id);
}

// ── Plans API ────────────────────────────────────────

export async function getPlan(id: string): Promise<StudyPlan | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.plans, "readonly");
    const store = tx.objectStore(STORES.plans);
    const request = store.get(id);
    request.onsuccess = () =>
      resolve((request.result as StudyPlan) ?? null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getAllPlans(): Promise<StudyPlan[]> {
  return getAll(STORES.plans);
}

export async function savePlan(plan: StudyPlan): Promise<void> {
  await put(STORES.plans, plan);
}

export async function removePlan(id: string): Promise<void> {
  await remove(STORES.plans, id);
}

// ── Offline Queue API ────────────────────────────────

export async function addToOfflineQueue(
  item: Omit<OfflineProgressItem, "id" | "createdAt" | "synced">,
): Promise<OfflineProgressItem> {
  const entry: OfflineProgressItem = {
    ...item,
    id: `oq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    synced: false,
  };
  await put(STORES.offlineQueue, entry);
  return entry;
}

export async function getPendingOfflineItems(): Promise<OfflineProgressItem[]> {
  const all = await getAll(STORES.offlineQueue);
  return all.filter((item) => !item.synced);
}

export async function markOfflineItemSynced(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.offlineQueue, "readwrite");
    const store = tx.objectStore(STORES.offlineQueue);
    const request = store.get(id);
    request.onsuccess = () => {
      const item = request.result as OfflineProgressItem | undefined;
      if (item) {
        item.synced = true;
        store.put(item);
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function clearSyncedOfflineItems(): Promise<void> {
  const all = await getAll(STORES.offlineQueue);
  const synced = all.filter((item) => item.synced);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.offlineQueue, "readwrite");
    const store = tx.objectStore(STORES.offlineQueue);
    for (const item of synced) {
      store.delete(item.id);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// ── Meaningful learning activity API ─────────────────

export async function getLearningActivities(): Promise<LearningActivity[]> {
  const activities = await getAll(STORES.activities);
  return activities
    .filter(isLearningActivity)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, MAX_LEARNING_ACTIVITIES);
}

async function trimLearningActivities(): Promise<void> {
  const activities = (await getAll(STORES.activities))
    .filter(isLearningActivity)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  const excess = activities.slice(MAX_LEARNING_ACTIVITIES);
  await Promise.all(
    excess.map((activity) => remove(STORES.activities, activity.id)),
  );
}

export async function saveLearningActivity(
  activity: LearningActivity,
): Promise<void> {
  if (!isLearningActivity(activity)) {
    throw new Error("Invalid learning activity.");
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
  if (!valid.length) return;
  await putAll(STORES.activities, valid);
  await trimLearningActivities();
}

export async function removeLearningActivity(id: string): Promise<void> {
  await remove(STORES.activities, id);
}
