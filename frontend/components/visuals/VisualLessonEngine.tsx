"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Headphones,
  MonitorPlay,
  MousePointer2,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { VisualLessonData } from "@/lib/visual-schema";
import { SpeechPlayer } from "@/components/tutor/SpeechPlayer";
import { ComparisonVisual } from "./ComparisonVisual";
import { CycleVisual } from "./CycleVisual";
import { FlowchartVisual } from "./FlowchartVisual";
import { GraphVisual } from "./GraphVisual";
import { LabeledDiagramVisual } from "./LabeledDiagramVisual";
import { SimulationVisual } from "./SimulationVisual";
import { StepSequenceVisual } from "./StepSequenceVisual";
import { TimelineVisual } from "./TimelineVisual";

type PresentationMode = "read" | "listen" | "watch" | "interact" | "practice";

const presentationModes: Array<{
  id: PresentationMode;
  label: string;
  icon: typeof BookOpen;
}> = [
  { id: "read", label: "Read", icon: BookOpen },
  { id: "listen", label: "Listen", icon: Headphones },
  { id: "watch", label: "Watch", icon: MonitorPlay },
  { id: "interact", label: "Interact", icon: MousePointer2 },
  { id: "practice", label: "Practice", icon: PenLine },
];

function getFrameCount(visual: VisualLessonData): number {
  if (visual.type === "comparison") {
    return Math.max(visual.columns.length, visual.captions.length, 1);
  }
  if (visual.type === "graph") {
    return Math.max(
      ...visual.series.map((series) => series.points.length),
      visual.captions.length,
      1,
    );
  }
  if (visual.type === "simulation") return 1;
  return Math.max(visual.steps.length, visual.captions.length, 1);
}

function getFrameNarration(visual: VisualLessonData, index: number): string {
  const step = visual.steps[Math.min(index, visual.steps.length - 1)];
  const caption =
    visual.captions[Math.min(index, visual.captions.length - 1)]
    ?? visual.summary;
  if (step) return `${step.label}. ${step.description}. ${caption}`;
  if (visual.type === "comparison") {
    const column = visual.columns[Math.min(index, visual.columns.length - 1)];
    if (column) return `${column.label}. ${column.items.join(". ")}. ${caption}`;
  }
  if (visual.type === "graph") {
    const points = visual.series
      .map((series) => {
        const point = series.points[Math.min(index, series.points.length - 1)];
        return point
          ? `${series.label}: x ${point.x}, y ${point.y}`
          : "";
      })
      .filter(Boolean)
      .join(". ");
    return `${caption}. ${points}`;
  }
  return caption;
}

function VisualRenderer({
  visual,
  activeStep,
  interactive,
  onSelectStep,
}: {
  visual: VisualLessonData;
  activeStep: number;
  interactive: boolean;
  onSelectStep: (index: number) => void;
}) {
  const props = { visual, activeStep, interactive, onSelectStep };
  if (visual.type === "cycle") return <CycleVisual {...props} />;
  if (visual.type === "timeline") return <TimelineVisual {...props} />;
  if (visual.type === "comparison") return <ComparisonVisual {...props} />;
  if (visual.type === "graph") return <GraphVisual {...props} />;
  if (visual.type === "labeled-diagram") {
    return <LabeledDiagramVisual {...props} />;
  }
  if (visual.type === "simulation") return <SimulationVisual {...props} />;
  if (visual.type === "flowchart" || visual.type === "cause-effect") {
    return <FlowchartVisual {...props} />;
  }
  return <StepSequenceVisual {...props} />;
}

