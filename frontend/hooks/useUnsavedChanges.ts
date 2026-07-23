"use client";

import { useEffect } from "react";

const unsavedRegistry = new Map<string, string>();

export function getUnsavedChangesMessage(): string | null {
  return unsavedRegistry.values().next().value ?? null;
}

export function useUnsavedChanges(
  id: string,
  isDirty: boolean,
  message: string,
) {
  useEffect(() => {
    if (isDirty) unsavedRegistry.set(id, message);
    else unsavedRegistry.delete(id);
    return () => {
      unsavedRegistry.delete(id);
    };
  }, [id, isDirty, message]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}
