const MAX_RECENT_REQUESTS = 100;
const REQUEST_TTL_MS = 60_000;

interface PendingRequest<T> {
  expiresAt: number;
  promise: Promise<T>;
}

const recentRequests = new Map<string, PendingRequest<unknown>>();

function pruneExpired(now: number): void {
  for (const [requestId, entry] of recentRequests) {
    if (entry.expiresAt <= now) recentRequests.delete(requestId);
  }
  while (recentRequests.size >= MAX_RECENT_REQUESTS) {
    const oldest = recentRequests.keys().next().value;
    if (typeof oldest !== "string") break;
    recentRequests.delete(oldest);
  }
}

export function deduplicateRequest<T>(
  requestId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  pruneExpired(now);
  const existing = recentRequests.get(requestId);
  if (existing && existing.expiresAt > now) {
    return existing.promise as Promise<T>;
  }

  const promise = operation();
  recentRequests.set(requestId, {
    expiresAt: now + REQUEST_TTL_MS,
    promise,
  });
  return promise;
}

export function clearRequestDedupeForTests(): void {
  recentRequests.clear();
}
