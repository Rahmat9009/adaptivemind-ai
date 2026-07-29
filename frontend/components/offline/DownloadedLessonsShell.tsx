"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CloudOff,
  Download,
  HardDrive,
} from "lucide-react";
import { PageShell } from "@/components/am/PageShell";
import { LessonCard } from "@/components/tutor/LessonCard";
import { useOfflineLessons } from "@/hooks/useOfflineLessons";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  loadOfflineLessonSettings,
  saveOfflineLessonSettings,
} from "@/lib/offline-lessons";

export function DownloadedLessonsShell() {
  const {
    lessons,
    loading,
    error,
  } = useOfflineLessons();
  const isOnline = useOnlineStatus();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoCache, setAutoCache] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAutoCache(loadOfflineLessonSettings().autoCacheRecent);
      setSettingsReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selected =
    lessons.find((lesson) => lesson.id === selectedId) ?? lessons[0];
  const storageBytes = useMemo(
    () => lessons.reduce((sum, lesson) => sum + lesson.sizeBytes, 0),
    [lessons],
  );

  return (
    <PageShell
      heading="Downloaded Lessons"
      subheading="Learning content saved on this browser"
    >
      <section
        className="border-y border-[var(--am-border-light)] py-5"
        aria-labelledby="offline-library-settings"
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h2
              id="offline-library-settings"
              className="text-sm font-semibold text-[var(--am-text-primary)]"
            >
              Local lesson library
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--am-text-secondary)]">
              Saved copies stay on this browser and remain readable without a
              connection. New Ada responses still require internet access.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--am-text-secondary)]">
            {isOnline ? (
              <Download
                size={18}
                className="text-[var(--am-success)]"
                aria-hidden="true"
              />
            ) : (
              <CloudOff
                size={18}
                className="text-[var(--am-warning)]"
                aria-hidden="true"
              />
            )}
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>

        <label className="mt-5 flex max-w-2xl items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-[var(--am-primary)]"
            checked={autoCache}
            disabled={!settingsReady}
            onChange={(event) => {
              const enabled = event.target.checked;
              setAutoCache(enabled);
              saveOfflineLessonSettings({
                autoCacheRecent: enabled,
              });
            }}
          />
          <span>
            <span className="font-semibold text-[var(--am-text-primary)]">
              Automatically keep the last three successful lessons
            </span>
            <span className="mt-0.5 block leading-6 text-[var(--am-text-secondary)]">
              Older automatic copies are removed first. Lessons you save
              manually are never removed by this setting.
            </span>
          </span>
        </label>
      </section>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--am-text-secondary)]">
        <span className="inline-flex items-center gap-2">
          <BookOpen size={17} aria-hidden="true" />
          {lessons.length} saved
        </span>
        <span className="inline-flex items-center gap-2">
          <HardDrive size={17} aria-hidden="true" />
          {(storageBytes / 1024).toFixed(storageBytes > 0 ? 1 : 0)} KB used
        </span>
      </div>

      {error && (
        <p
          className="mt-5 border-l-4 border-[var(--am-error)] px-4 py-2 text-sm text-[var(--am-error)]"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-[var(--am-text-muted)]" role="status">
          Loading saved lessons...
        </p>
      ) : lessons.length === 0 ? (
        <section className="mt-8 py-12 text-center">
          <Download
            size={28}
            className="mx-auto text-[var(--am-text-muted)]"
            aria-hidden="true"
          />
          <h2 className="am-heading-serif mt-4 text-xl text-[var(--am-text-primary)]">
            No downloaded lessons yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--am-text-secondary)]">
            Generate a lesson with Ada, then choose Save offline.
          </p>
          <Link href="/tutor" className="am-btn am-btn-primary mt-5">
            Open Tutor
          </Link>
        </section>
      ) : (
        <div className="mt-8 grid gap-7 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <nav aria-label="Downloaded lessons" className="min-w-0">
            <ul className="divide-y divide-[var(--am-border-light)] border-y border-[var(--am-border-light)]">
              {lessons.map((lesson) => (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(lesson.id)}
                    aria-current={
                      selected?.id === lesson.id ? "page" : undefined
                    }
                    className={`w-full px-3 py-4 text-left transition-colors ${
                      selected?.id === lesson.id
                        ? "bg-[var(--am-primary-light)]"
                        : "hover:bg-[var(--am-warm-bg)]"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-[var(--am-text-primary)]">
                      {lesson.response.lesson.title}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--am-text-muted)]">
                      {new Date(lesson.savedAt).toLocaleDateString()} |{" "}
                      {lesson.saveKind === "automatic"
                        ? "Automatic copy"
                        : "Saved by you"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0">
            {selected && (
              <>
                <p className="mb-3 text-xs font-semibold uppercase text-[var(--am-success)]">
                  Saved content
                </p>
                <LessonCard
                  response={selected.response}
                  historyEntry={selected}
                />
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
