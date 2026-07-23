"use client";

import { Button } from "@/components/base/buttons/button";
import {
  saveReadingSettings,
  type ReadingSettings,
} from "@/lib/reading-preferences";

interface ReadingPreferencesInlineProps {
  settings: ReadingSettings;
  onChange: (settings: ReadingSettings) => void;
}

export function ReadingPreferencesInline({
  settings,
  onChange,
}: ReadingPreferencesInlineProps) {
  function update<K extends keyof ReadingSettings>(
    key: K,
    value: ReadingSettings[K],
  ) {
    const next = { ...settings, [key]: value };
    saveReadingSettings(next);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {/* Text size */}
      <fieldset>
        <legend className="am-label text-[var(--am-text-muted)] mb-2">
          Text size
        </legend>
        <div className="flex gap-1">
          {(["normal", "large", "xlarge"] as const).map((size) => (
            <Button
              key={size}
              type="button"
              color={settings.textSize === size ? "primary" : "tertiary"}
              size="xs"
              onClick={() => update("textSize", size)}
              className="flex-1"
            >
              {size === "normal" ? "Normal" : size === "large" ? "Large" : "X-Large"}
            </Button>
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
            <Button
              key={spacing}
              type="button"
              color={settings.lineSpacing === spacing ? "primary" : "tertiary"}
              size="xs"
              onClick={() => update("lineSpacing", spacing)}
              className="flex-1"
            >
              {spacing === "normal" ? "Normal" : spacing === "relaxed" ? "Relaxed" : "Wide"}
            </Button>
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
            <Button
              key={width}
              type="button"
              color={settings.contentWidth === width ? "primary" : "tertiary"}
              size="xs"
              onClick={() => update("contentWidth", width)}
              className="flex-1"
            >
              {width === "normal" ? "Normal" : width === "narrow" ? "Narrow" : "Wide"}
            </Button>
          ))}
        </div>
      </fieldset>

      {/* Toggles */}
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[var(--am-text-primary)]">
        <input
          type="checkbox"
          checked={settings.reducedVisualDensity}
          onChange={(e) => update("reducedVisualDensity", e.target.checked)}
          className="h-4 w-4 rounded border-[var(--am-border-light)] text-[var(--am-primary)] focus:ring-[var(--am-primary)]"
        />
        <span>Reduced visual density</span>
      </label>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[var(--am-text-primary)]">
        <input
          type="checkbox"
          checked={settings.highContrast}
          onChange={(e) => update("highContrast", e.target.checked)}
          className="h-4 w-4 rounded border-[var(--am-border-light)] text-[var(--am-primary)] focus:ring-[var(--am-primary)]"
        />
        <span>Increased contrast</span>
      </label>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[var(--am-text-primary)]">
        <input
          type="checkbox"
          checked={settings.reducedMotion}
          onChange={(event) =>
            update("reducedMotion", event.target.checked)
          }
          className="h-4 w-4 rounded border-[var(--am-border-light)] text-[var(--am-primary)] focus:ring-[var(--am-primary)]"
        />
        <span>Reduced motion</span>
      </label>
    </div>
  );
}
