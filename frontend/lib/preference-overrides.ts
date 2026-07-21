/**
 * AdaptiveMind 2.0 — Explanation Preference Overrides
 *
 * Learner-controlled preferences for topics, analogy domains, and explanation
 * patterns they find helpful or unhelpful.
 *
 * Stored locally and included in AI prompt construction so Ada can respect the
 * learner's stated preferences when generating lessons, analogies, stories,
 * hints, and follow-ups.
 */

export const PREFERENCE_OVERRIDES_KEY = "adaptivemind-preference-overrides";
export const MAX_BAN_ENTRIES = 20;
export const MAX_BAN_LENGTH = 80;

export interface PreferenceOverrides {
  /** Topics or analogy domains the learner enjoys (e.g. ["nature", "sports"]) */
  likedDomains: string[];
  /** Topics or analogy domains to avoid (e.g. ["business", "war"]) */
  bannedDomains: string[];
  /** Explanation patterns they find unhelpful */
  dislikedPatterns: string[];
  /** Preferred level of detail: concise | moderate | thorough */
  detailPreference: "concise" | "moderate" | "thorough";
  /** Whether stories should be concise */
  conciseStories: boolean;
  /** Whether challenges should start easier */
  startChallengesEasy: boolean;
  /** Last updated timestamp */
  updatedAt: string;
}

export function emptyPreferenceOverrides(): PreferenceOverrides {
  return {
    likedDomains: [],
    bannedDomains: [],
    dislikedPatterns: [],
    detailPreference: "moderate",
    conciseStories: false,
    startChallengesEasy: false,
    updatedAt: new Date().toISOString(),
  };
}

// ──────────────────────────────────────
// Storage
// ──────────────────────────────────────

export function loadPreferenceOverrides(): PreferenceOverrides {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(PREFERENCE_OVERRIDES_KEY) ?? "null",
    );
    if (!value || typeof value !== "object") return emptyPreferenceOverrides();

    const raw = value as Record<string, unknown>;
    return {
      likedDomains: sanitizeStringArray(raw.likedDomains),
      bannedDomains: sanitizeStringArray(raw.bannedDomains),
      dislikedPatterns: sanitizeStringArray(raw.dislikedPatterns),
      detailPreference: sanitizeDetailPref(raw.detailPreference),
      conciseStories: typeof raw.conciseStories === "boolean" ? raw.conciseStories : false,
      startChallengesEasy: typeof raw.startChallengesEasy === "boolean" ? raw.startChallengesEasy : false,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyPreferenceOverrides();
  }
}

export function savePreferenceOverrides(prefs: PreferenceOverrides): void {
  const clamped: PreferenceOverrides = {
    ...prefs,
    likedDomains: clampList(prefs.likedDomains),
    bannedDomains: clampList(prefs.bannedDomains),
    dislikedPatterns: clampList(prefs.dislikedPatterns),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PREFERENCE_OVERRIDES_KEY, JSON.stringify(clamped));
}

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim().slice(0, MAX_BAN_LENGTH))
    .filter((s) => s.length > 0)
    .slice(0, MAX_BAN_ENTRIES);
}

function sanitizeDetailPref(
  value: unknown,
): "concise" | "moderate" | "thorough" {
  if (value === "concise" || value === "moderate" || value === "thorough") return value;
  return "moderate";
}

function clampList(items: string[]): string[] {
  return items
    .map((s) => s.trim().slice(0, MAX_BAN_LENGTH))
    .filter((s) => s.length > 0)
    .slice(0, MAX_BAN_ENTRIES);
}
