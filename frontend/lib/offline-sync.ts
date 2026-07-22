/**
 * Offline sync utilities — processes queued offline progress items
 * when connectivity is restored.
 */

import {
  getPendingOfflineItems,
  markOfflineItemSynced,
  clearSyncedOfflineItems,
} from "./idb";
import type { OfflineProgressItem } from "./idb";

type SyncHandler = (item: OfflineProgressItem) => Promise<boolean>;

const handlers = new Map<string, SyncHandler>();

export function registerSyncHandler(
  type: OfflineProgressItem["type"],
  handler: SyncHandler,
) {
  handlers.set(type, handler);
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
      failed++;
      continue;
    }

    try {
      const success = await handler(item);
      if (success) {
        await markOfflineItemSynced(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  if (synced > 0) {
    await clearSyncedOfflineItems();
  }

  return { synced, failed };
}

export function startOfflineSyncListener(): () => void {
  function handleOnline() {
    processOfflineQueue();
  }

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}
