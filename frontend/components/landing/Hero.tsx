"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    <section className="relative isolate overflow-hidden">
      {/* Deep space background */}
      <div className="am-deep-space absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(80,70,229,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(80,70,229,0.04) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/3 top-0 -z-10 h-[60vh] w-[50vw] opacity-20" style={{ background: "radial-gradient(ellipse at center, rgba(80,70,229,0.3) 0%, transparent 70%)" }} />

      <div className="mx-auto max-w-7xl px-5 pt-24 pb-20 sm:px-8 lg:px-10 lg:pt-32 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Copy */}
          <div className="max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--am-primary)]/20 bg-[var(--am-primary)]/8 px-4 py-2 text-sm font-medium text-[var(--am-primary)]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#22d3ee" }} />
              Adaptive AI tutoring, reimagined
            </p>

            <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-semibold tracking-tight text-white leading-[1.08]">
              <span className="block">Changes how it teaches</span>
              <span className="mt-2 block bg-gradient-to-r from-[var(--am-dna-visual)] via-[var(--am-primary)] to-[var(--am-dna-analogies)] bg-clip-text text-transparent">
                based on how you understand.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">
              AdaptiveMind builds a unique Learning DNA profile from your preferences —
              then shapes every explanation, example, and challenge around the way you learn best.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--am-primary)] px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-[var(--am-primary)]/25 transition-all duration-[var(--am-duration-quick)] hover:-translate-y-0.5 hover:bg-[var(--am-primary-hover)] hover:shadow-2xl hover:shadow-[var(--am-primary)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {hasResult ? "Update my Learning DNA" : "Discover your Learning DNA"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-60">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/tutor"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all duration-[var(--am-duration-quick)] hover:bg-white/15 hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Try the adaptive tutor
              </Link>
            </div>

            {/* Continue learning — only for returning users */}
            {hasResult && (
              <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--am-success)]" aria-hidden="true" />
                Continue where you left off
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {/* Right: Interactive constellation + preview card */}
          <div className="relative">
            <div className="relative">
              <LearningDNAConstellation scores={previewScores} activeDimension="analogies" />

              {/* Floating teaching mode card */}
              <div className={`absolute -bottom-3 -right-3 left-4 overflow-hidden rounded-[var(--am-radius-xl)] border border-white/10 bg-[#0a0f20]/90 p-4 backdrop-blur-xl transition-all duration-[var(--am-duration-slow)] sm:left-auto sm:w-72 ${hasScrolled ? "translate-y-2 opacity-60" : "translate-y-0 opacity-100"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--am-dna-analogies)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--am-dna-analogies)]" />
                    Teaching mode: analogy
                  </span>
                  <span className="rounded bg-white/8 px-2 py-0.5 text-[10px] font-medium text-white/50">LIVE</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  &ldquo;Think of a leaf as a small solar-powered kitchen: sunlight is the power,
                  water and CO₂ are the ingredients, and glucose is the meal it prepares.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
