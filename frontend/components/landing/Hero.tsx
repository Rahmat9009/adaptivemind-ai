"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { LearningDNAConstellation } from "@/components/three/LearningDNAConstellation";

const previewScores = {
  visual: 62,
  examples: 74,
  analogies: 92,
  stories: 58,
  challenges: 48,
};

export function Hero() {
  const [hasResult] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("adaptivemind-learning-dna") ?? "null");
      return !!(stored && stored.scores);
    } catch { return false; }
  });
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 80) setHasScrolled(true); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-[var(--am-bg)]">
      {/* Subtle warm background decoration */}
      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-[80vh] w-[60vw] opacity-[0.03]"
        style={{ background: "radial-gradient(ellipse at 70% 30%, #544443 0%, transparent 70%)" }}
      />

      <div className="mx-auto max-w-7xl px-5 pt-20 pb-16 sm:px-8 lg:px-10 lg:pt-24 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.95fr]">
          {/* Left: Copy */}
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--am-primary)]/20 bg-[var(--am-primary-light)] px-4 py-2 text-sm font-medium text-[var(--am-primary)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--am-primary)]" />
              Adaptive learning, reimagined
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="am-heading-serif text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.05] text-[var(--am-text-primary)]"
            >
              <span className="block">Learning should</span>
              <span className="block text-[var(--am-primary)]">adapt to you.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="mt-6 max-w-xl text-lg leading-8 text-[var(--am-text-secondary)]"
            >
              AdaptiveMind discovers how you understand, then changes how every lesson is explained —
              through visuals, examples, analogies, stories, or challenges.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Button
                href="/assessment"
                color="primary"
                size="lg"
                iconTrailing={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                }
              >
                {hasResult ? "Update my Learning DNA" : "Discover my Learning DNA"}
              </Button>

              <Button
                href="/tutor"
                color="secondary"
                size="lg"
              >
                Try the adaptive tutor
              </Button>
            </motion.div>

            {/* Returning user link */}
            {hasResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  href="/dashboard"
                  color="link-gray"
                  size="sm"
                  className="mt-5"
                  iconLeading={
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--am-success)]" aria-hidden="true" />
                  }
                  iconTrailing={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  }
                >
                  Continue where you left off
                </Button>
              </motion.div>
            )}
          </div>

          {/* Right: Interactive constellation + preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              <div className="am-surface-round overflow-hidden p-4 sm:p-6">
                <LearningDNAConstellation scores={previewScores} activeDimension="analogies" />
              </div>

              {/* Floating teaching mode card */}
              <div className={`absolute -bottom-2 -right-2 left-4 overflow-hidden rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-surface)]/95 p-4 shadow-[var(--am-shadow-lg)] backdrop-blur-xl transition-all duration-[var(--am-duration-slow)] sm:left-auto sm:w-72 ${hasScrolled ? "translate-y-2 opacity-60" : "translate-y-0 opacity-100"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--am-dna-analogies)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--am-dna-analogies)]" />
                    Teaching mode: analogy
                  </span>
                  <span className="am-pill text-[10px] py-0.5 px-2">LIVE</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
                  &ldquo;Think of a leaf as a small solar-powered kitchen: sunlight is the power,
                  water and CO₂ are the ingredients, and glucose is the meal it prepares.&rdquo;
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
