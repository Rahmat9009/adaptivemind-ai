"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { slideUp, staggerContainer, staggerItem } from "@/lib/motion";

const steps = [
  {
    number: 1,
    title: "Discover your Learning DNA",
    description: "A short assessment captures which explanation approaches you respond to — visuals, examples, analogies, stories, or challenges. This is a starting hypothesis, not a fixed label.",
  },
  {
    number: 2,
    title: "Learn with Ada",
    description: "Ada shapes every explanation around what works best for you. As you complete lessons, your effective approaches become clearer.",
  },
  {
    number: 3,
    title: "Check your understanding",
    description: "Brief checks, follow-up conversations, and mastery tracking ensure each concept is solid before you move forward.",
  },
  {
    number: 4,
    title: "Build lasting mastery",
    description: "Every lesson and check refines your profile. Your Learning DNA evolves with you — it is never a one-time label.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative isolate overflow-hidden bg-[var(--am-warm-bg)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={slideUp}
          className="max-w-2xl"
        >
          <p className="am-label text-[var(--am-primary)]/70">
            Your learning journey
          </p>
          <h2 className="am-heading-serif mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] text-[var(--am-text-primary)]">
            From first assessment to lasting mastery.
          </h2>
        </motion.div>

        {/* Connected path timeline */}
        <div className="mt-14 relative">
          {/* Vertical connecting line (desktop) */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-[var(--am-border)] hidden md:block" />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="space-y-10"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={staggerItem}
                className="relative flex flex-col gap-4 md:flex-row md:items-start"
              >
                {/* Step number circle */}
                <div className="relative z-10 flex md:w-16 shrink-0 justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--am-surface)] border-2 border-[var(--am-primary)] text-lg font-bold text-[var(--am-primary)] shadow-[var(--am-shadow-sm)]">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="am-card p-6 md:p-8 flex-1 md:ml-4">
                  <h3 className="text-lg font-semibold text-[var(--am-text-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-7 text-[var(--am-text-secondary)]">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector for non-last items */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex justify-center absolute -bottom-8 left-8 w-px h-8">
                    <svg width="16" height="16" viewBox="0 0 16 16" className="text-[var(--am-border)] absolute -bottom-1 -left-[7px]">
                      <path d="M8 12l-4-4h8l-4 4z" fill="currentColor" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Link
              href="/assessment"
              className="am-btn am-btn-primary"
            >
              Start your learning journey
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-60">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
