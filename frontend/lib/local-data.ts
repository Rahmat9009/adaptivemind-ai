import {
  STORES,
  clearAllIndexedDBData,
  clearStore,
  getAllLessons,
  getAllOfflineItems,
  getAllPlans,
  getLearningActivities,
  removeOfflineItem,
  type OfflineProgressItem,
  type SavedLessonRecord,
} from "@/lib/idb";
import {
  offlineLessonsChangedEvent,
} from "@/lib/offline-lessons";
import { offlineQueueChangedEvent } from "@/lib/offline-sync";
import {
  studyPlanSettingsStorageKey,
  studyPlanStorageKey,
  type StudyPlan,
} from "@/lib/study-planner";
import type { LearningActivity } from "@/lib/learning-activity";
import {
  downloadBlob,
  safeExportFilename,
} from "@/lib/exports/common";

export const adaptiveMindStoragePrefix = "adaptivemind-";
export const adaptiveMindCachePrefix = "adaptivemind-";
export const localDataExportVersion = 1;

export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

export interface IndexedDBLearningData {
  savedLessons: SavedLessonRecord[];
  studyPlans: StudyPlan[];
  learningActivities: LearningActivity[];
  pendingLocalUpdates: OfflineProgressItem[];
}

export interface LearningDataExport {
  format: "AdaptiveMind local learning data";
  version: number;
  exportedAt: string;
  privacyNote: string;
  browserStorage: {
    local: Record<string, unknown>;
    session: Record<string, unknown>;
  };
  indexedDB: IndexedDBLearningData;
  warnings: string[];
}

export interface LocalDataOperationResult {
  clearedItems: number;
  warnings: string[];
}

function getBrowserStorage(
  kind: "localStorage" | "sessionStorage",
): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window[kind];
  } catch {
    return null;
  }
}

function parseStoredValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function collectAdaptiveMindStorage(
  storage: StorageLike | null | undefined,
): Record<string, unknown> {
  if (!storage) return {};
  const result: Record<string, unknown> = {};
  const keys: string[] = [];
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key?.startsWith(adaptiveMindStoragePrefix)) keys.push(key);
    }
    for (const key of keys.sort()) {
      const value = storage.getItem(key);
      if (value !== null) result[key] = parseStoredValue(value);
    }
  } catch {
    return result;
  }
  return result;
}

export function clearAdaptiveMindStorage(
  storage: StorageLike | null | undefined,
): number {
  if (!storage) return 0;
  const keys: string[] = [];
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key?.startsWith(adaptiveMindStoragePrefix)) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
  } catch {
    return 0;
  }
  return keys.length;
}

export function resetAdaptiveMindBrowserStorage(
  local: StorageLike | null | undefined,
  session: StorageLike | null | undefined,
): number {
  return clearAdaptiveMindStorage(local) + clearAdaptiveMindStorage(session);
}

export function buildLearningDataExport(input: {
  exportedAt: string;
  local: Record<string, unknown>;
  session: Record<string, unknown>;
  indexedDB: IndexedDBLearningData;
  warnings?: string[];
}): LearningDataExport {
  return {
    format: "AdaptiveMind local learning data",
    version: localDataExportVersion,
    exportedAt: input.exportedAt,
    privacyNote:
      "This file was created on this device. It may contain your prompts, lesson content, preferences, notes, and learning evidence.",
    browserStorage: {
      local: input.local,
      session: input.session,
    },
    indexedDB: input.indexedDB,
    warnings: [...(input.warnings ?? [])],
  };
}

function settledValue<T>(
  result: PromiseSettledResult<T>,
  label: string,
  warnings: string[],
  fallback: T,
): T {
  if (result.status === "fulfilled") return result.value;
  warnings.push(`${label} could not be read from this browser.`);
  return fallback;
}

export async function createLearningDataExport(
  now = new Date(),
): Promise<LearningDataExport> {
  const warnings: string[] = [];
  const localStorage = getBrowserStorage("localStorage");
  const sessionStorage = getBrowserStorage("sessionStorage");
  const local = collectAdaptiveMindStorage(localStorage);
  const session = collectAdaptiveMindStorage(sessionStorage);
  if (typeof window !== "undefined" && !localStorage) {
    warnings.push("Local browser settings could not be read.");
  }
  if (typeof window !== "undefined" && !sessionStorage) {
    warnings.push("Active-session data could not be read.");
  }
  const [lessonsResult, plansResult, activitiesResult, queueResult] =
    await Promise.allSettled([
      getAllLessons(),
      getAllPlans(),
      getLearningActivities(),
      getAllOfflineItems(),
    ]);
  return buildLearningDataExport({
    exportedAt: now.toISOString(),
    local,
    session,
    indexedDB: {
      savedLessons: settledValue(
        lessonsResult,
        "Downloaded lessons",
        warnings,
        [],
      ),
      studyPlans: settledValue(
        plansResult,
        "Study plans",
        warnings,
        [],
      ),
      learningActivities: settledValue(
        activitiesResult,
        "Learning activity",
        warnings,
        [],
      ),
      pendingLocalUpdates: settledValue(
        queueResult,
        "Pending local updates",
        warnings,
        [],
      ),
    },
    warnings,
  });
}

