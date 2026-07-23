"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { useReadingSettings } from "@/hooks/useReadingSettings";

export function MotionProvider({ children }: { children: ReactNode }) {
  const settings = useReadingSettings();
  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
