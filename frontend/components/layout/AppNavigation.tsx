"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/am/Logo";

const routes = [
  { label: "Dashboard", href: "/dashboard", icon: "◈" },
  { label: "Tutor", href: "/tutor", icon: "▸" },
  { label: "Planner", href: "/planner", icon: "◇" },
  { label: "Assessment", href: "/assessment", icon: "○" },
  { label: "Learning DNA", href: "/assessment/results", icon: "✦" },
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar rail */}
      <nav
        aria-label="Primary"
        className="fixed left-0 top-0 z-[var(--am-z-nav)] hidden h-full w-16 flex-col items-center gap-2 border-r border-[var(--am-border-light)] bg-[var(--am-bg-surface)]/90 px-2 py-4 backdrop-blur-xl sm:flex lg:w-64 lg:items-stretch lg:px-4"
      >
        <Link
          href="/dashboard"
          className="mb-6 flex items-center justify-center py-2 lg:justify-start"
        >
          <Logo size={28} colored />
        </Link>

        <div className="flex flex-1 flex-col gap-1">
          {routes.map((route) => {
            const isActive = pathname === route.href;
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
                  className={`flex h-8 w-8 items-center justify-center rounded-[var(--am-radius-md)] text-base transition-colors ${
                    isActive
                      ? "bg-[var(--am-primary)] text-white"
                      : "text-[var(--am-text-muted)] group-hover:text-[var(--am-text-secondary)]"
                  }`}
                  aria-hidden="true"
                >
                  {route.icon}
                </span>
                <span className="hidden lg:inline">{route.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
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
                isActive
                  ? "text-[var(--am-primary)]"
                  : "text-[var(--am-text-muted)] hover:text-[var(--am-text-secondary)]"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-[var(--am-radius-sm)] text-sm ${
                  isActive ? "bg-[var(--am-primary-light)]" : ""
                }`}
                aria-hidden="true"
              >
                {route.icon}
              </span>
              {route.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
