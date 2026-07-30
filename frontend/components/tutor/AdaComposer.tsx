"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  ImageIcon,
  Link2,
  LoaderCircle,
  Mic,
  Paperclip,
  Send,
  Trash2,
  X,
  RotateCcw,
} from "lucide-react";
import { prepareImageSource } from "@/lib/client-image-source";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  MAX_IMAGE_SOURCE_COUNT,
  MAX_SOURCE_COUNT,
  type SourceGroundingMode,
  type SourceType,
  type TutorSource,
  validateSourceFile,
  validateSourceUrl,
} from "@/lib/sources";
import { VoiceInput } from "./VoiceInput";
import { normalizeYouTubeUrl } from "@/lib/youtube";

type AttachmentStatus = "pending" | "processing" | "ready" | "error";

interface PendingAttachment {
  id: string;
  kind: "file" | "url";
  title: string;
  sourceType: SourceType;
  size?: number;
  file?: File;
  url?: string;
  previewUrl?: string;
  selected: boolean;
  status: AttachmentStatus;
  error?: string;
  source?: TutorSource;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function sourceLabel(type: SourceType): string {
  return {
    pdf: "PDF",
    docx: "DOCX",
    pptx: "PPTX",
    txt: "TXT",
    markdown: "Markdown",
    image: "Image",
    website: "Website",
    youtube: "YouTube video",
  }[type];
}

function attachmentStatusLabel(attachment: PendingAttachment): string {
  if (attachment.status === "ready") return "Ready";
  if (attachment.status === "error") return "Needs attention";
  if (attachment.sourceType === "youtube") {
    return attachment.status === "processing"
      ? "Processing public video"
      : "Validating YouTube link";
  }
  return attachment.status === "processing"
    ? "Processing"
    : "Ready to process on Send";
}

async function responseError(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (typeof payload === "object" && payload !== null) {
    const error = (payload as Record<string, unknown>).error;
    if (typeof error === "string") return error;
  }
  return "The source could not be processed.";
}

async function processAttachment(
  attachment: PendingAttachment,
  signal?: AbortSignal,
): Promise<TutorSource> {
  if (attachment.source) return attachment.source;

  if (attachment.kind === "url" && attachment.url) {
    const response = await fetch("/api/sources/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: attachment.url }),
      cache: "no-store",
      signal,
    });
    if (!response.ok) throw new Error(await responseError(response));
    const payload = await response.json() as { source?: TutorSource };
    if (!payload.source) throw new Error("The website response was incomplete.");
    return payload.source;
  }

  if (!attachment.file) throw new Error("The selected file is unavailable.");
  if (attachment.sourceType === "image") {
    return prepareImageSource(attachment.file, attachment.title);
  }

