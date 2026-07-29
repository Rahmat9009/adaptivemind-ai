"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleStop,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";

const voicePreferenceKey = "adaptivemind-voice-preference";

interface VoicePreference {
  voiceURI: string;
  rate: number;
}

function normalizeSpeechText(value: string): string {
  return value
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#>[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadPreference(): VoicePreference {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(voicePreferenceKey) ?? "null",
    );
    if (typeof value === "object" && value !== null) {
      const record = value as Record<string, unknown>;
      return {
        voiceURI: typeof record.voiceURI === "string" ? record.voiceURI : "",
        rate: typeof record.rate === "number"
          ? Math.min(1.5, Math.max(0.75, record.rate))
          : 1,
      };
    }
  } catch {
    // Use the defaults when the preference is unavailable or corrupt.
  }
  return { voiceURI: "", rate: 1 };
}

export function SpeechPlayer({ text }: { text: string }) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [preference, setPreference] = useState<VoicePreference>(() =>
    typeof window === "undefined" ? { voiceURI: "", rate: 1 } : loadPreference(),
  );
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechText = useMemo(() => normalizeSpeechText(text), [text]);

  useEffect(() => {
    if (!supported) return;
    const refreshVoices = () => setVoices(window.speechSynthesis.getVoices());
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  function savePreference(next: VoicePreference) {
    setPreference(next);
    try {
      localStorage.setItem(voicePreferenceKey, JSON.stringify(next));
    } catch {
      // Voice playback still works when storage is unavailable.
    }
  }

  function speak() {
    if (!supported || !speechText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    const voice = voices.find((candidate) =>
      candidate.voiceURI === preference.voiceURI,
    );
    if (voice) utterance.voice = voice;
    utterance.rate = preference.rate;
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setStatus("playing");
  }

  if (!supported) {
    return (
      <p className="mt-3 text-xs text-[var(--am-text-muted)]">
        Spoken playback is unavailable in this browser. The full transcript remains above.
      </p>
    );
  }

  return (
    <section className="mt-4 border-t border-[var(--am-border-light)] pt-4" aria-label="Ada voice playback">
      <div className="flex flex-wrap items-center gap-2">
        {status === "idle" && (
          <button type="button" onClick={speak} className="am-btn am-btn-secondary">
            <Volume2 size={16} aria-hidden="true" />
            Listen
          </button>
        )}
        {status === "playing" && (
          <button
            type="button"
            onClick={() => {
              window.speechSynthesis.pause();
              setStatus("paused");
            }}
            className="am-icon-button"
            title="Pause narration"
            aria-label="Pause narration"
          >
            <Pause size={17} aria-hidden="true" />
          </button>
        )}
        {status === "paused" && (
          <button
            type="button"
            onClick={() => {
              window.speechSynthesis.resume();
              setStatus("playing");
            }}
            className="am-icon-button"
            title="Resume narration"
            aria-label="Resume narration"
          >
            <Play size={17} aria-hidden="true" />
          </button>
        )}
        {status !== "idle" && (
          <>
            <button
              type="button"
              onClick={() => {
                window.speechSynthesis.cancel();
                setStatus("idle");
              }}
              className="am-icon-button"
              title="Stop narration"
              aria-label="Stop narration"
            >
              <CircleStop size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={speak}
              className="am-icon-button"
              title="Restart narration"
              aria-label="Restart narration"
            >
              <RotateCcw size={17} aria-hidden="true" />
            </button>
          </>
        )}

        <label className="ml-auto flex items-center gap-2 text-xs text-[var(--am-text-secondary)]">
          Voice
          <select
            value={preference.voiceURI}
            onChange={(event) =>
              savePreference({ ...preference, voiceURI: event.target.value })
            }
            className="max-w-44 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-2 py-1.5"
          >
            <option value="">Browser default</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 flex items-center gap-3 text-xs text-[var(--am-text-secondary)]">
        Speed
        <input
          type="range"
          min="0.75"
          max="1.5"
          step="0.05"
          value={preference.rate}
          onChange={(event) =>
            savePreference({
              ...preference,
              rate: Number(event.target.value),
            })
          }
          className="w-32"
        />
        <span className="w-10 tabular-nums">{preference.rate.toFixed(2)}x</span>
      </label>
      <p className="sr-only" aria-live="polite">
        Narration {status}.
      </p>
    </section>
  );
}
