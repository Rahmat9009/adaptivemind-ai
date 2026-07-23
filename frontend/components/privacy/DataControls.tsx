"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  Database,
  Download,
  HardDrive,
  Trash2,
} from "lucide-react";
import {
  clearCachedApplicationData,
  clearPlannerLearningData,
  downloadLearningDataExport,
  removeAllDownloadedLessons,
  resetAllLearningData,
  type LocalDataOperationResult,
} from "@/lib/local-data";

type DestructiveAction = "downloads" | "planner" | "cache" | "reset";

interface ActionDefinition {
  title: string;
  description: string;
  confirmation: string;
  confirmLabel: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  run: () => Promise<LocalDataOperationResult>;
}

const actions: Record<DestructiveAction, ActionDefinition> = {
  downloads: {
    title: "Remove downloaded lessons",
    description:
      "Deletes offline lesson copies. Lesson history and mastery evidence remain.",
    confirmation:
      "Remove every downloaded lesson from this browser? This cannot be undone.",
    confirmLabel: "Remove lessons",
    icon: Trash2,
    run: removeAllDownloadedLessons,
  },
  planner: {
    title: "Clear planner",
    description:
      "Deletes the current local study plan, planner settings, and pending planner updates.",
    confirmation:
      "Clear the study plan and pending planner updates from this browser? This cannot be undone.",
    confirmLabel: "Clear planner",
    icon: Trash2,
    run: clearPlannerLearningData,
  },
  cache: {
    title: "Clear cached application data",
    description:
      "Removes AdaptiveMind application-shell caches. It does not delete learning records.",
    confirmation:
      "Clear cached AdaptiveMind application files? Offline pages may be unavailable until the app caches them again.",
    confirmLabel: "Clear cache",
    icon: HardDrive,
    run: clearCachedApplicationData,
  },
  reset: {
    title: "Reset all learning data",
    description:
      "Deletes local profiles, preferences, lesson history, mastery, plans, saved lessons, and learning activity.",
    confirmation:
      "Reset all AdaptiveMind learning data on this browser? This cannot be undone. Export first if you need a copy.",
    confirmLabel: "Reset all data",
    icon: Database,
    run: resetAllLearningData,
  },
};

function operationMessage(
  action: DestructiveAction,
  result: LocalDataOperationResult,
): string {
  if (result.warnings.length) return result.warnings.join(" ");
  if (action === "downloads") {
    return result.clearedItems
      ? "Downloaded lessons removed."
      : "No downloaded lessons were stored.";
  }
  if (action === "planner") {
    return result.clearedItems
      ? "Planner data cleared."
      : "No planner data was stored.";
  }
  if (action === "cache") {
    return result.clearedItems
      ? "Cached application data cleared."
      : "No AdaptiveMind application cache was stored.";
  }
  return "All local AdaptiveMind learning data was reset.";
}

export function DataControls() {
  const [pending, setPending] = useState<DestructiveAction | null>(null);
  const [busy, setBusy] = useState<DestructiveAction | "export" | null>(null);
  const [status, setStatus] = useState<string>("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pending) return;
    confirmRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || busy !== null) return;
      setPending(null);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, pending]);

  function closeConfirmation() {
    setPending(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  async function exportData() {
    setBusy("export");
    setStatus("");
    try {
      const data = await downloadLearningDataExport();
      setStatus(
        data.warnings.length
          ? `Export created. ${data.warnings.join(" ")}`
          : "Your local learning data export is ready.",
      );
    } catch {
      setStatus("The learning data export could not be created.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmAction() {
    if (!pending) return;
    const action = pending;
    setBusy(action);
    setStatus("");
    try {
      const result = await actions[action].run();
      setStatus(operationMessage(action, result));
    } catch {
      setStatus("That local data action could not be completed.");
    } finally {
      setBusy(null);
      closeConfirmation();
    }
  }

  return (
    <section aria-labelledby="data-controls-title">
      <div className="border-b border-[var(--am-border-light)] pb-5">
        <h2
          id="data-controls-title"
          className="am-heading-serif text-2xl text-[var(--am-text-primary)]"
        >
          Your data controls
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--am-text-secondary)]">
          These actions affect only this browser and device. Another device is
          not changed.
        </p>
      </div>

      <div className="divide-y divide-[var(--am-border-light)]">
        <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--am-text-primary)]">
              Export my learning data as JSON
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
              Includes AdaptiveMind browser records and readable IndexedDB
              learning data available on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void exportData()}
            disabled={busy !== null}
            className="am-btn am-btn-secondary min-h-11 shrink-0 px-4 py-2 text-sm"
          >
            <Download size={17} aria-hidden="true" />
            {busy === "export" ? "Exporting..." : "Export JSON"}
          </button>
        </div>

        {(Object.entries(actions) as [
          DestructiveAction,
          ActionDefinition,
        ][]).map(([key, action]) => {
          const Icon = action.icon;
          const isReset = key === "reset";
          return (
            <div
              key={key}
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--am-text-primary)]">
                  {action.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
                  {action.description}
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setPending(key);
                  setStatus("");
                }}
                disabled={busy !== null}
                className={`am-btn min-h-11 shrink-0 px-4 py-2 text-sm ${
                  isReset
                    ? "border border-[var(--am-error)] bg-transparent text-[var(--am-error)] hover:bg-[var(--am-error-light)]"
                    : "am-btn-secondary"
                }`}
              >
                <Icon size={17} aria-hidden={true} />
                {action.title}
              </button>
            </div>
          );
        })}
      </div>

      {pending && (
        <div
          className="mt-4 border-l-4 border-[var(--am-error)] bg-[var(--am-error-light)] p-4"
          role="alertdialog"
          aria-labelledby="confirm-action-title"
          aria-describedby="confirm-action-description"
        >
          <h3
            id="confirm-action-title"
            className="font-semibold text-[var(--am-text-primary)]"
          >
            Confirm local data change
          </h3>
          <p
            id="confirm-action-description"
            className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]"
          >
            {actions[pending].confirmation}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              ref={confirmRef}
              type="button"
              onClick={() => void confirmAction()}
              disabled={busy !== null}
              className="am-btn min-h-11 bg-[var(--am-error)] px-4 py-2 text-sm text-white"
            >
              <Trash2 size={17} aria-hidden="true" />
              {busy === pending
                ? "Working..."
                : actions[pending].confirmLabel}
            </button>
            <button
              type="button"
              onClick={closeConfirmation}
              disabled={busy !== null}
              className="am-btn am-btn-secondary min-h-11 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <p
        className="mt-4 min-h-6 text-sm font-medium text-[var(--am-text-secondary)]"
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
    </section>
  );
}