  const formData = new FormData();
  formData.set("file", attachment.file);
  const response = await fetch("/api/sources/document", {
    method: "POST",
    body: formData,
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(await responseError(response));
  const payload = await response.json() as { source?: TutorSource };
  if (!payload.source) throw new Error("The document response was incomplete.");
  return payload.source;
}

export function AdaComposer({
  topic,
  isLoading,
  initialSources = [],
  onTopicChange,
  onSubmit,
}: {
  topic: string;
  isLoading: boolean;
  initialSources?: TutorSource[];
  onTopicChange: (value: string) => void;
  onSubmit: (
    sources: TutorSource[],
    sourceMode: SourceGroundingMode | undefined,
    sourcePreparationMs: number,
  ) => Promise<void> | void;
}) {
  const [attachments, setAttachments] = useState<PendingAttachment[]>(() => 
    initialSources.map((source) => ({
      id: source.id,
      kind: source.type === "website" || source.type === "youtube" ? "url" : "file",
      title: source.title,
      sourceType: source.type,
      size: source.size,
      url: source.type === "website" || source.type === "youtube"
        ? source.url ?? "existing-url"
        : undefined,
      selected: true,
      status: "ready",
      source: source,
    }))
  );
  const [sourceMode, setSourceMode] =
    useState<SourceGroundingMode>("source-plus-background");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const submitPendingRef = useRef(false);
  const preparationControllerRef = useRef<AbortController | null>(null);
  const hasUnsubmittedSource =
    Boolean(linkValue.trim())
    || attachments.some(
      (attachment) =>
        attachment.selected && attachment.status !== "ready",
    );

  useUnsavedChanges(
    "ada-pending-sources",
    hasUnsubmittedSource,
    "Pending files or links have not been submitted to Ada.",
  );

  useEffect(() => () => {
    preparationControllerRef.current?.abort();
    for (const url of previewUrlsRef.current) URL.revokeObjectURL(url);
    previewUrlsRef.current.clear();
  }, []);

  function updateAttachment(
    id: string,
    update: Partial<PendingAttachment>,
  ) {
    setAttachments((current) =>
      current.map((attachment) =>
        attachment.id === id ? { ...attachment, ...update } : attachment,
      ),
    );
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setComposerError(null);
    const next: PendingAttachment[] = [];
    let available = MAX_SOURCE_COUNT - attachments.length;
    let imageSlots = MAX_IMAGE_SOURCE_COUNT
      - attachments.filter((attachment) => attachment.sourceType === "image").length;

    for (const file of Array.from(files)) {
      if (available <= 0) {
        setComposerError(`Attach up to ${MAX_SOURCE_COUNT} sources at a time.`);
        break;
      }
      const validation = validateSourceFile(file);
      if (!validation.ok) {
        next.push({
          id: crypto.randomUUID(),
          kind: "file",
          title: file.name,
          sourceType: "txt",
          size: file.size,
          file,
          selected: false,
          status: "error",
          error: validation.error,
        });
        available -= 1;
        continue;
      }
      if (validation.type === "image" && imageSlots <= 0) {
        setComposerError(
          `Attach up to ${MAX_IMAGE_SOURCE_COUNT} images per request.`,
        );
        continue;
      }

      const previewUrl = validation.type === "image"
        ? URL.createObjectURL(file)
        : undefined;
      if (previewUrl) previewUrlsRef.current.add(previewUrl);
      next.push({
        id: crypto.randomUUID(),
        kind: "file",
        title: validation.safeName,
        sourceType: validation.type,
        size: file.size,
        file,
        previewUrl,
        selected: true,
        status: "pending",
      });
      available -= 1;
      if (validation.type === "image") imageSlots -= 1;
    }
    setAttachments((current) => [...current, ...next]);
  }

  function addLink() {
    setComposerError(null);
    if (attachments.length >= MAX_SOURCE_COUNT) {
      setComposerError(`Attach up to ${MAX_SOURCE_COUNT} sources at a time.`);
      return;
    }
    const validation = validateSourceUrl(linkValue.trim());
    if (!validation.ok) {
      setComposerError(validation.error);
      return;
    }
    const youtube = normalizeYouTubeUrl(validation.url.toString());
    if (youtube.kind === "invalid-youtube") {
      setComposerError(youtube.error);
      return;
    }
    const sourceType: SourceType = youtube.kind === "youtube"
      ? "youtube"
      : "website";
    const normalizedUrl = youtube.kind === "youtube"
      ? youtube.canonicalUrl
      : validation.url.toString();
    setAttachments((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        kind: "url",
        title: sourceType === "youtube" ? "YouTube video" : validation.url.hostname,
        sourceType,
        url: normalizedUrl,
        selected: true,
        status: "pending",
      },
    ]);
    setLinkValue("");
    setShowLinkInput(false);
  }

  function removeAttachment(attachment: PendingAttachment) {
    if (attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
      previewUrlsRef.current.delete(attachment.previewUrl);
    }
    setAttachments((current) =>
      current.filter((item) => item.id !== attachment.id),
    );
  }

  async function submit() {
    if (!topic.trim() || isLoading || isPreparing || submitPendingRef.current) return;
    submitPendingRef.current = true;
    const preparationController = new AbortController();
    preparationControllerRef.current?.abort();
    preparationControllerRef.current = preparationController;
    setComposerError(null);
    setIsPreparing(true);
    const sourcePreparationStartedAt = performance.now();
    const selected = attachments.filter((attachment) => attachment.selected);
    const sources: TutorSource[] = [];
    let failed = false;

    for (const attachment of selected) {
      updateAttachment(attachment.id, {
        status: "processing",
        error: undefined,
      });
      try {
        const source = await processAttachment(
          attachment,
          preparationController.signal,
        );
        sources.push(source);
        updateAttachment(attachment.id, { status: "ready", source });
      } catch (error) {
        if (preparationController.signal.aborted) {
          updateAttachment(attachment.id, {
            status: "pending",
            error: undefined,
          });
          break;
        }
        failed = true;
        updateAttachment(attachment.id, {
          selected: false,
          status: "error",
          error: error instanceof Error
            ? error.message
            : "The source could not be processed.",
        });
      }
    }

    setIsPreparing(false);
    if (preparationControllerRef.current === preparationController) {
      preparationControllerRef.current = null;
    }
    if (preparationController.signal.aborted) {
      submitPendingRef.current = false;
      return;
    }
    if (failed) {
      if (sourceMode === "source-only") {
        setComposerError(
          "A source could not be processed. Fix or remove it before sending a source-only request.",
        );
        submitPendingRef.current = false;
        return;
      }
      // If not source-only, we can proceed with text or valid sources, but maybe warn them? Actually prompt says "Do not block an unrelated text-only question merely because one optional attachment failed" so we just let it pass, but maybe we should still warn them? The prompt just says "Do not block".
      // Wait, if we proceed, do we submit? Yes.
    }
    try {
      await onSubmit(
        sources,
        sources.length ? sourceMode : undefined,
        performance.now() - sourcePreparationStartedAt,
      );
    } finally {
      submitPendingRef.current = false;
    }
  }

  const busy = isLoading || isPreparing;

  function cancelPreparation() {
    preparationControllerRef.current?.abort();
    preparationControllerRef.current = null;
    submitPendingRef.current = false;
    setIsPreparing(false);
  }

  return (
    <div className="mt-3">
      <div className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-3 focus-within:border-[var(--am-primary)] focus-within:ring-2 focus-within:ring-[var(--am-primary)]/15">
        <label htmlFor="topic" className="sr-only">
          Ask Ada anything
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(event) => onTopicChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          maxLength={500}
          rows={3}
          placeholder="Ask Ada anything…"
          className="w-full resize-y bg-transparent text-base leading-6 text-[var(--am-text-primary)] outline-none placeholder:text-[var(--am-text-muted)]"
        />
        <div className="mt-2 flex items-center gap-1 border-t border-[var(--am-border-light)] pt-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.txt,.md,.markdown,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
            className="sr-only"
            aria-label="Attach educational files or images"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="am-icon-button"
            title="Attach files or images"
            aria-label="Attach files or images"
          >
            <Paperclip size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput((current) => !current)}
            disabled={busy}
            className="am-icon-button"
            title="Add website or YouTube link"
            aria-label="Add website or YouTube link"
            aria-expanded={showLinkInput}
          >
            <Link2 size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setShowVoiceInput((current) => !current)}
            disabled={busy}
            className="am-icon-button"
            title="Use voice input"
            aria-label="Use voice input"
            aria-expanded={showVoiceInput}
          >
            <Mic size={18} aria-hidden="true" />
          </button>
          {isPreparing ? (
            <button
              type="button"
              onClick={cancelPreparation}
              className="am-btn am-btn-secondary ml-auto"
            >
              <X size={17} aria-hidden="true" />
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={isLoading || !topic.trim()}
              className="am-btn am-btn-primary ml-auto"
            >
              {isLoading ? (
                <LoaderCircle size={17} className="motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <Send size={17} aria-hidden="true" />
              )}
              Send
            </button>
          )}
        </div>
      </div>

