"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { startNewTopicStorageKey } from "@/lib/dashboard-storage";

interface QuickActionsProps {
  hasHistory: boolean;
}

const actions = [
  {
    href: "/tutor",
    getLabel: (hasHistory: boolean) => hasHistory ? "Continue learning" : "Start learning",
    getDescription: (hasHistory: boolean) => hasHistory
      ? "Pick up with Ada and your current lesson."
      : "Begin your first personalized lesson with Ada.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    color: "var(--am-primary)",
  },
  {
    href: "/planner",
    getLabel: (_hasHistory: boolean) => "Build my study plan",
    getDescription: (_hasHistory: boolean) => "Turn your recent learning into a realistic next step.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    color: "var(--am-earth-accent)",
    onClick: undefined,
  },
  {
    href: "/tutor",
    getLabel: (_hasHistory: boolean) => "Start a new topic",
    getDescription: (_hasHistory: boolean) => "Explore a subject or question that is on your mind.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    ),
    color: "var(--am-success)",
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      sessionStorage.setItem(startNewTopicStorageKey, "true");
      window.location.href = "/tutor";
    },
  },
  {
    href: "/assessment",
    getLabel: (_hasHistory: boolean) => "Retake Learning DNA",
    getDescription: (_hasHistory: boolean) => "Refresh your Learning DNA starting point.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <path d="M21 3v5h-5" />
      </svg>
    ),
    color: "var(--am-dna-visual)",
  },
];

export function QuickActions({ hasHistory }: QuickActionsProps) {
  return (
    <section aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="sr-only">
        Quick actions
      </h2>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {actions.map((action, i) => (
          <motion.div key={i} variants={staggerItem}>
            {action.onClick ? (
              <a
                href={action.href}
                onClick={action.onClick}
                className="group block rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-white p-5 shadow-[var(--am-shadow-sm)] transition-all duration-200 hover:shadow-[var(--am-shadow-md)] hover:-translate-y-0.5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--am-radius-lg)]" style={{ backgroundColor: `${action.color}10`, color: action.color }}>
                  {action.icon}
                </span>
                <p className="mt-3 text-sm font-semibold text-[var(--am-text-primary)]">
                  {action.getLabel(hasHistory)}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
                  {action.getDescription(hasHistory)}
                </p>
              </a>
            ) : (
              <Link
                href={action.href}
                className="group block rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-white p-5 shadow-[var(--am-shadow-sm)] transition-all duration-200 hover:shadow-[var(--am-shadow-md)] hover:-translate-y-0.5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--am-radius-lg)]" style={{ backgroundColor: `${action.color}10`, color: action.color }}>
                  {action.icon}
                </span>
                <p className="mt-3 text-sm font-semibold text-[var(--am-text-primary)]">
                  {action.getLabel(hasHistory)}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--am-text-secondary)]">
                  {action.getDescription(hasHistory)}
                </p>
              </Link>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
