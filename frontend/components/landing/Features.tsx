"use client";

import { motion } from "motion/react";
import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/lib/motion";

const features = [
  {
    title: "Learning DNA",
    description:
      "A dynamic profile built from your preferences across five dimensions — Visual, Examples, Analogies, Stories, and Challenges. Not a fixed label, but an evolving map of how ideas click for you.",
    accent: "#8b5cf6",
  },
  {
    title: "Adaptive explanations",
    description:
      "Every lesson is shaped by your Learning DNA. The same concept can be taught visually, through analogies, as a story, with worked examples, or as a reasoning challenge — Ada chooses what fits.",
    accent: "#22d3ee",
  },
  {
    title: "Living progress",
    description:
      "Mastery tracking, understanding checks, and a study planner that adapts to your pace. Not a static report card — a continuous, responsive picture of your growing knowledge.",
    accent: "#5046e5",
  },
];

export function Features() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeIn}
      className="relative isolate overflow-hidden bg-[var(--am-bg-reading)] px-5 py-24 sm:px-8 lg:px-10"
    >
      {/* Subtle top boundary */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--am-primary)]/15 to-transparent" />

      <div className="mx-auto max-w-6xl">
        <motion.div variants={slideUp} className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--am-primary)]/70">
            How it works
          </p>
          <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight text-[var(--am-text-primary)] leading-[1.12]">
            One concept, explained in the way that makes sense to you.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-16 grid gap-8 md:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              variants={staggerItem}
              className="group relative"
            >
              {/* Accent line */}
              <div
                className="mb-6 h-1 w-12 rounded-full transition-all duration-[var(--am-duration-standard)] group-hover:w-16"
                style={{ backgroundColor: feature.accent }}
              />

              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--am-radius-md)] text-sm font-semibold"
                  style={{
                    backgroundColor: `${feature.accent}15`,
                    color: feature.accent,
                  }}
                >
                  0{index + 1}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-semibold tracking-tight text-[var(--am-text-primary)]">
                {feature.title}
              </h3>
              <p className="mt-3 leading-7 text-[var(--am-text-secondary)]">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
