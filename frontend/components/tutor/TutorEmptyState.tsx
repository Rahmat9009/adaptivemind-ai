"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { fadeIn, slideUp } from "@/lib/motion";

interface TutorEmptyStateProps {
  onUseBalancedProfile: () => void;
}

export function TutorEmptyState({
  onUseBalancedProfile,
}: TutorEmptyStateProps) {
  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-xl rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-8 text-center shadow-[var(--am-shadow-sm)] sm:p-10"
    >
      <motion.div variants={slideUp}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--am-text-muted)]">
          Learning DNA needed
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--am-text-primary)]">
          Your tutor works best after the assessment.
        </h1>
        <p className="mt-4 leading-7 text-[var(--am-text-secondary)]">
          Your assessment gives AdaptiveMind a starting point for shaping
          explanations. You can take it now or continue with a balanced profile.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/assessment" className="am-btn am-btn-primary">
            Take assessment
          </Link>
          <button
            type="button"
            onClick={onUseBalancedProfile}
            className="am-btn am-btn-secondary"
          >
            Continue with balanced profile
          </button>
        </div>
      </motion.div>
    </motion.section>
  );
}
