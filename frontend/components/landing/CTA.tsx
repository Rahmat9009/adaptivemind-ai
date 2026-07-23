"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { fadeIn, slideUp } from "@/lib/motion";

export function CTA() {
  const [hasResult] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("adaptivemind-learning-dna") ?? "null",
      );
      return !!(stored && stored.scores);
    } catch {
      return false;
    }
  });

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeIn}
      className="relative isolate overflow-hidden px-5 py-24 sm:px-8 lg:px-10 lg:py-32"
    >
      {/* Dark background with warm gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--am-earth-dark)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%), radial-gradient(ellipse at 30% 50%, rgba(161, 84, 60, 0.3) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <motion.p
          variants={slideUp}
          className="am-label text-white/60"
        >
          AdaptiveMind AI
        </motion.p>

        <motion.h2
          variants={slideUp}
          className="am-heading-serif mt-6 text-3xl leading-[1.08] text-white sm:text-5xl"
        >
          {hasResult
            ? "Your Learning DNA is ready. Start growing."
            : "Ready to learn the way your mind works?"}
        </motion.h2>

        <motion.p
          variants={slideUp}
          className="mx-auto mt-6 max-w-lg text-lg leading-8 text-white/60"
        >
          {hasResult
            ? "Your profile is already shaping how Ada teaches you. Every lesson, check, and challenge makes the experience more precise."
            : "Two minutes is all it takes to build your initial Learning DNA. No sign-up, no email — just learning that fits."}
        </motion.p>

        <motion.div
          variants={slideUp}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            href={hasResult ? "/dashboard" : "/assessment"}
            color="primary"
            size="lg"
            className="bg-white text-[var(--am-earth-dark)] font-semibold hover:bg-white/90 shadow-xl"
            iconTrailing={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-50">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            }
          >
            {hasResult ? "Go to dashboard" : "Discover my Learning DNA"}
          </Button>
          <Button
            href="/tutor"
            color="secondary"
            size="lg"
            className="border border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
          >
            Try the tutor
          </Button>
        </motion.div>

        <motion.p
          variants={slideUp}
          className="mt-8 text-sm text-white/50"
        >
          No account needed. Everything is stored locally.
        </motion.p>
      </div>
    </motion.section>
  );
}
