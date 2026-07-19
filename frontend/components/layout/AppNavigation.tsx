"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/am/Logo";

const navIcon = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  tutor: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  planner: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  assessment: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "learning-dna": "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
};

const routes = [
  { label: "Dashboard", href: "/dashboard", icon: navIcon.dashboard },
  { label: "Tutor", href: "/tutor", icon: navIcon.tutor },
  { label: "Planner", href: "/planner", icon: navIcon.planner },
  { label: "Assessment", href: "/assessment", icon: navIcon.assessment },
  { label: "Learning DNA", href: "/assessment/results", icon: navIcon["learning-dna"] },
];

function NavIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar rail */}
      <nav
        aria-label="Primary navigation"
        className="fixed left-0 top-0 z-[var(--am-z-nav)] hidden h-full w-16 flex-col items-center gap-2 border-r border-[var(--am-border-light)] bg-[var(--am-bg-surface)]/90 px-2 py-4 backdrop-blur-xl sm:flex lg:w-64 lg:items-stretch lg:px-4"
      >
        <Link href="/dashboard" className="mb-6 flex items-center justify-center py-2 lg:justify-start" aria-label="AdaptiveMind Dashboard Home">
          <Logo size={26} colored />
        </Link>

        <div className="flex flex-1 flex-col gap-1">
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
                    : "text-[var(--am-text-secondary)] hover:bg-white/60 hover:text-[var(--am-text-primary)]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-[var(--am-radius-md)] transition-colors ${
                    isActive ? "bg-[var(--am-primary)] text-white" : "text-[var(--am-text-muted)] group-hover:text-[var(--am-text-secondary)]"
                  }`}
                  aria-hidden="true"
                >
                  <NavIcon path={route.icon} />
                </span>
                <span className="hidden lg:inline">{route.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-0 left-0 right-0 z-[var(--am-z-nav)] flex items-center justify-around border-t border-[var(--am-border-light)] bg-[var(--am-bg-surface)]/95 px-2 pb-safe-or-2 pt-2 backdrop-blur-xl sm:hidden"
      >
        {routes.slice(0, 4).map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-[var(--am-radius-md)] px-3 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-[var(--am-primary)]" : "text-[var(--am-text-muted)] hover:text-[var(--am-text-secondary)]"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-[var(--am-radius-sm)] ${isActive ? "bg-[var(--am-primary-light)]" : ""}`} aria-hidden="true">
                <NavIcon path={route.icon} />
              </span>
              {route.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
