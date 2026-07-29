"use client";

import { Settings2 } from "lucide-react";
import {
  saveReadingSettings,
  type ReadingSettings,
} from "@/lib/reading-preferences";

export {
  getContentWidthClass,
  getTextSizeClasses,
  loadReadingSettings,
  saveReadingSettings,
  type ReadingSettings,
} from "@/lib/reading-preferences";

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
        <Settings2 size={14} aria-hidden="true" />
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
        </div>
      )}
    </div>
  );
}