export function VisualLessonEngine({ visual }: { visual: VisualLessonData }) {
  const tabId = useId();
  const reducedMotion = useReducedMotion();
  const frameCount = useMemo(() => getFrameCount(visual), [visual]);
  const [mode, setMode] = useState<PresentationMode>("read");
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [showPracticeFocus, setShowPracticeFocus] = useState(false);
  const displayedStep =
    mode === "read" || mode === "listen" || mode === "practice"
      ? frameCount - 1
      : activeStep;
  const suppliedCaption =
    visual.captions[Math.min(activeStep, visual.captions.length - 1)]
    ?? visual.summary;
  const activeVisualStep =
    visual.steps[Math.min(activeStep, visual.steps.length - 1)];
  const caption = activeVisualStep
    ? `${activeVisualStep.label}. ${activeVisualStep.description}`
    : suppliedCaption;
  const prediction = activeVisualStep
    ? visual.predictionCheckpoints.find(
        (checkpoint) => checkpoint.stepId === activeVisualStep.id,
      )
    : undefined;

  useEffect(() => {
    if (!isPlaying || mode !== "watch") return;
    const timer = window.setTimeout(() => {
      if (activeStep >= frameCount - 1) {
        setIsPlaying(false);
        return;
      }
      setActiveStep((current) => Math.min(current + 1, frameCount - 1));
    }, reducedMotion ? 4_500 : 3_500);
    return () => window.clearTimeout(timer);
  }, [activeStep, frameCount, isPlaying, mode, reducedMotion]);

  useEffect(() => {
    if (
      !isPlaying
      || mode !== "watch"
      || !narrationEnabled
      || !("speechSynthesis" in window)
    ) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      getFrameNarration(visual, activeStep),
    );
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [activeStep, isPlaying, mode, narrationEnabled, visual]);

  useEffect(
    () => () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  function selectMode(nextMode: PresentationMode) {
    setMode(nextMode);
    setIsPlaying(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function stopPlayback() {
    setIsPlaying(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function changeStep(index: number) {
    setActiveStep(Math.min(Math.max(index, 0), frameCount - 1));
  }

  return (
    <section
      className="mt-7 border-y border-[var(--am-border-light)] py-6"
      aria-labelledby={`${tabId}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="am-label text-[var(--am-dna-visual)]">
            Structured visual
          </p>
          <h3
            id={`${tabId}-title`}
            className="mt-1 text-lg font-semibold text-[var(--am-text-primary)]"
          >
            {visual.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
            {visual.summary}
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Visual lesson presentation"
        className="mt-5 flex flex-wrap border-b border-[var(--am-border-light)]"
      >
        {presentationModes.map((item) => {
          const Icon = item.icon;
          const selected = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${tabId}-${item.id}-tab`}
              aria-selected={selected}
              aria-controls={`${tabId}-${item.id}-panel`}
              onClick={() => selectMode(item.id)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold sm:flex-none ${
                selected
                  ? "border-[var(--am-primary)] text-[var(--am-primary)]"
                  : "border-transparent text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${tabId}-${mode}-panel`}
        aria-labelledby={`${tabId}-${mode}-tab`}
        className="pt-5"
      >
        {mode === "listen" ? (
          <div>
            <p className="leading-7 text-[var(--am-text-secondary)]">
              {visual.textAlternative}
            </p>
            <SpeechPlayer text={visual.textAlternative} />
          </div>
        ) : mode === "practice" ? (
          <div>
            <h4 className="text-base font-semibold text-[var(--am-text-primary)]">
              Reconstruct the idea
            </h4>
            <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
              {visual.predictionCheckpoints[0]?.question
                ?? "Without looking back, explain the sequence and why each part leads to the next."}
            </p>
            <label className="mt-4 block text-sm font-semibold text-[var(--am-text-primary)]">
              Your explanation
              <textarea
                value={practiceAnswer}
                onChange={(event) => setPracticeAnswer(event.target.value)}
                rows={5}
                maxLength={1_500}
                placeholder="The main sequence is..."
                className="mt-2 w-full resize-y rounded-[var(--am-radius-md)] border border-[var(--am-border)] bg-[var(--am-surface)] px-3 py-3 font-normal leading-6 text-[var(--am-text-primary)]"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowPracticeFocus((current) => !current)}
              className="am-btn am-btn-secondary mt-3"
            >
              {showPracticeFocus ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
              {showPracticeFocus ? "Hide focus" : "Reveal focus"}
            </button>
            {showPracticeFocus && (
              <p className="mt-3 border-l-4 border-[var(--am-dna-challenges)] bg-[var(--am-bg-reading)] p-3 text-sm leading-6 text-[var(--am-text-secondary)]">
                {visual.summary}
              </p>
            )}
          </div>
        ) : (
          <>
            {mode === "watch" && (
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeStep(activeStep - 1)}
                    disabled={activeStep === 0}
                    className="am-icon-button"
                    title="Previous visual step"
                    aria-label="Previous visual step"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlaying) {
                        stopPlayback();
                      } else {
                        if (activeStep >= frameCount - 1) changeStep(0);
                        setIsPlaying(true);
                      }
                    }}
                    className="am-icon-button"
                    title={isPlaying ? "Pause visual" : "Play visual"}
                    aria-label={isPlaying ? "Pause visual" : "Play visual"}
                  >
                    {isPlaying ? (
                      <Pause size={18} aria-hidden="true" />
                    ) : (
                      <Play size={18} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => changeStep(activeStep + 1)}
                    disabled={activeStep >= frameCount - 1}
                    className="am-icon-button"
                    title="Next visual step"
                    aria-label="Next visual step"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      changeStep(0);
                    }}
                    className="am-icon-button"
                    title="Restart visual"
                    aria-label="Restart visual"
                  >
                    <RotateCcw size={17} aria-hidden="true" />
                  </button>
                  <label className="ml-auto flex min-h-11 cursor-pointer items-center gap-2 text-xs font-medium text-[var(--am-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={narrationEnabled}
                      onChange={(event) =>
                        setNarrationEnabled(event.target.checked)
                      }
                    />
                    {narrationEnabled ? (
                      <Volume2 size={16} aria-hidden="true" />
                    ) : (
                      <VolumeX size={16} aria-hidden="true" />
                    )}
                    Narration
                  </label>
                </div>
                <div
                  role="progressbar"
                  aria-label="Visual lesson progress"
                  aria-valuemin={1}
                  aria-valuemax={frameCount}
                  aria-valuenow={activeStep + 1}
                  className="am-progress-track mt-3"
                >
                  <div
                    className="am-progress-fill"
                    style={{
                      width: `${((activeStep + 1) / frameCount) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-3 min-h-12 border-l-4 border-[var(--am-primary)] bg-[var(--am-primary-ghost)] px-3 py-2 text-sm leading-6 text-[var(--am-text-primary)]">
                  <span className="font-semibold">
                    Step {activeStep + 1} of {frameCount}.
                  </span>{" "}
                  {caption}
                </p>
                {prediction && (
                  <p className="mt-2 border-l-4 border-[var(--am-dna-challenges)] px-3 py-2 text-sm font-medium text-[var(--am-text-primary)]">
                    Before continuing: {prediction.question}
                  </p>
                )}
              </div>
            )}

            <VisualRenderer
              visual={visual}
              activeStep={displayedStep}
              interactive={mode === "interact"}
              onSelectStep={changeStep}
            />

            {mode === "interact" && (
              <p className="mt-3 text-xs text-[var(--am-text-muted)]">
                Select a step or control to inspect how the parts relate.
              </p>
            )}
          </>
        )}
      </div>

      <details className="mt-5 border-t border-[var(--am-border-light)] pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--am-text-primary)]">
          Full text alternative
        </summary>
        <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
          {visual.textAlternative}
        </p>
      </details>

      <p className="sr-only" aria-live="polite">
        {mode === "watch"
          ? `Visual step ${activeStep + 1} of ${frameCount}. ${caption}`
          : `${presentationModes.find((item) => item.id === mode)?.label} mode selected.`}
      </p>
    </section>
  );
}
