"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { slideUp } from "@/lib/motion";

const modes = [
  { id: "visual", label: "Visual", color: "var(--am-dna-visual)", content: "When light hits a leaf, chlorophyll molecules capture photons — tiny packets of solar energy. This energy splits water molecules, releasing oxygen. The remaining hydrogen and carbon dioxide combine to form glucose: the plant's fuel." },
  { id: "examples", label: "Examples", color: "var(--am-dna-examples)", content: "A maple tree absorbs sunlight through its broad leaves. In one sunny day, a medium-sized maple can produce about 60 grams of glucose — enough to power its growth, repair damaged cells, and store energy for the night." },
  { id: "analogies", label: "Analogies", color: "var(--am-dna-analogies)", content: 'Think of a leaf as a small solar-powered kitchen. Sunlight is your electricity, water and CO₂ are your ingredients, and the chlorophyll is your chef. The chef uses solar electricity to chop water into hydrogen and oxygen, then mixes hydrogen with CO₂ to bake glucose — the plant\'s meal.' },
  { id: "stories", label: "Stories", color: "var(--am-dna-stories)", content: "Deep in a sunlit forest, a single oak leaf begins its day. As dawn breaks, thousands of chlorophyll molecules stir to life, catching photons like tiny solar panels. Water pulses up from the roots. Carbon dioxide drifts in through tiny pores. By sunset, the leaf has turned sunlight into food — and released the oxygen we breathe." },
  { id: "challenges", label: "Challenges", color: "var(--am-dna-challenges)", content: "A plant needs 18 glucose molecules to build a new leaf. If each chlorophyll molecule processes 3 photons per second, and the leaf absorbs 2 × 10¹⁶ photons per hour, how many minutes does it take for the leaf to produce enough glucose to grow? (Hint: each glucose molecule needs 18 photons.)" },
];

