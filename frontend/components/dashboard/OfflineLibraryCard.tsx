"use client";

import { CloudOff, Download, Wifi } from "lucide-react";
import { motion } from "motion/react";
import { fadeIn } from "@/lib/motion";

export function OfflineLibraryCard({
  lessonCount,
  pendingCount,
  loading,
  isOnline,
}: {
  lessonCount: number;
  pendingCount: number;
  loading: boolean;
  isOnline: boolean;
}) {
  return (
    <motion.section
      id="downloaded-lessons"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6"
      aria-labelledby="offline-library-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="am-label text-[var(--am-text-muted)]">
            Local availability
          </p>
          <h2
            id="offline-library-title"
            className="am-heading-serif mt-1 text-xl text-[var(--am-text-primary)]"
          >
            Downloaded lessons
          </h2>
        </div>
        {isOnline ? (
          <Wifi size={20} className="text-[var(--am-success)]" aria-hidden="true" />
        ) : (
          <CloudOff size={20} className="text-[var(--am-warning)]" aria-hidden="true" />
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Download size={20} className="text-[var(--am-primary)]" aria-hidden="true" />
        <p className="text-2xl font-semibold tabular-nums text-[var(--am-text-primary)]">
          {loading ? "..." : lessonCount}
        </p>
        <p className="text-sm text-[var(--am-text-secondary)]">
          saved on this device
        </p>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--am-text-secondary)]">
        {isOnline
          ? "Saved lesson copies and the study plan stay on this browser."
          : "You are offline. Saved lessons and your study plan remain available. New Ada responses require a connection."}
      </p>
      {pendingCount > 0 && (
        <p className="mt-3 text-xs font-medium text-[var(--am-warning)]">
          {pendingCount} local update{pendingCount === 1 ? "" : "s"} pending
        </p>
      )}
    </motion.section>
  );
}
