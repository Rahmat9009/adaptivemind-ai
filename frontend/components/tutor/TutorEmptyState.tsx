"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
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
      className="mx-auto max-w-xl am-card p-8 text-center sm:p-10"
    >
      <motion.div variants={slideUp}>
        <p className="am-label text-[var(--am-text-muted)]">
          Learning DNA needed
        </p>
        <h1 className="am-heading-serif mt-3 text-2xl text-[var(--am-text-primary)]">
          Your tutor works best after the assessment.
        </h1>
        <p className="mt-4 leading-7 text-[var(--am-text-secondary)]">
          Your assessment gives AdaptiveMind a starting point for shaping
          explanations. You can take it now or continue with a balanced profile.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/assessment" color="primary" size="md">
            Take assessment
          </Button>
          <Button
            type="button"
            color="secondary"
            size="md"
            onClick={onUseBalancedProfile}
          >
            Continue with balanced profile
          </Button>
        </div>
      </motion.div>
    </motion.section>
  );
}