export function Features() {
  const [activeMode, setActiveMode] = useState("analogies");

  return (
    <section className="relative isolate overflow-hidden bg-[var(--am-bg)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      {/* Subtle top boundary */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--am-border)] to-transparent" />

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={slideUp}
          className="max-w-2xl"
        >
          <p className="am-label text-[var(--am-primary)]/70">
            One topic, five approaches
          </p>
          <h2 className="am-heading-serif mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] text-[var(--am-text-primary)]">
            The same concept, explained five ways.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--am-text-secondary)]">
            Ada observes which explanation approaches help you understand, then adapts to what works best for your current topic.
          </p>
        </motion.div>

        {/* Mode selectors */}
        <div className="mt-10 flex flex-wrap gap-2">
          {modes.map((mode) => (
            <Button
              key={mode.id}
              color={activeMode === mode.id ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveMode(mode.id)}
              className={activeMode !== mode.id ? "hover:border-[var(--am-border)]" : ""}
              style={activeMode === mode.id ? { backgroundColor: mode.color, borderColor: mode.color } : {}}
            >
              {mode.label}
            </Button>
          ))}
        </div>

        {/* Content area that visibly changes */}
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]"
        >
          {/* Left: topic title + explanation */}
          <div className="am-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: modes.find(m => m.id === activeMode)?.color }}
              />
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: modes.find(m => m.id === activeMode)?.color }}>
                {modes.find(m => m.id === activeMode)?.label} explanation
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--am-text-primary)] mb-3">Photosynthesis</h3>
            <p className="text-base leading-7 text-[var(--am-text-secondary)]">
              {modes.find(m => m.id === activeMode)?.content}
            </p>
          </div>

          {/* Right: Visual representation differences per mode */}
          <div className="am-card p-8 flex items-center justify-center min-h-[200px]">
            {activeMode === "visual" && (
              <div className="text-center">
                <svg viewBox="0 0 200 140" className="w-full max-w-[200px] mx-auto" aria-label="Visual diagram of photosynthesis">
                  <circle cx="100" cy="20" r="18" fill="#FBBF24" opacity="0.8" />
                  <text x="100" y="24" textAnchor="middle" fontSize="8" fill="#0D0B0B">Sun</text>
                  <path d="M100 38 L80 70" stroke="#1751EF" strokeWidth="1.5" strokeDasharray="3 2" />
                  <path d="M100 38 L120 70" stroke="#1751EF" strokeWidth="1.5" strokeDasharray="3 2" />
                  <rect x="65" y="70" width="70" height="40" rx="8" fill="#E8EEFE" stroke="#1751EF" strokeWidth="1" />
                  <text x="100" y="88" textAnchor="middle" fontSize="8" fill="#1751EF">Chlorophyll</text>
                  <text x="100" y="100" textAnchor="middle" fontSize="7" fill="#6F6F6F">absorbs photons</text>
                  <path d="M100 110 L100 130" stroke="#0D0B0B" strokeWidth="1" />
                  <path d="M70 130 L130 130" stroke="#0D0B0B" strokeWidth="1" />
                  <text x="40" y="127" textAnchor="middle" fontSize="7" fill="#059669">CO₂</text>
                  <text x="160" y="127" textAnchor="middle" fontSize="7" fill="#0891B2">H₂O</text>
                  <text x="100" y="140" textAnchor="middle" fontSize="8" fill="#A1543C">Glucose + O₂</text>
                </svg>
              </div>
            )}
            {activeMode === "examples" && (
              <div className="text-center text-[var(--am-text-secondary)]">
                <p className="text-sm font-semibold text-[var(--am-dna-examples)] mb-2">Example breakdown</p>
                <ol className="text-sm text-left space-y-2">
                  <li className="flex gap-2"><span className="font-semibold text-[var(--am-dna-examples)]">1.</span> Maple tree absorbs sunlight</li>
                  <li className="flex gap-2"><span className="font-semibold text-[var(--am-dna-examples)]">2.</span> Produces ~60g glucose per day</li>
                  <li className="flex gap-2"><span className="font-semibold text-[var(--am-dna-examples)]">3.</span> Uses glucose for growth &amp; repair</li>
                  <li className="flex gap-2"><span className="font-semibold text-[var(--am-dna-examples)]">4.</span> Stores remainder for nighttime</li>
                </ol>
              </div>
            )}
            {activeMode === "analogies" && (
              <div className="w-full grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <p className="font-semibold text-[var(--am-dna-analogies)] mb-2">Concept</p>
                  <p className="text-[var(--am-text-secondary)]">Chlorophyll</p>
                  <p className="text-[var(--am-text-secondary)]">Photon</p>
                  <p className="text-[var(--am-text-secondary)]">Water split</p>
                  <p className="text-[var(--am-text-secondary)]">Glucose</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--am-dna-analogies)] mb-2">Analogous to</p>
                  <p className="text-[var(--am-text-secondary)]">Chef</p>
                  <p className="text-[var(--am-text-secondary)]">Electricity</p>
                  <p className="text-[var(--am-text-secondary)]">Chopping</p>
                  <p className="text-[var(--am-text-secondary)]">A meal</p>
                </div>
              </div>
            )}
            {activeMode === "stories" && (
              <div className="text-center text-[var(--am-text-secondary)] max-w-xs">
                <p className="text-sm italic leading-relaxed">
                  &ldquo;Deep in a sunlit forest, a single oak leaf begins its day, catching photons like tiny solar panels.&rdquo;
                </p>
              </div>
            )}
            {activeMode === "challenges" && (
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--am-dna-challenges)] mb-3">Solve this</p>
                <div className="bg-[var(--am-warm-bg)] rounded-[var(--am-radius-lg)] p-4 text-sm text-[var(--am-text-secondary)] max-w-xs">
                  <p className="mb-2">A leaf absorbs 2 × 10¹⁶ photons/hour</p>
                  <p className="mb-2">Each glucose needs 18 photons</p>
                  <p className="text-[var(--am-dna-challenges)] font-medium mt-3">How many minutes to make 18 glucose?</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
