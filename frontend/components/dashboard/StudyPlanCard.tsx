import Link from "next/link";
import {
  calculatePlanSummary,
  type StudyPlan,
} from "@/lib/study-planner";

export function StudyPlanCard({ plan }: { plan: StudyPlan | null }) {
  if (!plan) {
    return (
      <section className="rounded-[var(--am-radius-2xl)] border border-dashed border-[var(--am-border)] bg-[var(--am-bg-elevated)]/60 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--am-text-primary)]">
          My Study Plan
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--am-text-secondary)]">
          Turn your current learning progress into a realistic short-term plan.
        </p>
        <Link
          href="/planner"
          className="am-btn am-btn-primary mt-4 inline-flex"
        >
          Build my study plan
        </Link>
      </section>
    );
  }

  const summary = calculatePlanSummary(plan);
  const day =
    plan.days.find((item) => item.tasks.some((task) => !task.completed)) ??
    plan.days[0];
  const next = day?.tasks.find((task) => !task.completed);

  return (
    <section className="rounded-[var(--am-radius-2xl)] border border-[var(--am-border-light)] bg-[var(--am-bg-elevated)] p-6 shadow-[var(--am-shadow-sm)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--am-text-primary)]">
            My Study Plan
          </h2>
          <p className="mt-1 text-sm text-[var(--am-text-secondary)]">
            Day {day?.dayNumber}: {day?.focus}
          </p>
        </div>
        <span className="rounded-[var(--am-radius-md)] bg-[var(--am-primary-light)] px-3 py-1 text-sm font-semibold text-[var(--am-primary)]">
          {summary.percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="am-progress-track mt-4">
        <div
          className="am-progress-fill"
          style={{ width: `${summary.percentage}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-[var(--am-text-secondary)]">
          {summary.completedTasks}/{summary.totalTasks} tasks &middot;{" "}
          {summary.completedMinutes}/{summary.totalMinutes} min
        </p>
        {next && (
          <p className="text-sm text-[var(--am-text-muted)]">
            Next:{" "}
            <span className="font-medium text-[var(--am-text-secondary)]">
              {next.type.replace("-", " ")}
            </span>
          </p>
        )}
      </div>

      <Link
        href="/planner"
        className="am-btn am-btn-ghost mt-4 inline-flex"
      >
        Open plan →
      </Link>
    </section>
  );
}