export async function downloadLearningDataExport(): Promise<LearningDataExport> {
  const data = await createLearningDataExport();
  const date = data.exportedAt.slice(0, 10);
  downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
    safeExportFilename("adaptivemind", `learning-data-${date}`, "json"),
  );
  return data;
}

function dispatchBrowserEvent(name: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(name));
  }
}

export async function removeAllDownloadedLessons(): Promise<
  LocalDataOperationResult
> {
  let count = 0;
  try {
    count = (await getAllLessons()).length;
    await clearStore(STORES.lessons);
    dispatchBrowserEvent(offlineLessonsChangedEvent);
    return { clearedItems: count, warnings: [] };
  } catch {
    return {
      clearedItems: 0,
      warnings: ["Downloaded lessons could not be cleared from this browser."],
    };
  }
}

export async function clearPlannerLearningData(): Promise<
  LocalDataOperationResult
> {
  const warnings: string[] = [];
  let clearedItems = 0;
  try {
    clearedItems += (await getAllPlans()).length;
    await clearStore(STORES.plans);
  } catch {
    warnings.push("The IndexedDB study plan could not be cleared.");
  }
  try {
    const queuedPlanUpdates = (await getAllOfflineItems()).filter(
      (item) => item.type === "plan-task-toggle",
    );
    await Promise.all(
      queuedPlanUpdates.map((item) => removeOfflineItem(item.id)),
    );
    clearedItems += queuedPlanUpdates.length;
  } catch {
    warnings.push("Some pending planner updates could not be cleared.");
  }
  const localStorage = getBrowserStorage("localStorage");
  if (localStorage) {
    for (const key of [
      studyPlanStorageKey,
      studyPlanSettingsStorageKey,
    ]) {
      try {
        if (localStorage.getItem(key) !== null) clearedItems++;
        localStorage.removeItem(key);
      } catch {
        warnings.push("The planner fallback record could not be cleared.");
        break;
      }
    }
  }
  dispatchBrowserEvent(offlineQueueChangedEvent);
  return { clearedItems, warnings };
}

export async function clearAdaptiveMindApplicationCaches(
  cacheStorage:
    | Pick<CacheStorage, "keys" | "delete">
    | null
    | undefined,
): Promise<LocalDataOperationResult> {
  if (!cacheStorage) {
    return {
      clearedItems: 0,
      warnings: ["Application caching is not supported by this browser."],
    };
  }
  try {
    const names = (await cacheStorage.keys()).filter((name) =>
      name.startsWith(adaptiveMindCachePrefix),
    );
    const results = await Promise.all(
      names.map((name) => cacheStorage.delete(name)),
    );
    return {
      clearedItems: results.filter(Boolean).length,
      warnings: [],
    };
  } catch {
    return {
      clearedItems: 0,
      warnings: ["Cached application files could not be cleared."],
    };
  }
}

export async function clearCachedApplicationData(): Promise<
  LocalDataOperationResult
> {
  return clearAdaptiveMindApplicationCaches(
    typeof window !== "undefined" && "caches" in window
      ? window.caches
      : null,
  );
}

export async function resetAllLearningData(): Promise<
  LocalDataOperationResult
> {
  const warnings: string[] = [];
  let clearedItems = 0;
  const snapshots = await Promise.allSettled([
    getAllLessons(),
    getAllPlans(),
    getLearningActivities(),
    getAllOfflineItems(),
  ]);
  for (const snapshot of snapshots) {
    if (snapshot.status === "fulfilled") {
      clearedItems += snapshot.value.length;
    }
  }
  try {
    await clearAllIndexedDBData();
  } catch {
    warnings.push("Some IndexedDB learning data could not be cleared.");
  }
  const localStorage = getBrowserStorage("localStorage");
  const sessionStorage = getBrowserStorage("sessionStorage");
  if (typeof window !== "undefined") {
    clearedItems += resetAdaptiveMindBrowserStorage(
      localStorage,
      sessionStorage,
    );
    if (!localStorage || !sessionStorage) {
      warnings.push("Some browser storage was unavailable.");
    }
  }
  dispatchBrowserEvent(offlineLessonsChangedEvent);
  dispatchBrowserEvent(offlineQueueChangedEvent);
  return { clearedItems, warnings };
}
