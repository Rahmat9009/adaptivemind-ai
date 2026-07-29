/**
 * Offline planner reconciliation. There is no cloud record in this version:
 * queued updates are applied idempotently to the local IndexedDB plan when
 * connectivity returns, then removed from the queue.
 */

import {
  addToOfflineQueue,
  clearSyncedOfflineItems,
  getPendingOfflineItems,
  getPlan,
  markOfflineItemSynced,
  savePlan,
  type OfflineProgressItem,
} from "./idb";
import {
  readStudyPlan,
  saveStudyPlan,
  updatePlanTask,
  type StudyPlan,
} from "./study-planner";

export const offlineQueueChangedEvent =
  "adaptivemind-offline-queue-changed";

export interface PlanTaskTogglePayload {
  planId: string;
  taskId: string;
  completed: boolean;
  completedAt?: string;
}

type SyncHandler = (item: OfflineProgressItem) => Promise<boolean>;

const handlers = new Map<OfflineProgressItem["type"], SyncHandler>();

export function isPlanTaskTogglePayload(
  value: unknown,
): value is PlanTaskTogglePayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.planId === "string"
    && record.planId.length > 0
    && record.planId.length <= 120
    && typeof record.taskId === "string"
    && record.taskId.length > 0
    && record.taskId.length <= 160
    && typeof record.completed === "boolean"
    && (
      record.completedAt === undefined
      || (
        typeof record.completedAt === "string"
        && Number.isFinite(Date.parse(record.completedAt))
      )
    );
}

export function reconcilePlanTaskToggle(
  plan: StudyPlan,
  payload: PlanTaskTogglePayload,
): StudyPlan | null {
  if (plan.id !== payload.planId) return null;
  return updatePlanTask(plan, payload.taskId, {
    completed: payload.completed,
    completedAt: payload.completed
      ? payload.completedAt ?? new Date().toISOString()
      : undefined,
  });
}

function stableHash(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

export function getPlanTaskQueueId(
  planId: string,
  taskId: string,
): string {
  return `oq-plan-${stableHash(`${planId}|${taskId}`)}`;
}

function notifyQueueChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(offlineQueueChangedEvent));
  }
}

export async function queuePlanTaskToggle(
  payload: PlanTaskTogglePayload,
): Promise<OfflineProgressItem> {
  if (!isPlanTaskTogglePayload(payload)) {
    throw new Error("The offline planner update is invalid.");
  }
  const item = await addToOfflineQueue({
    id: getPlanTaskQueueId(payload.planId, payload.taskId),
    type: "plan-task-toggle",
    payload,
  });
  notifyQueueChanged();
  return item;
}

export function registerSyncHandler(
  type: OfflineProgressItem["type"],
  handler: SyncHandler,
): () => void {
  handlers.set(type, handler);
  return () => {
    if (handlers.get(type) === handler) handlers.delete(type);
  };
}

export function registerDefaultOfflineSyncHandlers(): () => void {
  return registerSyncHandler("plan-task-toggle", async (item) => {
    if (!isPlanTaskTogglePayload(item.payload)) return false;
    const storedPlan = await getPlan(item.payload.planId);
    const fallbackPlan = readStudyPlan();
    const plan =
      storedPlan
      ?? (fallbackPlan?.id === item.payload.planId ? fallbackPlan : null);
    if (!plan) return false;
    const reconciled = reconcilePlanTaskToggle(plan, item.payload);
    if (!reconciled) return false;
    let localCopy = reconciled;
    try {
      localCopy = saveStudyPlan(reconciled);
    } catch {
      // IndexedDB remains authoritative when localStorage is unavailable.
    }
    await savePlan(localCopy);
    return true;
  });
}

export async function processOfflineQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const pending = await getPendingOfflineItems();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    const handler = handlers.get(item.type);
    if (!handler) {
      failed += 1;
      continue;
    }
    try {
      if (await handler(item)) {
        await markOfflineItemSynced(item.id);
        synced += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  if (synced > 0) await clearSyncedOfflineItems();
  notifyQueueChanged();
  return { synced, failed };
}

export function startOfflineSyncListener(): () => void {
  let processing = false;
  const handleOnline = async () => {
    if (processing) return;
    processing = true;
    try {
      await processOfflineQueue();
    } finally {
      processing = false;
    }
  };
  window.addEventListener("online", handleOnline);
  if (navigator.onLine) void handleOnline();
  return () => window.removeEventListener("online", handleOnline);
}
