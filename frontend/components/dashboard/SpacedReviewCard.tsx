"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { fadeIn } from "@/lib/motion";
import type { ReviewCard } from "@/lib/spaced-review";

interface SpacedReviewCardProps {
  dueReviews: ReviewCard[];
  upcomingReviews: ReviewCard[];
}

function getDifficultyLabel(quality?: number): string {
  if (!quality) return "Not yet reviewed";
  if (quality >= 4) return "Well remembered";
  if (quality >= 3) return "Moderate";
  return "Needs practice";
}

export function SpacedReviewCard({
  dueReviews,
  upcomingReviews,
}: SpacedReviewCardProps) {
  if (dueReviews.length === 0 && upcomingReviews.length === 0) {
    return (
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="am-card p-6 border-dashed"
        aria-labelledby="review-title"
      >
        <h2 id="review-title" className="am-heading-serif text-xl text-[var(--am-text-primary)]">
          Spaced review
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
          Topics you have learned will appear here when it is time to review them.
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6"
      aria-labelledby="review-title"
    >
      <h2 id="review-title" className="am-heading-serif text-xl text-[var(--am-text-primary)]">
        Spaced review
      </h2>
      <p className="mt-1 text-xs text-[var(--am-text-muted)]">
        Retrieval practice strengthens long-term memory
      </p>

      {/* Due now */}
      {dueReviews.length > 0 && (
        <div className="mt-4">
          <p className="am-label text-[var(--am-earth-accent)] mb-2">
            Due for review
          </p>
          <div className="space-y-2">
            {dueReviews.slice(0, 4).map((card) => (
              <div
                key={card.skillId}
                className="flex items-center justify-between rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--am-text-primary)]">
                    {card.topic}
                  </p>
                  <p className="text-xs text-[var(--am-text-muted)]">
                    {getDifficultyLabel(card.lastQuality)} · Ease factor:{" "}
                    {card.easeFactor.toFixed(1)}
                  </p>
                </div>
                <Link
                  href={`/tutor?topic=${encodeURIComponent(card.topic)}&review=true`}
                  className="shrink-0 rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--am-primary)] transition-colors hover:bg-[var(--am-primary-light)]"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingReviews.length > 0 && (
        <div className="mt-4">
          <p className="am-label text-[var(--am-text-muted)] mb-2">
            Upcoming review
          </p>
          <div className="space-y-2">
            {upcomingReviews.slice(0, 3).map((card) => (
              <div
                key={card.skillId}
                className="flex items-center justify-between rounded-[var(--am-radius-md)] px-4 py-2"
              >
                <p className="text-sm text-[var(--am-text-secondary)]">
                  {card.topic}
                </p>
                {card.nextReview && (
                  <span className="text-xs text-[var(--am-text-muted)]">
                    {daysUntil(card.nextReview)}d
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {dueReviews.length > 4 && (
        <p className="mt-3 text-xs text-[var(--am-text-muted)]">
          +{dueReviews.length - 4} more topics due for review
        </p>
      )}
    </motion.section>
  );
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.round(diff / 86400000));
}
