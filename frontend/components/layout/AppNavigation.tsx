"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/am/Logo";

const routes = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tutor", href: "/tutor" },
  { label: "Planner", href: "/planner" },
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar rail */}
      <nav
        aria-label="Primary navigation"
        className="fixed left-0 top-0 z-[var(--am-z-nav)] hidden h-full w-16 flex-col items-center gap-1 border-r border-[var(--am-border-light)] bg-[var(--am-surface)]/95 px-2 py-4 backdrop-blur-xl sm:flex lg:w-56 lg:items-stretch lg:px-3"
      >
        <Link href="/dashboard" className="mb-6 flex items-center justify-center py-3 lg:justify-start lg:px-2" aria-label="AdaptiveMind Dashboard Home">
          <Logo size={24} colored compact />
        </Link>

        <div className="flex flex-1 flex-col gap-0.5">
          {routes.map((route) => {
            const isActive = pathname === route.href || (route.href === "/assessment/results" && pathname === "/assessment/results");
            return (
              <Link
                key={route.href}
                href={route.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-[var(--am-radius-lg)] px-3 py-2.5 text-sm font-medium transition-all duration-[var(--am-duration-quick)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--am-primary)] ${
                  isActive
                    ? "bg-[var(--am-primary-light)] text-[var(--am-primary)]"
                    : "text-[var(--am-text-secondary)] hover:bg-[var(--am-warm-bg)] hover:text-[var(--am-text-primary)]"
                }`}
              >
                <span className="hidden lg:inline">{route.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-[var(--am-border-light)] w-full">
          <Link
            href="/assessment"
            className="flex items-center justify-center lg:justify-start gap-2 rounded-[var(--am-radius-lg)] px-3 py-2.5 text-sm font-medium text-[var(--am-text-secondary)] hover:bg-[var(--am-warm-bg)] hover:text-[var(--am-text-primary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden lg:inline">Assessment</span>
          </Link>
          <Link
            href="/assessment/results"
            className="flex items-center justify-center lg:justify-start gap-2 rounded-[var(--am-radius-lg)] px-3 py-2.5 text-sm font-medium text-[var(--am-text-secondary)] hover:bg-[var(--am-warm-bg)] hover:text-[var(--am-text-primary)] transition-colors mt-0.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="hidden lg:inline">Learning DNA</span>
          </Link>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-0 left-0 right-0 z-[var(--am-z-nav)] flex items-center justify-around border-t border-[var(--am-border-light)] bg-[var(--am-surface)]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl sm:hidden"
      >
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-[var(--am-radius-md)] px-2 py-1 text-xs font-medium transition-colors ${
                isActive ? "text-[var(--am-primary)]" : "text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]"
              }`}
            >
              {route.label}
            </Link>
          );
        })}
        <Link
          href="/assessment"
          aria-label="Assessment"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-[var(--am-radius-md)] px-2 py-1 text-xs font-medium transition-colors ${
            pathname === "/assessment" ? "text-[var(--am-primary)]" : "text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]"
          }`}
        >
          Assess
        </Link>
      </nav>
    </>
  );
}
