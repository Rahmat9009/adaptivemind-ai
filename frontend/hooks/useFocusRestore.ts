"use client";

import { useCallback, useRef } from "react";

/**
 * Saves and restores focus — useful for modal/panel open-close flows.
 */
export function useFocusRestore() {
  const previousFocus = useRef<HTMLElement | null>(null);

  const save = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement;
  }, []);

  const restore = useCallback(() => {
    if (previousFocus.current && previousFocus.current.isConnected) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, []);

  return { saveFocus: save, restoreFocus: restore };
}
