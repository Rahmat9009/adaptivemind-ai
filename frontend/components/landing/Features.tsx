"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  BrainCircuit,
  BookOpen,
  FileText,
  Lightbulb,
  Eye,
  LineChart,
  WifiOff,
  Shield,
} from "lucide-react";
import { slideUp } from "@/lib/motion";

const features = [
  {
    icon: BrainCircuit,
    title: "Adaptive explanations",
    description: "Ada tries visual explanations, worked examples, analogies, stories, and challenges, adapting based on evidence from understanding checks.",
    example: "Ada noticed analogies help you most with abstract ideas.",
    color: "var(--am-dna-analogies)",
  },
  {
    icon: BookOpen,
    title: "Learn from any topic",
    description: "Ask about mathematics, science, programming, humanities, languages, and more.",
    example: "“Explain how markets reach equilibrium.”",
    color: "var(--am-primary)",
  },
  {
    icon: FileText,
    title: "Learn from your own materials",
    description: "Upload a PDF, DOCX, PPTX, image, or link and ask Ada to explain, summarize, or quiz you.",
    example: "“Quiz me using only pages 4–8 of this PDF.”",
    color: "var(--am-dna-visual)",
  },
  {
    icon: Lightbulb,
    title: "Understanding, not passive reading",
    description: "Build mastery through Explain Back, progressive hints, and quick recall quizzes.",
    example: "“Explain what you understood in your own words.”",
    color: "var(--am-dna-examples)",
  },
  {
    icon: Eye,
    title: "Visual and interactive learning",
    description: "Complex concepts are broken down into diagrams, cycles, timelines, and process animations.",
    example: "Step-by-step visual of the ATP energy cycle.",
    color: "var(--am-dna-visual)",
  },
  {
    icon: LineChart,
    title: "Learning memory",
    description: "Ada remembers your explanation history and schedules meaningful spaced reviews.",
    example: "“Time to review Binary Search based on your last lesson.”",
    color: "var(--am-dna-examples)",
  },
  {
    icon: WifiOff,
    title: "Offline study",
    description: "Access your saved lessons, study planner, and generated revision sheets anywhere.",
    example: "Export a lesson as an Offline Study Pack.",
    color: "var(--am-earth-dark)",
  },
  {
    icon: Shield,
    title: "Privacy-first",
    description: "No account required. Your data is stored locally on your device with transparent export and reset controls.",
    example: "All mastery evidence lives entirely in your browser.",
    color: "var(--am-success)",
  },
];

export function Features() {
  return (
    <section id="features" className="relative isolate overflow-hidden bg-[var(--am-bg)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      {/* Subtle top boundary */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--am-border)] to-transparent" />

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={slideUp}
          className="max-w-2xl mb-16"
        >
          <p className="am-label text-[var(--am-primary)]/70">
            Why AdaptiveMind?
          </p>
          <h2 className="am-heading-serif mt-4 text-3xl text-[var(--am-text-primary)] sm:text-4xl">
            A learning companion that adapts to you.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--am-text-secondary)]">
            Explore how Ada personalizes your learning experience, from teaching approaches to memory tracking.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={slideUp}
                className="am-card p-6 flex flex-col h-full"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--am-warm-bg)] border border-[var(--am-border-light)]">
                  <Icon size={20} style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold text-[var(--am-text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--am-text-secondary)] mb-4 flex-grow">
                  {feature.description}
                </p>
                <div className="mt-auto border-t border-[var(--am-border-light)] pt-4">
                  <p className="text-xs font-medium italic text-[var(--am-text-muted)]">
                    {feature.example}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={slideUp}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-serif text-[var(--am-text-primary)] mb-6">
            Ready to find your learning style?
          </h3>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/tutor" className="am-btn am-btn-primary text-white w-full sm:w-auto">
              Try Ada with any topic
            </Link>
            <Link href="/assessment" className="am-btn am-btn-secondary text-[var(--am-text-primary)] w-full sm:w-auto">
              Discover your Learning DNA
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
