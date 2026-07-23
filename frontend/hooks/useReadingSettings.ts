"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getReadingSettingsServerSnapshot,
  getReadingSettingsSnapshot,
  normalizeReadingSettings,
  subscribeReadingSettings,
  type ReadingSettings,
} from "@/lib/reading-preferences";

export function useReadingSettings(): ReadingSettings {
  const snapshot = useSyncExternalStore(
    subscribeReadingSettings,
    getReadingSettingsSnapshot,
    getReadingSettingsServerSnapshot,
  );
  return useMemo(() => {
    try {
      return normalizeReadingSettings(JSON.parse(snapshot));
    } catch {
      return normalizeReadingSettings(null);
    }
  }, [snapshot]);
}
