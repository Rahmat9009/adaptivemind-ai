"use client";

import { useCallback, useEffect, useState } from "react";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import { getAllLessons, type SavedLessonRecord } from "@/lib/idb";
import {
  deleteOfflineLesson,
  offlineLessonsChangedEvent,
  saveOfflineLesson,
} from "@/lib/offline-lessons";

export function useOfflineLessons() {
  const [lessons, setLessons] = useState<SavedLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const records = await getAllLessons();
      setLessons(records);
      setError(null);
    } catch (storageError) {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "Saved lessons are unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    window.addEventListener(offlineLessonsChangedEvent, refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(offlineLessonsChangedEvent, refresh);
    };
  }, [refresh]);

  const cacheLesson = useCallback(
    async (
      entry: LessonHistoryEntry,
      whyThisMode?: string,
    ): Promise<SavedLessonRecord> => {
      const saved = await saveOfflineLesson(entry, {
        kind: "manual",
        whyThisMode,
      });
      await refresh();
      return saved;
    },
    [refresh],
  );

  const deleteLesson = useCallback(
    async (id: string) => {
      await deleteOfflineLesson(id);
      await refresh();
    },
    [refresh],
  );

  return {
    lessons,
    loading,
    error,
    refresh,
    cacheLesson,
    deleteLesson,
  };
}
