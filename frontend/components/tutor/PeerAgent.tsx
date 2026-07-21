"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeIn } from "@/lib/motion";

export type PeerAgentState = "prompt" | "active" | "complete";

export interface PeerAgentMessage {
  role: "peer" | "learner";
  content: string;
}

const MAX_TURNS = 6;

// Peer prompts for the AI classmate's progression (kept for reference)
// const PEER_PROMPTS = [...];

export function PeerAgent({
  topic,
  state,
  isLoading,
  error,
  messages,
  onStart,
  onSubmit,
  onComplete,
}: {
  topic: string;
  state: PeerAgentState;
  isLoading: boolean;
  error: string | null;
  messages: PeerAgentMessage[];
  onStart: () => void;
  onSubmit: (explanation: string) => void;
  onComplete: () => void;
}) {
  const [input, setInput] = useState("");
  const turnCount = messages.filter((m) => m.role === "learner").length;
  const isComplete = turnCount >= MAX_TURNS;

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mt-6 rounded-[var(--am-radius-xl)] border border-[var(--am-border-light)] bg-[var(--am-warm-bg)] p-5 sm:p-6"
      role="region"
      aria-label="Peer agent mode"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-[var(--am-radius-md)] bg-[var(--am-primary)]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--am-primary)]">
          Peer agent
        </span>
        <span className="text-xs text-[var(--am-text-muted)]">
          Teach a classmate
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
        Explaining a concept to someone else is one of the most effective ways
        to solidify your own understanding.
      </p>

      {/* Prompt state */}
      {state === "prompt" && (
        <button
          type="button"
          onClick={onStart}
          className="am-btn am-btn-secondary mt-3 py-1.5 px-3 text-sm"
        >
          Start peer session
        </button>
      )}

      {/* Active state */}
      {state === "active" && (
        <div className="mt-3 space-y-3">
          {/* Turn counter */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--am-text-muted)]">
            <span>
              Turn {turnCount}/{MAX_TURNS}
            </span>
            <div className="flex-1 h-1 rounded-full bg-[var(--am-surface)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--am-primary)]/40 transition-all"
                style={{ width: `${(turnCount / MAX_TURNS) * 100}%` }}
              />
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-[var(--am-radius-lg)] p-3 text-sm leading-6 ${
                  msg.role === "peer"
                    ? "bg-[var(--am-earth-light)] text-[var(--am-earth-dark)] border border-[var(--am-earth-accent)]/20"
                    : "bg-[var(--am-surface)] text-[var(--am-text-secondary)] border border-[var(--am-border-light)]"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--am-text-muted)] mb-1">
                  {msg.role === "peer" ? "Classmate (AI)" : "You"}
                </p>
                {msg.content}
              </motion.div>
            ))}
          </div>

          {/* Input */}
          {!isComplete && !isLoading && (
            <div className="flex items-start gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Explain this to your classmate…"
                className="min-h-[60px] flex-1 resize-none rounded-[var(--am-radius-md)] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-2.5 text-sm leading-5 text-[var(--am-text-primary)] placeholder:text-[var(--am-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--am-primary)]/30"
                aria-label="Your explanation to the peer"
              />
            </div>
          )}

          {isLoading && (
            <p className="text-xs text-[var(--am-text-muted)] italic">
              Your classmate is thinking…
            </p>
          )}

          {/* Submit */}
          {!isComplete && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (input.trim()) {
                    onSubmit(input.trim());
                    setInput("");
                  }
                }}
                disabled={!input.trim() || isLoading}
                className="rounded-[var(--am-radius-md)] bg-[var(--am-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Send
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="text-xs font-medium text-[var(--am-text-muted)] hover:text-[var(--am-text-secondary)] transition-colors"
              >
                End session
              </button>
            </div>
          )}

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[var(--am-radius-lg)] border border-[var(--am-success)]/20 bg-[var(--am-success-light)] p-3"
            >
              <p className="text-sm font-semibold text-[var(--am-success)]">
                Session complete
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--am-text-secondary)]">
                You explained {topic} across {turnCount} turns. Teaching
                others is a powerful way to reinforce your own understanding.
              </p>
              <button
                type="button"
                onClick={onComplete}
                className="am-btn am-btn-secondary mt-2 py-1.5 px-3 text-sm"
              >
                Return to lesson
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Complete state */}
      {state === "complete" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3"
        >
          <p className="text-sm text-[var(--am-text-secondary)]">
            Peer session ended. You completed {turnCount} turns explaining{' '}
            <strong>{topic}</strong>.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="am-btn am-btn-secondary mt-2 py-1.5 px-3 text-sm"
          >
            Start another session
          </button>
        </motion.div>
      )}

      {error && (
        <p className="mt-2 text-xs text-[var(--am-error)]" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
