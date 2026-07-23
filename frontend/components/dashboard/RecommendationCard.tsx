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
      className="am-card p-6"
    >
      <motion.div variants={slideUp}>
        <p className="am-label text-[var(--am-primary)]/70">
          Suggested next
        </p>
        <h2
          id="recommendation-title"
          className="am-heading-serif mt-2 text-2xl text-[var(--am-text-primary)]"
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
