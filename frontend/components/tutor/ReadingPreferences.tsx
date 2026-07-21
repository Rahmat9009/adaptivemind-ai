"use client";

export interface ReadingSettings {
  textSize: "normal" | "large" | "xlarge";
  lineSpacing: "normal" | "relaxed" | "wide";
  contentWidth: "normal" | "narrow" | "wide";
  reducedVisualDensity: boolean;
  highContrast: boolean;
}

const STORAGE_KEY = "adaptivemind-reading-preferences";

const defaults: ReadingSettings = {
  textSize: "normal",
  lineSpacing: "normal",
  contentWidth: "normal",
  reducedVisualDensity: false,
  highContrast: false,
};

const TEXT_SIZE_MAP: Record<string, { heading: string; body: string }> = {
  normal: { heading: "text-[clamp(1.25rem,2.5vw,1.5rem)]", body: "text-base" },
  large: { heading: "text-[clamp(1.5rem,3vw,1.75rem)]", body: "text-lg leading-8" },
  xlarge: { heading: "text-[clamp(1.75rem,3.5vw,2rem)]", body: "text-xl leading-9" },
};

const LINE_SPACING_MAP: Record<string, string> = {
  normal: "leading-7",
  relaxed: "leading-8",
  wide: "leading-9",
};

const CONTENT_WIDTH_MAP: Record<string, string> = {
  normal: "max-w-3xl",
  narrow: "max-w-2xl",
  wide: "max-w-4xl",
};

export function loadReadingSettings(): ReadingSettings {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (typeof value === "object" && value !== null) {
      return { ...defaults, ...(value as Partial<ReadingSettings>) };
    }
  } catch {
    /* ignore */
  }
  return defaults;
}

export function saveReadingSettings(settings: ReadingSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getTextSizeClasses(settings: ReadingSettings): {
  headingClass: string;
  bodyClass: string;
} {
  const size = TEXT_SIZE_MAP[settings.textSize] ?? TEXT_SIZE_MAP.normal;
  const spacing =
    LINE_SPACING_MAP[settings.lineSpacing] ?? LINE_SPACING_MAP.normal;
  return {
    headingClass: size.heading,
    bodyClass: `${size.body} ${spacing}`,
  };
}

export function getContentWidthClass(settings: ReadingSettings): string {
  return CONTENT_WIDTH_MAP[settings.contentWidth] ?? CONTENT_WIDTH_MAP.normal;
}

interface ReadingPreferencesProps {
  settings: ReadingSettings;
  onChange: (settings: ReadingSettings) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ReadingPreferences({
  settings,
  onChange,
  isOpen,
  onToggle,
}: ReadingPreferencesProps) {
  function update<K extends keyof ReadingSettings>(
    key: K,
    value: ReadingSettings[K],
  ) {
    const next = { ...settings, [key]: value };
    saveReadingSettings(next);
    onChange(next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-3 py-1.5 text-xs font-medium text-[var(--am-text-secondary)] transition-colors hover:border-[var(--am-primary)]/30 hover:text-[var(--am-primary)]"
        aria-label="Reading preferences"
        aria-expanded={isOpen}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <span>Display</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-4 shadow-[var(--am-shadow-lg)]"
          role="dialog"
          aria-label="Reading display preferences"
        >
          <div className="space-y-4">
            {/* Text size */}
            <fieldset>
              <legend className="am-label text-[var(--am-text-muted)] mb-2">
                Text size
              </legend>
              <div className="flex gap-1">
                {(["normal", "large", "xlarge"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => update("textSize", size)}
                    className={`flex-1 rounded-[var(--am-radius-md)] px-3 py-1.5 text-xs font-medium transition-colors ${
                      settings.textSize === size
                        ? "bg-[var(--am-primary-light)] text-[var(--am-primary)]"
                        : "text-[var(--am-text-secondary)] hover:bg-[var(--am-warm-bg)]"
                    }`}
                  >
                    {size === "normal" ? "Normal" : size === "large" ? "Large" : "X-Large"}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Line spacing */}
            <fieldset>
              <legend className="am-label text-[var(--am-text-muted)] mb-2">
                Line spacing
              </legend>
              <div className="flex gap-1">
                {(["normal", "relaxed", "wide"] as const).map((spacing) => (
                  <button
                    key={spacing}
                    type="button"
                    onClick={() => update("lineSpacing", spacing)}
                    className={`flex-1 rounded-[var(--am-radius-md)] px-3 py-1.5 text-xs font-medium transition-colors ${
                      settings.lineSpacing === spacing
                        ? "bg-[var(--am-primary-light)] text-[var(--am-primary)]"
                        : "text-[var(--am-text-secondary)] hover:bg-[var(--am-warm-bg)]"
                    }`}
                  >
                    {spacing === "normal" ? "Normal" : spacing === "relaxed" ? "Relaxed" : "Wide"}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Content width */}
            <fieldset>
              <legend className="am-label text-[var(--am-text-muted)] mb-2">
                Content width
              </legend>
              <div className="flex gap-1">
                {(["narrow", "normal", "wide"] as const).map((width) => (
                  <button
                    key={width}
                    type="button"
                    onClick={() => update("contentWidth", width)}
                    className={`flex-1 rounded-[var(--am-radius-md)] px-3 py-1.5 text-xs font-medium transition-colors ${
                      settings.contentWidth === width
                        ? "bg-[var(--am-primary-light)] text-[var(--am-primary)]"
                        : "text-[var(--am-text-secondary)] hover:bg-[var(--am-warm-bg)]"
                    }`}
                  >
                    {width === "normal" ? "Normal" : width === "narrow" ? "Narrow" : "Wide"}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Toggles */}
            <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--am-text-primary)]">
              <input
                type="checkbox"
                checked={settings.reducedVisualDensity}
                onChange={(e) => update("reducedVisualDensity", e.target.checked)}
                className="h-4 w-4 rounded border-[var(--am-border-light)] text-[var(--am-primary)] focus:ring-[var(--am-primary)]"
              />
              <span>Reduced visual density</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--am-text-primary)]">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => update("highContrast", e.target.checked)}
                className="h-4 w-4 rounded border-[var(--am-border-light)] text-[var(--am-primary)] focus:ring-[var(--am-primary)]"
              />
              <span>Increased contrast</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
