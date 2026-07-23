"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleStop,
  Mic,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;
type RecordingState = "idle" | "recording" | "paused" | "review" | "error";

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition
    ?? speechWindow.webkitSpeechRecognition
    ?? null;
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function VoiceInput({
  initialText,
  onApply,
  onClose,
}: {
  initialText: string;
  onApply: (transcript: string) => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState(initialText);
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState(
    "Start when you are ready. Your microphone will not activate before then.",
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stateRef = useRef<RecordingState>("idle");

  function updateState(next: RecordingState) {
    stateRef.current = next;
    setState(next);
  }

  function stopStream() {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    recorderRef.current = null;
  }

  useEffect(() => {
    if (state !== "recording") return;
    const interval = window.setInterval(
      () => setElapsed((current) => current + 1),
      1_000,
    );
    return () => window.clearInterval(interval);
  }, [state]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    stopStream();
  }, []);

  function beginRecognition(Recognition: RecognitionConstructor) {
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText.trim()) {
        setTranscript((current) =>
          `${current.trim()} ${finalText.trim()}`.trim(),
        );
      }
      setInterim(interimText.trim());
    };
    recognition.onerror = (event) => {
      const denied = event.error === "not-allowed"
        || event.error === "service-not-allowed";
      updateState("error");
      setMessage(
        denied
          ? "Microphone permission was denied. You can type or edit a transcript instead."
          : "Speech recognition stopped unexpectedly. Your transcript is still available to edit.",
      );
    };
    recognition.onend = () => {
      if (stateRef.current === "recording") {
        updateState("review");
        setMessage("Review and edit the transcript before adding it to your request.");
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    updateState("recording");
    setMessage("Listening. Your transcript remains editable before submission.");
  }

  async function beginRecorderFallback() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      updateState("review");
      setMessage(
        "Voice capture is unavailable in this browser. Enter or edit a transcript manually.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = () => {
        // Audio is intentionally discarded; this browser cannot transcribe it.
      };
      recorder.onstop = () => {
        stopStream();
        if (stateRef.current !== "idle") {
          updateState("review");
          setMessage(
            "This browser recorded locally but cannot transcribe speech. The audio was discarded; enter the transcript manually.",
          );
        }
      };
      recorder.start();
      updateState("recording");
      setMessage(
        "Recording locally. Automatic transcription is unavailable, so the audio will be discarded when you stop.",
      );
    } catch (error) {
      updateState("error");
      setMessage(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone permission was denied. Enter or edit a transcript manually."
          : "The microphone could not be started. Enter or edit a transcript manually.",
      );
    }
  }

  function start() {
    setElapsed(0);
    setInterim("");
    const Recognition = recognitionConstructor();
    if (Recognition) beginRecognition(Recognition);
    else void beginRecorderFallback();
  }

  function pause() {
    if (recognitionRef.current) {
      updateState("paused");
      recognitionRef.current.stop();
      setMessage("Paused. Resume when you are ready.");
      return;
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.pause();
      updateState("paused");
      setMessage("Recording paused.");
    }
  }

  function resume() {
    if (recognitionConstructor()) {
      beginRecognition(recognitionConstructor() as RecognitionConstructor);
      return;
    }
    if (recorderRef.current?.state === "paused") {
      recorderRef.current.resume();
      updateState("recording");
      setMessage("Recording locally. Automatic transcription is unavailable.");
    }
  }

  function stop() {
    if (recognitionRef.current) {
      updateState("review");
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setMessage("Review and edit the transcript before adding it.");
    } else if (
      recorderRef.current
      && recorderRef.current.state !== "inactive"
    ) {
      recorderRef.current.stop();
    } else {
      updateState("review");
    }
    setInterim("");
  }

  function cancel() {
    updateState("idle");
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (recorderRef.current?.state !== "inactive") {
      recorderRef.current?.stop();
    }
    stopStream();
    onClose();
  }

  const canApply = transcript.trim().length > 0;

  return (
    <section
      className="mt-3 rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] p-4"
      aria-labelledby="voice-input-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="voice-input-title" className="text-sm font-semibold text-[var(--am-text-primary)]">
            Voice input
          </h3>
          <p className="mt-1 text-xs leading-5 text-[var(--am-text-muted)]" role="status" aria-live="polite">
            {message}
          </p>
        </div>
        <button type="button" onClick={cancel} className="am-icon-button" title="Close voice input" aria-label="Close voice input">
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(state === "idle" || state === "error" || state === "review") && (
          <button type="button" onClick={start} className="am-btn am-btn-secondary">
            <Mic size={16} aria-hidden="true" />
            {state === "review" ? "Record again" : "Start"}
          </button>
        )}
        {state === "recording" && (
          <>
            <button type="button" onClick={pause} className="am-btn am-btn-secondary">
              <Pause size={16} aria-hidden="true" />
              Pause
            </button>
            <button type="button" onClick={stop} className="am-btn am-btn-secondary">
              <CircleStop size={16} aria-hidden="true" />
              Stop
            </button>
          </>
        )}
        {state === "paused" && (
          <>
            <button type="button" onClick={resume} className="am-btn am-btn-secondary">
              <Play size={16} aria-hidden="true" />
              Resume
            </button>
            <button type="button" onClick={stop} className="am-btn am-btn-secondary">
              <CircleStop size={16} aria-hidden="true" />
              Stop
            </button>
          </>
        )}
        {state !== "idle" && (
          <span className="inline-flex min-w-16 items-center gap-2 text-xs font-medium tabular-nums text-[var(--am-text-secondary)]">
            <span className={`h-2 w-2 rounded-full ${state === "recording" ? "bg-[var(--am-error)] motion-safe:animate-pulse" : "bg-[var(--am-text-muted)]"}`} aria-hidden="true" />
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {(state === "review" || state === "error" || transcript || interim) && (
        <div className="mt-3">
          <label htmlFor="voice-transcript" className="text-xs font-semibold text-[var(--am-text-secondary)]">
            Review transcript
          </label>
          <textarea
            id="voice-transcript"
            value={`${transcript}${interim ? ` ${interim}` : ""}`}
            onChange={(event) => {
              setTranscript(event.target.value);
              setInterim("");
            }}
            maxLength={500}
            rows={4}
            className="mt-1 w-full resize-y rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-3 text-sm leading-6 text-[var(--am-text-primary)] outline-none focus:ring-2 focus:ring-[var(--am-primary)]/30"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onApply(transcript.trim().slice(0, 500));
                onClose();
              }}
              disabled={!canApply}
              className="am-btn am-btn-primary"
            >
              Add transcript
            </button>
            <button
              type="button"
              onClick={() => {
                setTranscript(initialText);
                setInterim("");
                setElapsed(0);
                updateState("idle");
                setMessage("Transcript cleared. Start again or type manually.");
              }}
              className="am-btn am-btn-ghost"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
