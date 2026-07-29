"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OnlineStatus() {
  const isOnline = useOnlineStatus();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={isOnline ? "You are online" : "You are offline — some features may be unavailable"}
      className="fixed bottom-20 left-1/2 z-[var(--am-z-toast)] -translate-x-1/2 sm:bottom-4"
    >
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition-all duration-300 ${
          isOnline
            ? "bg-[var(--am-success)]/10 text-[var(--am-success)] border border-[var(--am-success)]/20"
            : "bg-[var(--am-warning)]/10 text-[var(--am-warning)] border border-[var(--am-warning)]/20"
        }`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isOnline ? "bg-[var(--am-success)]" : "bg-[var(--am-warning)] animate-pulse"
          }`}
          aria-hidden="true"
        />
        {isOnline ? "Online" : "Offline"}
      </div>
    </div>
  );
}
