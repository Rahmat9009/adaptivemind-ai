"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";

export function EmptyDashboard() {
  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-8 text-center sm:p-10 border-dashed"
    >
      <motion.div variants={slideUp}>
        <p className="am-label text-[var(--am-text-muted)]">
          Your journey starts here
        </p>
        <h2 className="am-heading-serif mt-3 text-2xl text-[var(--am-text-primary)]">
          Your first lesson will give this space momentum.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--am-text-secondary)]">
          Ask Ada about a topic you are studying, and this dashboard will keep a
          local record of your learning journey.
        </p>
        <Link
          href="/tutor"
          className="am-btn am-btn-primary mt-6 inline-flex"
        >
          Start your first lesson
        </Link>
      </motion.div>
    </motion.section>
  );
}
