import Link from "next/link";
import { calculatePlanSummary, type StudyPlan } from "@/lib/study-planner";

export function StudyPlanCard({ plan }: { plan: StudyPlan | null }) {
  if (!plan) {
    return (
      <section
        aria-labelledby="plan-card-title"
        className="rounded-[2rem] border border-dashed border-ink-900/15 bg-paper-100/60 p-6 sm:p-7"
      >
        <p className="eyebrow-num text-ink-500">Study plan</p>
        <h2 id="plan-card-title" className="font-display mt-3 text-2xl text-ink-950">Turn progress into a journey.</h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Ada builds a focused, day-by-day study plan from your recent lessons and current Learning DNA.
        </p>
        <Link href="/planner" className="mt-5 inline-flex text-sm font-semibold text-accent-700">
          Build my study plan →
        </Link>
      </section>
    );
  }
  const summary = calculatePlanSummary(plan);
  const day = plan.days.find((item) => item.tasks.some((task) => !task.completed)) ?? plan.days[0];
  const next = day?.tasks.find((task) => !task.completed);
  return (
    <section
      aria-labelledby="plan-card-title"
      className="relative overflow-hidden rounded-[2rem] p-6 sm:p-7"
      style={{
        background: "linear-gradient(160deg, rgba(167,139,250,0.10), var(--color-paper-50) 70%)",
        border: "1px solid rgba(167,139,250,0.25)",
      }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow-num text-dna-analogies">Study plan</p>
        <span className="font-mono text-xs text-ink-500">Day {day?.dayNumber} of {plan.durationDays}</span>
      </div>
      <h2 id="plan-card-title" className="font-display mt-3 text-2xl text-ink-950">{day?.focus}</h2>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>{summary.completedTasks}/{summary.totalTasks} tasks</span>
          <span className="font-mono font-semibold text-ink-950">{summary.percentage}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-900/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-dna-analogies to-dna-visual transition-all duration-700"
            style={{ width: `${summary.percentage}%` }}
          />
        </div>
      </div>

      {next ? (
        <p className="mt-5 text-sm text-ink-700">
          <span className="eyebrow-num text-ink-500">Next up </span>
          <span className="font-medium text-ink-950">{next.type.replace("-", " ")}</span>
          {" · "}
          {next.topic}
          <span className="text-ink-500"> · {next.minutes} min</span>
        </p>
      ) : null}

      <Link href="/planner" className="mt-5 inline-flex text-sm font-semibold text-dna-analogies">
        Open the full plan →
      </Link>
    </section>
  );
}
