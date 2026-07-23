"use client";

import { useEffect, type ReactNode } from "react";
import { useReadingSettings } from "@/hooks/useReadingSettings";

export function ReadingPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const settings = useReadingSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.amTextSize = settings.textSize;
    root.dataset.amLineSpacing = settings.lineSpacing;
    root.dataset.amContentWidth = settings.contentWidth;
    root.dataset.amDensity = settings.reducedVisualDensity
      ? "reduced"
      : "standard";
    root.dataset.amContrast = settings.highContrast ? "high" : "standard";
    root.dataset.amReducedMotion = settings.reducedMotion ? "true" : "false";
  }, [settings]);

  return children;
}
