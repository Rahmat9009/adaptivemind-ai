"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { fadeIn } from "@/lib/motion";

export function PrivacySummary() {
  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="am-card p-6 sm:p-7"
      aria-labelledby="privacy-title"
    >
      <div className="flex items-start gap-4">
        <ShieldCheck
          size={21}
          className="mt-0.5 shrink-0 text-[var(--am-primary)]"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2
            id="privacy-title"
            className="am-heading-serif text-lg text-[var(--am-text-primary)]"
          >
            Privacy &amp; local data
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--am-text-secondary)]">
            Learning records and saved lessons stay in this browser. Live Ada
            requests send the submitted prompt and selected context to the
            configured AI provider.
          </p>
          <Link
            href="/privacy"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--am-primary)] hover:text-[var(--am-primary-hover)]"
          >
            Privacy details and data controls
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