      {showLinkInput && (
        <div className="mt-2 flex gap-2">
          <label htmlFor="source-link" className="sr-only">Website or YouTube URL</label>
          <input
            id="source-link"
            type="url"
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addLink();
              }
            }}
            maxLength={2_048}
            placeholder="https://example.org/article or youtube.com/watch?v=…"
            className="min-w-0 flex-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--am-primary)]/20"
          />
          <button type="button" onClick={addLink} className="am-btn am-btn-secondary">
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkValue("");
            }}
            className="am-icon-button"
            title="Cancel link"
            aria-label="Cancel link"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      {showVoiceInput && (
        <VoiceInput
          initialText={topic}
          onApply={onTopicChange}
          onClose={() => setShowVoiceInput(false)}
        />
      )}

      {attachments.length > 0 && (
        <div className="mt-3 space-y-2" aria-label="Attached sources">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-bg-reading)] px-3 py-2"
            >
              <input
                type="checkbox"
                checked={attachment.selected}
                onChange={(event) =>
                  updateAttachment(attachment.id, {
                    selected: event.target.checked,
                    // If they re-select an errored source, we could reset status to pending
                    ...(attachment.status === "error" && event.target.checked ? { status: "pending", error: undefined } : {})
                  })
                }
                disabled={busy}
                aria-label={`Use ${attachment.title} in this request`}
                className="h-4 w-4 accent-[var(--am-primary)]"
              />
              {attachment.previewUrl ? (
                // The object URL points only to the learner-selected local file.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.previewUrl}
                  alt={`Preview of ${attachment.title}`}
                  className="h-12 w-12 shrink-0 rounded-[var(--am-radius-sm)] border border-[var(--am-border-light)] object-cover"
                />
              ) : attachment.sourceType === "website" || attachment.sourceType === "youtube" ? (
                <Link2 size={18} className="shrink-0 text-[var(--am-text-muted)]" aria-hidden="true" />
              ) : attachment.sourceType === "image" ? (
                <ImageIcon size={18} className="shrink-0 text-[var(--am-text-muted)]" aria-hidden="true" />
              ) : (
                <FileText size={18} className="shrink-0 text-[var(--am-text-muted)]" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--am-text-primary)]">
                  {attachment.title}
                </p>
                <p className="text-xs text-[var(--am-text-muted)]">
                  {sourceLabel(attachment.sourceType)}
                  {attachment.size ? ` · ${formatBytes(attachment.size)}` : ""}
                  {" · "}
                  {attachmentStatusLabel(attachment)}
                </p>
                {attachment.error && (
                  <p className="mt-1 text-xs text-[var(--am-error)]" role="alert">
                    {attachment.error}
                  </p>
                )}
              </div>
              {attachment.status === "processing" ? (
                <LoaderCircle size={17} className="motion-safe:animate-spin text-[var(--am-text-muted)]" aria-hidden="true" />
              ) : (
                <div className="flex items-center gap-1">
                  {attachment.status === "error" && (
                    <button
                      type="button"
                      onClick={() => updateAttachment(attachment.id, { status: "pending", error: undefined, selected: true })}
                      disabled={busy}
                      className="am-icon-button"
                      title={`Retry ${attachment.title}`}
                      aria-label={`Retry ${attachment.title}`}
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment)}
                    disabled={busy}
                    className="am-icon-button"
                    title={`Remove ${attachment.title}`}
                    aria-label={`Remove ${attachment.title}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          ))}

          <fieldset className="pt-1">
            <legend className="text-xs font-semibold text-[var(--am-text-secondary)]">
              Source use
            </legend>
            <div className="mt-1 inline-flex rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-1">
              {([
                ["source-only", "Source only"],
                ["source-plus-background", "Source + background"],
              ] as const).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-[var(--am-radius-sm)] px-3 py-1.5 text-xs font-medium ${
                    sourceMode === value
                      ? "bg-[var(--am-primary)] text-white"
                      : "text-[var(--am-text-secondary)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="source-mode"
                    value={value}
                    checked={sourceMode === value}
                    onChange={() => setSourceMode(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {composerError && (
        <p className="mt-2 text-xs leading-5 text-[var(--am-error)]" role="alert">
          {composerError}
        </p>
      )}
    </div>
  );
}
