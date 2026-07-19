"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { LearningDNAConstellation } from "@/components/three/LearningDNAConstellation";
import { learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";
import { easeOutExpo } from "@/lib/motion";

const previewProfiles: Record<string, LearningScores> = {
  analogies: { visual: 58, examples: 64, analogies: 92, stories: 62, challenges: 48 },
  visual: { visual: 94, examples: 62, analogies: 58, stories: 50, challenges: 52 },
  examples: { visual: 60, examples: 93, analogies: 64, stories: 58, challenges: 54 },
  stories: { visual: 56, examples: 60, analogies: 70, stories: 95, challenges: 50 },
  challenges: { visual: 62, examples: 64, analogies: 58, stories: 52, challenges: 94 },
};

const previewLessons: Record<LearningDimension, { topic: string; body: string; tag: string }> = {
  visual: {
    topic: "Photosynthesis",
    tag: "Visual breakdown",
    body: "Ada sketches the leaf as three labeled zones — light in, ingredients mix, glucose out. Each stage sits in its own panel so the relationship is visible at a glance.",
  },
  examples: {
    topic: "Newton's First Law",
    tag: "Worked example",
    body: "Ada starts with a real case: a bus brakes, your body keeps moving. The seat belt is the force that changes your motion. Abstract law becomes a moment you've already lived.",
  },
  analogies: {
    topic: "Photosynthesis",
    tag: "Useful analogy",
    body: "Ada calls the leaf a tiny solar-powered kitchen. Sunlight is the power, water and CO₂ are the ingredients, glucose is the meal. The analogy preserves the same relationship exactly.",
  },
  stories: {
    topic: "The Pythagorean Theorem",
    tag: "Short story",
    body: "Ada follows a builder measuring a corner plot with a rope triangle. The story has a beginning, a tension, and an outcome that makes the formula memorable.",
  },
  challenges: {
    topic: "Newton's First Law",
    tag: "Reasoning challenge",
    body: "Ada sets up only what you need, then asks you to predict what happens to a puck on ice versus grass — before revealing the answer. You reason first.",
  },
};

export function Hero() {
  const [active, setActive] = useState<LearningDimension>("analogies");
  const scores = previewProfiles[active];
  const lesson = previewLessons[active];

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-midnight-950 text-paper-50"
    >
      {/* Ambient depth — three faint radial tints from the DNA palette, no blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(45,212,191,0.10),transparent_40%),radial-gradient(circle_at_82%_12%,rgba(167,139,250,0.12),transparent_42%),radial-gradient(circle_at_60%_90%,rgba(251,113,133,0.08),transparent_45%)]" />
        <div className="absolute inset-0 bg-grain opacity-60" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-12 lg:pb-28 lg:pt-28">
        {/* Left — editorial headline + asymmetric vertical rhythm */}
        <div className="flex flex-col justify-center lg:pr-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="eyebrow-num text-midnight-300"
          >
            <span className="mr-2 text-dna-visual">●</span>
            A learning identity, not a learning label
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.05 }}
            className="font-display mt-7 text-[3.25rem] leading-[0.98] tracking-tight sm:text-[4.25rem] lg:text-[5.25rem]"
          >
            The AI tutor
            <br />
            that <em className="italic text-dna-analogies">learns</em>
            <br />
            how you learn.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.18 }}
            className="mt-8 max-w-md text-lg leading-8 text-midnight-200"
          >
            Five dimensions of understanding — visual, examples, analogies,
            stories, challenges — woven into a living profile that reshapes
            every explanation around the way you think.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.28 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <a
              href="/assessment"
              className="rounded-full bg-paper-50 px-7 py-3.5 text-center text-base font-semibold text-midnight-950 shadow-xl shadow-black/30 transition hover:-translate-y-0.5 hover:bg-paper-100"
            >
              Map my Learning DNA
            </a>
            <a
              href="#how-it-works"
              className="rounded-full border border-midnight-600 px-7 py-3.5 text-center text-base font-semibold text-paper-50 transition hover:-translate-y-0.5 hover:border-midnight-400"
            >
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-12 flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-midnight-400"
          >
            <span>2-minute assessment</span>
            <span className="h-px w-6 bg-midnight-600" />
            <span>No account needed</span>
          </motion.div>
        </div>

        {/* Right — constellation + adaptive lesson preview */}
        <div className="flex flex-col gap-5 lg:pl-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: easeOutExpo, delay: 0.15 }}
          >
            <LearningDNAConstellation
              scores={scores}
              activeDimension={active}
              onDimensionSelect={setActive}
              caption="Tap a dimension to preview how Ada adapts."
            />
          </motion.div>

          {/* Adaptive lesson preview — switches content based on the active DNA dimension */}
          <motion.article
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="surface-midnight relative overflow-hidden rounded-2xl border border-midnight-600/40 p-5"
          >
            <div
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: dnaHex[active] }}
            />
            <div className="flex items-center justify-between gap-3 pl-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: dnaHex[active] }} />
                <span className="eyebrow-num text-midnight-300">Ada · {lesson.tag}</span>
              </div>
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-midnight-400">
                live preview
              </span>
            </div>
            <h3 className="mt-3 pl-3 font-display text-xl text-paper-50">{lesson.topic}</h3>
            <p className="mt-2 pl-3 text-sm leading-6 text-midnight-200">{lesson.body}</p>

            <div className="mt-4 flex flex-wrap gap-1.5 pl-3">
              {learningDimensions.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActive(d)}
                  className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-medium transition ${
                    active === d
                      ? "border-white/30 bg-white/12 text-white"
                      : "border-midnight-600/50 text-midnight-400 hover:border-midnight-400 hover:text-midnight-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
