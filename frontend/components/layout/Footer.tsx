import Link from "next/link";
import { Logo } from "@/components/am/Logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--am-border-light)] bg-[var(--am-bg)]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <Logo size={22} colored compact />
              <span className="font-[var(--font-editorial)] text-sm font-semibold text-[var(--am-text-primary)]">
                AdaptiveMind AI
              </span>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[var(--am-text-muted)]">
              Learning adapts to you, not the other way around.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[var(--am-text-secondary)]"
          >
            <Link
              href="/dashboard"
              className="min-h-11 content-center transition-colors hover:text-[var(--am-text-primary)]"
            >
              Dashboard
            </Link>
            <Link
              href="/tutor"
              className="min-h-11 content-center transition-colors hover:text-[var(--am-text-primary)]"
            >
              Tutor
            </Link>
            <Link
              href="/planner"
              className="min-h-11 content-center transition-colors hover:text-[var(--am-text-primary)]"
            >
              Planner
            </Link>
            <Link
              href="/privacy"
              className="min-h-11 content-center transition-colors hover:text-[var(--am-text-primary)]"
            >
              Privacy
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-[var(--am-border-light)] pt-5">
          <p className="text-xs text-[var(--am-text-muted)]">
            &copy; {new Date().getFullYear()} AdaptiveMind AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
