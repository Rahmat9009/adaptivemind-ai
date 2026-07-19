"use client";

import Link from "next/link";
import { startNewTopicStorageKey } from "@/lib/dashboard-storage";

interface QuickActionsProps { hasHistory: boolean; }

const actions = [
  {
    href: "/tutor",
    accent: "var(--color-dna-analogies)",
    title: "Continue with Ada",
    body: "Pick up your current lesson or ask something new.",
    primary: true,
  },
  {
    href: "/planner",
    accent: "var(--color-dna-visual)",
    title: "My study plan",
    body: "A day-by-day journey from your recent progress.",
  },
  {
    href: "/tutor",
    accent: "var(--color-dna-examples)",
    title: "Start a new topic",
    body: "Explore a subject that is on your mind.",
    newTopic: true,
  },
  {
    href: "/assessment",
    accent: "var(--color-dna-stories)",
    title: "Retake Learning DNA",
    body: "Refresh how your profile is shaped today.",
  },
];

export function QuickActions({ hasHistory }: QuickActionsProps) {
  return (
    <section aria-labelledby="quick-actions-title">
      <p className="eyebrow-num text-ink-500">Next steps</p>
      <h2 id="quick-actions-title" className="font-display mt-3 text-2xl text-ink-950">Where to begin</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Link
            key={a.title}
            href={a.href}
            onClick={a.newTopic ? () => sessionStorage.setItem(startNewTopicStorageKey, "true") : undefined}
            className="group relative overflow-hidden rounded-2xl border border-ink-900/10 bg-paper-50 p-5 transition hover:-translate-y-0.5 hover:bg-paper-100"
            style={a.primary ? { borderColor: `${a.accent}55`, background: `linear-gradient(160deg, ${a.accent}10, var(--color-paper-50) 70%)` } : undefined}
          >
            <span className="absolute left-0 top-0 h-full w-1 transition-all duration-300 group-hover:w-1.5" style={{ background: a.accent }} />
            <p className="pl-2 font-display text-lg text-ink-950">{a.title === "Continue with Ada" && !hasHistory ? "Start with Ada" : a.title}</p>
            <p className="mt-1.5 pl-2 text-sm leading-6 text-ink-600">{a.body}</p>
            <span className="mt-3 inline-block pl-2 text-sm font-medium transition group-hover:translate-x-1" style={{ color: a.accent }}>→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
