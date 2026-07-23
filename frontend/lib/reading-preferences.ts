export interface ReadingSettings {
  textSize: "normal" | "large" | "xlarge";
  lineSpacing: "normal" | "relaxed" | "wide";
  contentWidth: "normal" | "narrow" | "wide";
  reducedVisualDensity: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export const readingPreferencesStorageKey =
  "adaptivemind-reading-preferences";
export const readingPreferencesChangedEvent =
  "adaptivemind-reading-preferences-changed";

export const defaultReadingSettings: ReadingSettings = {
  textSize: "normal",
  lineSpacing: "normal",
  contentWidth: "normal",
  reducedVisualDensity: false,
  highContrast: false,
  reducedMotion: false,
};

const textSizes = new Set<ReadingSettings["textSize"]>([
  "normal",
  "large",
  "xlarge",
]);
const lineSpacings = new Set<ReadingSettings["lineSpacing"]>([
  "normal",
  "relaxed",
  "wide",
]);
const contentWidths = new Set<ReadingSettings["contentWidth"]>([
  "normal",
  "narrow",
  "wide",
]);
const defaultSnapshot = JSON.stringify(defaultReadingSettings);
let volatileSnapshot = defaultSnapshot;
let useVolatileSnapshot = false;

export function normalizeReadingSettings(value: unknown): ReadingSettings {
  if (typeof value !== "object" || value === null) {
    return { ...defaultReadingSettings };
  }
  const record = value as Record<string, unknown>;
  return {
    textSize: textSizes.has(record.textSize as ReadingSettings["textSize"])
      ? (record.textSize as ReadingSettings["textSize"])
      : defaultReadingSettings.textSize,
    lineSpacing: lineSpacings.has(
      record.lineSpacing as ReadingSettings["lineSpacing"],
    )
      ? (record.lineSpacing as ReadingSettings["lineSpacing"])
      : defaultReadingSettings.lineSpacing,
    contentWidth: contentWidths.has(
      record.contentWidth as ReadingSettings["contentWidth"],
    )
      ? (record.contentWidth as ReadingSettings["contentWidth"])
      : defaultReadingSettings.contentWidth,
    reducedVisualDensity: record.reducedVisualDensity === true,
    highContrast: record.highContrast === true,
    reducedMotion: record.reducedMotion === true,
  };
}

function parseSnapshot(snapshot: string | null): ReadingSettings {
  if (!snapshot) return { ...defaultReadingSettings };
  try {
    return normalizeReadingSettings(JSON.parse(snapshot));
  } catch {
    return { ...defaultReadingSettings };
  }
}

export function getReadingSettingsSnapshot(): string {
  if (typeof window === "undefined") return defaultSnapshot;
  if (useVolatileSnapshot) return volatileSnapshot;
  try {
    const stored = window.localStorage.getItem(readingPreferencesStorageKey);
    const normalized = JSON.stringify(parseSnapshot(stored));
    volatileSnapshot = normalized;
    return normalized;
  } catch {
    return volatileSnapshot;
  }
}

export function getReadingSettingsServerSnapshot(): string {
  return defaultSnapshot;
}

export function loadReadingSettings(): ReadingSettings {
  return parseSnapshot(getReadingSettingsSnapshot());
}

export function saveReadingSettings(
  settings: ReadingSettings,
): ReadingSettings {
  const normalized = normalizeReadingSettings(settings);
    volatileSnapshot = JSON.stringify(normalized);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        readingPreferencesStorageKey,
        volatileSnapshot,
      );
      useVolatileSnapshot = false;
    } catch {
      // Keep the preference for this tab when persistent storage is blocked.
      useVolatileSnapshot = true;
    }
    window.dispatchEvent(new Event(readingPreferencesChangedEvent));
  }
  return normalized;
}

export function subscribeReadingSettings(
  onStoreChange: () => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === readingPreferencesStorageKey || event.key === null) {
      useVolatileSnapshot = false;
      onStoreChange();
    }
  };
  window.addEventListener(readingPreferencesChangedEvent, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(readingPreferencesChangedEvent, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

const TEXT_SIZE_MAP: Record<
  ReadingSettings["textSize"],
  { heading: string; body: string }
> = {
  normal: { heading: "text-xl sm:text-2xl", body: "text-base" },
  large: { heading: "text-2xl sm:text-3xl", body: "text-lg leading-8" },
  xlarge: { heading: "text-3xl sm:text-4xl", body: "text-xl leading-9" },
};

const LINE_SPACING_MAP: Record<ReadingSettings["lineSpacing"], string> = {
  normal: "leading-7",
  relaxed: "leading-8",
  wide: "leading-9",
};

const CONTENT_WIDTH_MAP: Record<ReadingSettings["contentWidth"], string> = {
  normal: "max-w-3xl",
  narrow: "max-w-2xl",
  wide: "max-w-4xl",
};

export function getTextSizeClasses(settings: ReadingSettings): {
  headingClass: string;
  bodyClass: string;
} {
  const size = TEXT_SIZE_MAP[settings.textSize];
  return {
    headingClass: size.heading,
    bodyClass: `${size.body} ${LINE_SPACING_MAP[settings.lineSpacing]}`,
  };
}

export function getContentWidthClass(settings: ReadingSettings): string {
  return CONTENT_WIDTH_MAP[settings.contentWidth];
}
