"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import { Logo } from "@/components/am/Logo";

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="opacity-50"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

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
      className="relative isolate overflow-hidden px-5 py-24 sm:px-8 lg:px-10"
    >
      <div className="absolute inset-0 -z-10">
        <div className="am-deep-space h-full w-full" />
      </div>

      {/* Grid lines */}
      <div
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="mx-auto max-w-3xl text-center">
        <motion.div variants={slideUp} className="mb-8 flex justify-center">
          <div className="rounded-full bg-white/8 p-3 backdrop-blur-sm">
            <span className="flex items-center gap-2 text-white">
              <Logo size={24} colored />
              <span className="text-sm font-medium">AdaptiveMind AI</span>
            </span>
          </div>
        </motion.div>

        <motion.h2
          variants={slideUp}
          className="text-[clamp(2rem,4vw,3.5rem)] font-semibold tracking-tight text-white leading-[1.08]"
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
          <Link
            href={hasResult ? "/dashboard" : "/assessment"}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[var(--am-bg-deep)] shadow-xl transition-all duration-[var(--am-duration-quick)] hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {hasResult ? "Go to dashboard" : "Discover your Learning DNA"}
            <ArrowRightIcon />
          </Link>
          <Link
            href="/tutor"
            className="inline-flex items-center justify-center gap-2 text-base font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Try the tutor
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
