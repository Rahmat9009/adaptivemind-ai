"use client";

import { motion } from "motion/react";
import { learningDimensionLabels, learningDimensions, type LearningDimension } from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";
import { easeOutExpo } from "@/lib/motion";

const dimensionEssence: Record<LearningDimension, string> = {
  visual: "Structure made visible. Diagrams, layouts, and labeled relationships so the shape of an idea is obvious.",
  examples: "One concrete case first. A worked situation that grounds the abstract before any theory.",
  analogies: "A familiar bridge. Something you already know, mapped precisely onto something you don't.",
  stories: "A beginning, a tension, an outcome. Narrative gives the concept a place to live in memory.",
  challenges: "Reason first, reveal second. A prediction or puzzle that makes the idea your own.",
};

export function Features() {
  return (
    <section id="approach" className="relative bg-paper-50 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="eyebrow-num text-ink-500">The approach</p>
            <h2 className="font-display mt-4 text-4xl leading-tight tracking-tight text-ink-950 sm:text-5xl">
              Five dimensions,<br />one continuous profile.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-ink-700">
              Most tutors pick one style and hope. AdaptiveMind holds five in
              tension at once — and learns, from every lesson, which to
              emphasize next.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-ink-900/8 bg-ink-900/8 sm:grid-cols-2">
            {learningDimensions.map((dimension, i) => (
              <motion.article
                key={dimension}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, ease: easeOutExpo, delay: i * 0.05 }}
                className="group relative bg-paper-50 p-6 transition-colors duration-300 hover:bg-paper-100"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: dnaHex[dimension], boxShadow: `0 0 14px -2px ${dnaHex[dimension]}` }}
                    />
                    <h3 className="font-display text-xl text-ink-950">{learningDimensionLabels[dimension]}</h3>
                  </div>
                  <span className="font-mono text-[0.7rem] text-ink-500">0{i + 1}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-700">{dimensionEssence[dimension]}</p>
                <div
                  className="mt-4 h-px w-0 transition-all duration-500 group-hover:w-full"
                  style={{ background: dnaHex[dimension] }}
                />
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
