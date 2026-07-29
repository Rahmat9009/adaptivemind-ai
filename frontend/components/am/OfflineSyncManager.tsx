"use client";

import { useEffect } from "react";
import {
  registerDefaultOfflineSyncHandlers,
  startOfflineSyncListener,
} from "@/lib/offline-sync";

export function OfflineSyncManager() {
  useEffect(() => {
    const unregisterHandlers = registerDefaultOfflineSyncHandlers();
    const stopListener = startOfflineSyncListener();
    return () => {
      stopListener();
      unregisterHandlers();
    };
  }, []);

  return null;
}
