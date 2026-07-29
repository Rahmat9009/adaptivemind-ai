"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { LearningDimension } from "@/lib/learning-dna";
import { learningDimensionLabels } from "@/lib/learning-dna";
import { fadeIn } from "@/lib/motion";

function confidenceLabel(evidenceCount: number): string {
  if (evidenceCount < 2) return "Limited evidence";
  if (evidenceCount < 6) return "Developing evidence";
  return "Established evidence";
}

export interface NextLearningActionData {
  label: string;
  topic: string;
  reason: string;
  href: string;
}

export function NextLearningAction({
  action,
  approach,
  approachReason,
  evidenceCount,
}: {
  action: NextLearningActionData;
  approach: LearningDimension;
  approachReason: string;
  evidenceCount: number;
}) {
  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6 sm:p-7"
      aria-labelledby="next-action-title"
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="am-label text-[var(--am-primary)]">
            Recommended next
          </p>
          <h2
            id="next-action-title"
            className="am-heading-serif mt-2 text-2xl text-[var(--am-text-primary)]"
          >
            {action.topic}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[var(--am-text-secondary)]">
            {action.label}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--am-text-secondary)]">
            {action.reason}
          </p>
          <Link href={action.href} className="am-btn am-btn-primary mt-5">
            Continue
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="border-l-4 border-[var(--am-dna-visual)] bg-[var(--am-bg-reading)] px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--am-text-primary)]">
            <Sparkles size={16} aria-hidden="true" />
            Why this mode?
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--am-primary)]">
            {learningDimensionLabels[approach]}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--am-text-secondary)]">
            {approachReason}
          </p>
          <p className="mt-3 text-xs font-medium text-[var(--am-text-muted)]">
            {confidenceLabel(evidenceCount)} - {evidenceCount} observation
            {evidenceCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
