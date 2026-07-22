"use client";

import { useCallback, useEffect, useState } from "react";
import type { LessonHistoryEntry } from "@/lib/dashboard-storage";
import { getAllLessons, saveLesson, saveLessons, removeLesson } from "@/lib/idb";

export function useOfflineLessons() {
  const [lessons, setLessons] = useState<LessonHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLessons()
      .then(setLessons)
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, []);

  const cacheLesson = useCallback(async (entry: LessonHistoryEntry) => {
    await saveLesson(entry);
    setLessons((prev) => {
      const exists = prev.some((l) => l.id === entry.id);
      return exists
        ? prev.map((l) => (l.id === entry.id ? entry : l))
        : [entry, ...prev];
    });
  }, []);

  const cacheLessons = useCallback(async (entries: LessonHistoryEntry[]) => {
    await saveLessons(entries);
    setLessons(entries);
  }, []);

  const deleteLesson = useCallback(async (id: string) => {
    await removeLesson(id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { lessons, loading, cacheLesson, cacheLessons, deleteLesson };
}
