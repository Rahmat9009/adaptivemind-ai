"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";
import type { LessonRecommendation } from "@/lib/recommendations";

export function RecommendationCard({
  recommendation,
}: {
  recommendation: LessonRecommendation | null;
}) {
  if (!recommendation) return null;

  const href = `/tutor?topic=${encodeURIComponent(recommendation.topic)}&subject=${encodeURIComponent(recommendation.subject)}&level=${encodeURIComponent(recommendation.level)}`;

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      aria-labelledby="recommendation-title"
      className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)]"
    >
      <motion.div variants={slideUp}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-primary)]/70">
          Suggested next
        </p>
        <h2
          id="recommendation-title"
          className="mt-2 text-2xl font-semibold tracking-tight text-[var(--am-text-primary)]"
        >
          {recommendation.topic}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--am-text-secondary)]">
          {recommendation.reason}
        </p>
        <Link href={href} className="am-btn am-btn-primary mt-5 inline-flex">
          Start this lesson
        </Link>
      </motion.div>
    </motion.section>
  );
}
