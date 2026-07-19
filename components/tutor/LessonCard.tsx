import { learningDimensionLabels, type LearningDimension } from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";
import type { TutorApiResponse } from "@/lib/ai/types";

interface LessonCardProps {
  response: TutorApiResponse;
}

const actionLabel: Record<TutorApiResponse["action"], string> = {
  initial: "Personalized lesson",
  simpler: "Simplified",
  different: "A different lens",
  example: "Worked example",
  challenge: "Reasoning challenge",
};

/**
 * The lesson card changes its editorial layout based on which DNA dimension
 * leads the response. This is the visual core of the adaptive tutor: the same
 * content shape doesn't fit every learner, so the card itself adapts.
 */
export function LessonCard({ response }: LessonCardProps) {
  const { lesson, source, action } = response;
  const lead: LearningDimension = lesson.stylesUsed[0] ?? "visual";
  const leadColor = dnaHex[lead];
  const isChallenge = Boolean(lesson.challenge) || action === "challenge";
  const isExample = Boolean(lesson.practicePrompt) || action === "example";
  const isDifferent = action === "different";

  return (
    <article
      className="surface-paper relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
      aria-labelledby="lesson-title"
      style={{ boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 50px -30px ${leadColor}55, 0 0 0 1px ${leadColor}22` }}
    >
      {/* Lead-dimension accent rail */}
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: leadColor }} />

      <div className="pl-2">
        {/* Meta row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: leadColor, boxShadow: `0 0 10px ${leadColor}` }} />
            <span className="eyebrow-num text-ink-500">{actionLabel[action]}</span>
            <span className="text-ink-300">·</span>
            <span className="text-xs text-ink-600">
              {isDifferent ? `Reframed via ${lesson.stylesUsed.map((s) => learningDimensionLabels[s]).join(" + ")}` : `Ada weighted ${lesson.stylesUsed.map((s) => learningDimensionLabels[s]).join(" + ")}`}
            </span>
          </div>
          {source === "demo" ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-sky-800">Demo</span>
          ) : null}
        </div>

        <h2 id="lesson-title" className="font-display mt-4 text-3xl leading-tight tracking-tight text-ink-950 sm:text-4xl">
          {lesson.title}
        </h2>

        {/* Core idea — always presented as the thesis line */}
        <section className="mt-6">
          <p className="eyebrow-num text-ink-500">Core idea</p>
          <p className="font-display mt-2 text-xl leading-7 text-ink-900">{lesson.coreIdea}</p>
        </section>

        {/* Mode-distinct body — the layout changes based on the lead dimension */}
        {isChallenge ? (
          <ChallengeLayout lesson={lesson} color={leadColor} />
        ) : isExample ? (
          <ExampleLayout lesson={lesson} color={leadColor} />
        ) : lead === "analogies" ? (
          <AnalogyLayout lesson={lesson} color={leadColor} />
        ) : lead === "stories" ? (
          <StoryLayout lesson={lesson} color={leadColor} />
        ) : lead === "visual" ? (
          <VisualLayout lesson={lesson} color={leadColor} />
        ) : (
          <DefaultLayout lesson={lesson} color={leadColor} />
        )}

        {/* Key points — numbered editorial list */}
        <section className="mt-8">
          <p className="eyebrow-num text-ink-500">Key points</p>
          <ol className="mt-3 space-y-2.5">
            {lesson.keyPoints.map((point, i) => (
              <li key={point} className="flex gap-3 text-ink-700">
                <span className="font-mono pt-0.5 text-xs text-ink-400">{String(i + 1).padStart(2, "0")}</span>
                <span className="leading-6">{point}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Understanding check — midnight slab */}
        <section className="surface-midnight mt-8 rounded-2xl p-5 text-paper-50">
          <p className="eyebrow-num text-midnight-300">Understanding check</p>
          <p className="mt-2 leading-7 text-paper-50">{lesson.checkQuestion}</p>
        </section>
      </div>
    </article>
  );
}

/* ---------- Mode-distinct layouts ---------- */

function DefaultLayout({ lesson, color }: { lesson: TutorApiResponse["lesson"]; color: string }) {
  return (
    <section className="mt-6">
      <p className="eyebrow-num text-ink-500">How it works</p>
      <p className="mt-2 leading-7 text-ink-700">{lesson.explanation}</p>
      {lesson.analogy ? (
        <aside className="mt-5 rounded-2xl border p-5" style={{ borderColor: `${color}40`, background: `${color}0d` }}>
          <p className="eyebrow-num" style={{ color }}>Analogy</p>
          <p className="mt-2 leading-7 text-ink-800">{lesson.analogy}</p>
        </aside>
      ) : null}
      {lesson.example ? (
        <aside className="mt-4 rounded-2xl border border-ink-900/10 bg-paper-100/60 p-5">
          <p className="eyebrow-num text-ink-500">Example</p>
          <p className="mt-2 leading-7 text-ink-800">{lesson.example}</p>
        </aside>
      ) : null}
    </section>
  );
}

function VisualLayout({ lesson, color }: { lesson: TutorApiResponse["lesson"]; color: string }) {
  // Visual: present the explanation as a 3-stage labeled flow
  return (
    <section className="mt-6">
      <p className="eyebrow-num text-ink-500">Visual breakdown</p>
      <p className="mt-2 leading-7 text-ink-700">{lesson.explanation}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Inputs", "Change", "Outcome"].map((stage, i) => (
          <div key={stage} className="relative rounded-2xl border p-4" style={{ borderColor: `${color}33`, background: `${color}08` }}>
            <span className="font-mono text-xs" style={{ color }}>0{i + 1}</span>
            <p className="mt-1 font-display text-base text-ink-900">{stage}</p>
            <p className="mt-1 text-xs leading-5 text-ink-600">
              {i === 0 ? "Identify the starting conditions." : i === 1 ? "Trace what changes and why." : "Notice what the change produces."}
            </p>
            {i < 2 ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 sm:hidden">↓</span> : null}
          </div>
        ))}
      </div>
      {lesson.analogy ? (
        <aside className="mt-4 rounded-2xl border p-5" style={{ borderColor: `${color}40`, background: `${color}0d` }}>
          <p className="eyebrow-num" style={{ color }}>Analogy</p>
          <p className="mt-2 leading-7 text-ink-800">{lesson.analogy}</p>
        </aside>
      ) : null}
    </section>
  );
}

function AnalogyLayout({ lesson, color }: { lesson: TutorApiResponse["lesson"]; color: string }) {
  // Analogy: the analogy is the centerpiece, presented as a two-column mapping
  return (
    <section className="mt-6">
      <p className="eyebrow-num text-ink-500">How it works</p>
      <p className="mt-2 leading-7 text-ink-700">{lesson.explanation}</p>
      {lesson.analogy ? (
        <aside className="mt-5 rounded-2xl border p-6" style={{ borderColor: `${color}45`, background: `linear-gradient(160deg, ${color}12, var(--color-paper-50) 75%)` }}>
          <p className="eyebrow-num" style={{ color }}>Useful analogy</p>
          <p className="font-display mt-3 text-xl leading-7 text-ink-900">{lesson.analogy}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-paper-50/70 p-3 text-sm text-ink-700">
              <p className="eyebrow-num text-ink-500">Familiar</p>
              <p className="mt-1">Something you already know</p>
            </div>
            <div className="rounded-xl p-3 text-sm text-ink-700" style={{ background: `${color}14` }}>
              <p className="eyebrow-num" style={{ color }}>New</p>
              <p className="mt-1">The idea you are learning</p>
            </div>
          </div>
        </aside>
      ) : null}
    </section>
  );
}

function StoryLayout({ lesson, color }: { lesson: TutorApiResponse["lesson"]; color: string }) {
  // Story: narrative frame — beginning, tension, outcome implied by the explanation
  return (
    <section className="mt-6">
      <p className="eyebrow-num text-ink-500">A short story</p>
      <div className="mt-3 rounded-2xl border-l-2 pl-5" style={{ borderColor: color }}>
        <p className="font-display text-lg italic leading-7 text-ink-800">{lesson.explanation}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {["Beginning", "Tension", "Outcome"].map((beat, i) => (
          <span key={beat} className="rounded-full px-3 py-1" style={{ background: `${color}14`, color }}>
            <span className="font-mono mr-1.5 opacity-60">0{i + 1}</span>{beat}
          </span>
        ))}
      </div>
      {lesson.example ? (
        <p className="mt-4 text-sm leading-6 text-ink-600"><span className="font-semibold text-ink-800">In practice: </span>{lesson.example}</p>
      ) : null}
    </section>
  );
}

function ExampleLayout({ lesson, color }: { lesson: TutorApiResponse["lesson"]; color: string }) {
  // Example: numbered worked steps, the example is the centerpiece
  return (
    <section className="mt-6">
      <p className="eyebrow-num text-ink-500">Worked example</p>
      <div className="mt-3 rounded-2xl border p-5" style={{ borderColor: `${color}40`, background: `${color}0a` }}>
        <p className="leading-7 text-ink-800">{lesson.explanation}</p>
        {lesson.example ? <p className="mt-3 leading-7 text-ink-800">{lesson.example}</p> : null}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {["Identify", "Apply", "Connect"].map((step, i) => (
          <div key={step} className="flex items-center gap-2 rounded-xl border border-ink-900/10 bg-paper-50 p-3 text-sm text-ink-700">
            <span className="font-mono text-xs" style={{ color }}>0{i + 1}</span>
            <span>{step} the idea</span>
          </div>
        ))}
      </div>
      {lesson.practicePrompt ? (
        <aside className="mt-4 rounded-2xl border border-dashed p-5" style={{ borderColor: `${color}50` }}>
          <p className="eyebrow-num" style={{ color }}>Try a similar one</p>
          <p className="mt-2 leading-7 text-ink-800">{lesson.practicePrompt}</p>
        </aside>
      ) : null}
    </section>
  );
}

function ChallengeLayout({ lesson, color }: { lesson: TutorApiResponse["lesson"]; color: string }) {
  // Challenge: the setup is minimal, the challenge itself is the centerpiece, hint is collapsible
  return (
    <section className="mt-6">
      <p className="eyebrow-num text-ink-500">Reasoning setup</p>
      <p className="mt-2 leading-7 text-ink-700">{lesson.explanation}</p>
      <aside className="mt-5 rounded-2xl border-2 p-6" style={{ borderColor: `${color}50`, background: `linear-gradient(160deg, ${color}10, var(--color-paper-50) 80%)` }}>
        <p className="eyebrow-num" style={{ color }}>Your challenge</p>
        <p className="font-display mt-3 text-xl leading-7 text-ink-900">{lesson.challenge}</p>
        {lesson.hint ? (
          <details className="mt-4 rounded-xl bg-paper-50/80 px-4 py-3 text-sm text-ink-700">
            <summary className="cursor-pointer font-medium text-ink-900">Optional hint</summary>
            <p className="mt-2 leading-6">{lesson.hint}</p>
          </details>
        ) : null}
      </aside>
    </section>
  );
}
