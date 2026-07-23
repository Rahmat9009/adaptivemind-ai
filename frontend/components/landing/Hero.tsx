"use client";

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
    <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-[var(--am-bg)] pt-24">
      {/* Warm earth ambient layers */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {/* Deep warm glow from bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-[70vh]"
          style={{ background: "var(--am-glow-amber)" }}
        />
        {/* Earthy radial from right */}
        <div
          className="absolute right-0 top-1/4 h-[60vh] w-[50vw] opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse at center, #544443 0%, transparent 70%)" }}
        />
        {/* Subtle top-right warmth */}
        <div
          className="absolute -right-40 -top-40 h-[50vh] w-[50vh] opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #A1543C 0%, transparent 60%)" }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-5 pt-12 pb-16 sm:px-8 lg:px-10 lg:pt-16 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.95fr]">
          {/* Left: Copy */}
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--am-earth-accent)]/15 bg-[var(--am-earth-light)]/70 px-4 py-2 text-sm font-medium text-[var(--am-earth-accent)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--am-earth-accent)]" />
              Adaptive learning, reimagined
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="am-heading-serif text-5xl leading-[1.05] text-[var(--am-text-primary)] sm:text-6xl lg:text-7xl"
            >
              <span className="block">Learning should</span>
              <span className="block text-[var(--am-earth-dark)]">adapt to you.</span>
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
              {/* Glass card for constellation */}
              <div className="am-glass-card overflow-hidden p-4 sm:p-6">
                <LearningDNAConstellation scores={previewScores} activeDimension="analogies" />
              </div>

              {/* Floating teaching mode card — liquid glass */}
              <div
                className={`absolute -bottom-2 -right-2 left-4 overflow-hidden rounded-[var(--am-radius-xl)] border border-[var(--am-glass-border)] backdrop-blur-xl sm:left-auto sm:w-72 transition-all duration-[var(--am-duration-slow)] ${
                  hasScrolled
                    ? "translate-y-2 opacity-60"
                    : "translate-y-0 opacity-100"
                }`}
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(250,248,245,0.6) 100%)",
                  boxShadow: "0 8px 32px rgba(84, 68, 67, 0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--am-dna-analogies)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--am-dna-analogies)]" />
                      Teaching mode: analogy
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--am-glass-border)] bg-[var(--am-glass-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--am-text-muted)] backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--am-success)]" />
                      LIVE
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-6 text-[var(--am-text-secondary)]">
                    &ldquo;Think of a leaf as a small solar-powered kitchen: sunlight is the power,
                    water and CO₂ are the ingredients, and glucose is the meal it prepares.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
