"use client";

import Link from "next/link";

const steps = [
  {
    number: 1,
    title: "Discover your profile",
    description:
      "A short, thoughtful assessment maps your initial Learning DNA — the combination of teaching approaches that feel most natural to you.",
    accent: "#5046e5",
  },
  {
    number: 2,
    title: "Ada teaches your way",
    description:
      "Choose any topic. Ada shapes the explanation around your Learning DNA — visual breakdowns, analogies, stories, examples, or challenges — not a generic lecture.",
    accent: "#22d3ee",
  },
  {
    number: 3,
    title: "Verify and deepen",
    description:
      "Understanding checks, follow-up conversations, and mastery tracking make sure each concept is solid before moving forward.",
    accent: "#8b5cf6",
  },
  {
    number: 4,
    title: "Evolve together",
    description:
      "Every lesson, check, and challenge refines what Ada knows about how you learn. Your Learning DNA grows with you — it is never a one-time label.",
    accent: "#fb7185",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative isolate overflow-hidden bg-[var(--am-bg-reading)] px-5 py-24 sm:px-8 lg:px-10"
    >
      {/* Subtle separator */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--am-primary)]/10 to-transparent" />

      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--am-primary)]/70">
            Your learning journey
          </p>
          <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight leading-[1.12]">
            From first assessment to lasting mastery.
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {steps.map((step) => (
            <article
              key={step.number}
              className="group relative overflow-hidden rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-7 transition-all duration-[var(--am-duration-standard)] hover:shadow-[var(--am-shadow-md)] hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--am-radius-lg)] text-lg font-semibold text-white"
                  style={{ backgroundColor: step.accent }}
                >
                  {step.number}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--am-text-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-7 text-[var(--am-text-secondary)]">
                    {step.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--am-primary)] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--am-primary)]/20 transition-all duration-[var(--am-duration-quick)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--am-primary)]/25"
          >
            Start your learning journey
            <span aria-hidden="true" className="text-sm opacity-60">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
