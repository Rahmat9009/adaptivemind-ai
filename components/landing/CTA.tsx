"use client";

import { motion } from "motion/react";
import { easeOutExpo } from "@/lib/motion";

export function CTA() {
  return (
    <section id="about" className="bg-paper-50 px-5 py-24 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: easeOutExpo }}
        className="surface-midnight relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] px-6 py-20 text-center sm:px-12"
      >
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-50" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.14),transparent_50%)]" />

        <p className="eyebrow-num text-midnight-300">Begin</p>
        <h2 className="font-display mx-auto mt-6 max-w-2xl text-4xl leading-[1.05] text-paper-50 sm:text-5xl">
          Two minutes from now,<br />your tutor will know you better.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base leading-7 text-midnight-200">
          A short assessment. A living profile. Lessons that finally feel like
          they were written for the way you think.
        </p>
        <a
          href="/assessment"
          className="mt-10 inline-flex rounded-full bg-paper-50 px-8 py-4 text-base font-semibold text-midnight-950 shadow-xl shadow-black/30 transition hover:-translate-y-0.5 hover:bg-paper-100"
        >
          Map my Learning DNA
        </a>
      </motion.div>
    </section>
  );
}
