"use client";

import { motion } from "motion/react";
import { easeOutExpo } from "@/lib/motion";

const steps = [
  {
    n: "01",
    title: "Map",
    body: "A two-minute assessment traces which of the five learning dimensions feel most useful to you right now.",
    detail: "No right answers. No labels. Just a starting shape.",
  },
  {
    n: "02",
    title: "Learn",
    body: "Ada teaches any topic you choose, weighting the explanation toward your strongest dimensions — and adapting as you respond.",
    detail: "Ask for simpler, an example, a challenge, or a different lens.",
  },
  {
    n: "03",
    title: "Check",
    body: "After every lesson, a single understanding check tells Ada what landed and what needs another pass.",
    detail: "Your profile updates from evidence, not vibes.",
  },
  {
    n: "04",
    title: "Plan",
    body: "A day-by-day study journey uses your mastery, recent lessons, and current preferences to keep momentum realistic.",
    detail: "One focused day at a time. No calendar grid.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-midnight-950 px-5 py-24 text-paper-50 sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-50" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.08),transparent_45%)]" />

      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow-num text-midnight-300">How it works</p>
          <h2 className="font-display mt-4 text-4xl leading-tight tracking-tight sm:text-5xl">
            A calmer path<br />from assessment to mastery.
          </h2>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-midnight-700/40 bg-midnight-700/40 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.article
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: easeOutExpo, delay: i * 0.08 }}
              className="group relative bg-midnight-900 p-7 transition-colors duration-300 hover:bg-midnight-850"
            >
              <p className="font-mono text-sm text-midnight-400">{step.n}</p>
              <h3 className="font-display mt-4 text-2xl text-paper-50">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-midnight-200">{step.body}</p>
              <p className="mt-4 border-t border-midnight-700/50 pt-3 text-xs leading-5 text-midnight-400">{step.detail}</p>
              <span className="absolute right-6 top-7 text-midnight-700 transition group-hover:text-midnight-400">→</span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
