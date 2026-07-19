"use client";

import Link from "next/link";
import { startNewTopicStorageKey } from "@/lib/dashboard-storage";

interface QuickActionsProps {
  hasHistory: boolean;
}

export function QuickActions({ hasHistory }: QuickActionsProps) {
  return (
    <section aria-labelledby="quick-actions-title">
      <h2
        id="quick-actions-title"
        className="sr-only"
      >
        Quick actions
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/tutor"
          className="group rounded-[var(--am-radius-xl)] border border-[var(--am-primary)]/20 bg-[var(--am-primary)] p-5 text-white shadow-sm transition-all duration-[var(--am-duration-quick)] hover:-translate-y-0.5 hover:shadow-[var(--am-shadow-md)]"
        >
          <p className="font-semibold">
            {hasHistory ? "Continue learning" : "Start learning"}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-white/70">
            {hasHistory
              ? "Pick up with Ada and your current lesson."
              : "Begin your first personalized lesson with Ada."}
          </p>
        </Link>

        <Link
          href="/planner"
          className="group rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-5 shadow-sm transition-all duration-[var(--am-duration-quick)] hover:-translate-y-0.5 hover:shadow-[var(--am-shadow-md)]"
        >
          <p className="font-semibold text-[var(--am-text-primary)]">
            Build my study plan
          </p>
          <p className="mt-1.5 text-sm leading-6 text-[var(--am-text-secondary)]">
            Turn your recent learning into a realistic next step.
          </p>
        </Link>

        <Link
          href="/tutor"
          onClick={() =>
            sessionStorage.setItem(startNewTopicStorageKey, "true")
          }
          className="group rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-5 shadow-sm transition-all duration-[var(--am-duration-quick)] hover:-translate-y-0.5 hover:shadow-[var(--am-shadow-md)]"
        >
          <p className="font-semibold text-[var(--am-text-primary)]">
            Start a new topic
          </p>
          <p className="mt-1.5 text-sm leading-6 text-[var(--am-text-secondary)]">
            Explore a subject or question that is on your mind.
          </p>
        </Link>

        <Link
          href="/assessment"
          className="group rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-5 shadow-sm transition-all duration-[var(--am-duration-quick)] hover:-translate-y-0.5 hover:shadow-[var(--am-shadow-md)]"
        >
          <p className="font-semibold text-[var(--am-text-primary)]">
            Retake Learning DNA
          </p>
          <p className="mt-1.5 text-sm leading-6 text-[var(--am-text-secondary)]">
            Refresh your current learning preferences.
          </p>
        </Link>
      </div>
    </section>
  );
}
