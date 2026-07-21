"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import {
  loadPreferenceOverrides,
  savePreferenceOverrides,
  type PreferenceOverrides,
} from "@/lib/preference-overrides";

const DETAIL_OPTIONS = ["concise", "moderate", "thorough"] as const;

export function PreferenceOverridesUI() {
  const [prefs, setPrefs] = useState<PreferenceOverrides | null>(() => {
    try { return loadPreferenceOverrides(); } catch { return null; }
  });
  const [expanded, setExpanded] = useState(false);
  const [newBan, setNewBan] = useState("");
  const [newLike, setNewLike] = useState("");

  function update(overrides: Partial<PreferenceOverrides>) {
    if (!prefs) return;
    const updated = { ...prefs, ...overrides, updatedAt: new Date().toISOString() };
    setPrefs(updated);
    savePreferenceOverrides(updated);
  }

  function addBan() {
    if (!prefs || !newBan.trim()) return;
    const val = newBan.trim().slice(0, 80);
    if (prefs.bannedDomains.includes(val)) {
      setNewBan("");
      return;
    }
    update({
      bannedDomains: [...prefs.bannedDomains, val].slice(0, 20),
    });
    setNewBan("");
  }

  function removeBan(entry: string) {
    if (!prefs) return;
    update({ bannedDomains: prefs.bannedDomains.filter((b) => b !== entry) });
  }

  function addLike() {
    if (!prefs || !newLike.trim()) return;
    const val = newLike.trim().slice(0, 80);
    if (prefs.likedDomains.includes(val)) {
      setNewLike("");
      return;
    }
    update({
      likedDomains: [...prefs.likedDomains, val].slice(0, 20),
    });
    setNewLike("");
  }

  function removeLike(entry: string) {
    if (!prefs) return;
    update({ likedDomains: prefs.likedDomains.filter((l) => l !== entry) });
  }

  // removeDislike kept for API completeness with bannedDomains/dislikedPatterns
  if (!prefs) return null;

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)]"
      role="region"
      aria-label="Explanation preferences"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--am-primary)]"
            aria-hidden="true"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-xs font-semibold text-[var(--am-text-primary)]">
            Explanation preferences
          </span>
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[var(--am-text-muted)] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <motion.div
          variants={slideUp}
          className="border-t border-[var(--am-border-light)] p-3 pt-3 space-y-3"
        >
          {/* Detail preference */}
          <div>
            <p className="text-[11px] font-medium text-[var(--am-text-muted)] mb-1.5">
              Explanation detail level
            </p>
            <div className="flex gap-1.5">
              {DETAIL_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => update({ detailPreference: opt })}
                  className={`rounded-[var(--am-radius-md)] px-2.5 py-1 text-[11px] font-medium transition-colors capitalize ${
                    prefs.detailPreference === opt
                      ? "bg-[var(--am-primary)] text-white"
                      : "bg-[var(--am-surface)] text-[var(--am-text-secondary)] border border-[var(--am-border-light)] hover:border-[var(--am-primary)]/30"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle: concise stories */}
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors">
              <input
                type="checkbox"
                checked={prefs.conciseStories}
                onChange={(e) => update({ conciseStories: e.target.checked })}
                className="sr-only peer"
                aria-label="Keep stories concise"
              />
              <span className="h-4 w-4 rounded-full bg-[var(--am-surface)] border border-[var(--am-border-light)] transition-all peer-checked:translate-x-4 peer-checked:bg-[var(--am-primary)] peer-checked:border-[var(--am-primary)]" />
            </span>
            <span className="text-xs text-[var(--am-text-secondary)]">
              Keep stories concise
            </span>
          </label>

          {/* Banned domains */}
          <div>
            <p className="text-[11px] font-medium text-[var(--am-text-muted)] mb-1.5">
              Ban explanation approaches
              <span className="ml-1 text-[var(--am-text-muted)]">
                ({prefs.bannedDomains.length}/20)
              </span>
            </p>
            {prefs.bannedDomains.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {prefs.bannedDomains.map((entry) => (
                  <span
                    key={entry}
                    className="inline-flex items-center gap-1 rounded-[var(--am-radius-md)] bg-[var(--am-error-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--am-error)]"
                  >
                    {entry}
                    <button
                      type="button"
                      onClick={() => removeBan(entry)}
                      className="ml-0.5 hover:opacity-70"
                      aria-label={`Remove ${entry} from ban list`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newBan}
                onChange={(e) => setNewBan(e.target.value.slice(0, 80))}
                onKeyDown={(e) => e.key === "Enter" && addBan()}
                placeholder="e.g. political analogies"
                className="flex-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-2.5 py-1 text-[11px] text-[var(--am-text-primary)] placeholder:text-[var(--am-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--am-primary)]/30"
                aria-label="Add approach to ban list"
              />
              <button
                type="button"
                onClick={addBan}
                disabled={!newBan.trim() || prefs.bannedDomains.length >= 20}
                className="rounded-[var(--am-radius-md)] bg-[var(--am-surface)] px-2 py-1 text-[10px] font-medium text-[var(--am-text-secondary)] border border-[var(--am-border-light)] hover:border-[var(--am-error)]/30 hover:text-[var(--am-error)] disabled:opacity-30"
              >
                Ban
              </button>
            </div>
          </div>

          {/* Liked domains */}
          <div>
            <p className="text-[11px] font-medium text-[var(--am-text-muted)] mb-1.5">
              Prefer explanation approaches
              <span className="ml-1 text-[var(--am-text-muted)]">
                ({prefs.likedDomains.length}/20)
              </span>
            </p>
            {prefs.likedDomains.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {prefs.likedDomains.map((entry) => (
                  <span
                    key={entry}
                    className="inline-flex items-center gap-1 rounded-[var(--am-radius-md)] bg-[var(--am-success-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--am-success)]"
                  >
                    {entry}
                    <button
                      type="button"
                      onClick={() => removeLike(entry)}
                      className="ml-0.5 hover:opacity-70"
                      aria-label={`Remove ${entry} from preference list`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newLike}
                onChange={(e) => setNewLike(e.target.value.slice(0, 80))}
                onKeyDown={(e) => e.key === "Enter" && addLike()}
                placeholder="e.g. visual diagrams"
                className="flex-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-2.5 py-1 text-[11px] text-[var(--am-text-primary)] placeholder:text-[var(--am-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--am-primary)]/30"
                aria-label="Add approach to preference list"
              />
              <button
                type="button"
                onClick={addLike}
                disabled={!newLike.trim() || prefs.likedDomains.length >= 20}
                className="rounded-[var(--am-radius-md)] bg-[var(--am-surface)] px-2 py-1 text-[10px] font-medium text-[var(--am-text-secondary)] border border-[var(--am-border-light)] hover:border-[var(--am-success)]/30 hover:text-[var(--am-success)] disabled:opacity-30"
              >
                Prefer
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
