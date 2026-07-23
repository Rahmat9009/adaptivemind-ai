"use client";

import { type ReactNode, useEffect, useState } from "react";

interface LiveRegionProps {
  children: ReactNode;
  mode?: "polite" | "assertive";
  /** If provided, the region announces this text when it changes */
  announcement?: string;
}

/**
 * ARIA live region for announcing dynamic content changes to screen readers.
 */
export function LiveRegion({
  children,
  mode = "polite",
  announcement,
}: LiveRegionProps) {
  const [announce, setAnnounce] = useState(announcement ?? "");

  useEffect(() => {
    if (announcement !== undefined) {
      const timer = setTimeout(() => setAnnounce(announcement), 100);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  return (
    <div aria-live={mode} aria-atomic="true" className="sr-only">
      {announce}
      {children}
    </div>
  );
}
