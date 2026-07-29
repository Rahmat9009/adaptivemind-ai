"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Dna } from "lucide-react";
import { Logo } from "@/components/am/Logo";
import { getUnsavedChangesMessage } from "@/hooks/useUnsavedChanges";
import {
  isRouteActive,
  primaryNavigationRoutes,
} from "./navigation";

export function AppNavigation() {
  const pathname = usePathname();

  function confirmNavigation(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (
      isRouteActive(pathname, href)
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }
    const message = getUnsavedChangesMessage();
    if (
      message
      && !window.confirm(`${message}\n\nLeave this page anyway?`)
    ) {
      event.preventDefault();
    }
  }

  return (
    <>
      {/* Desktop sidebar rail */}
      <nav
        aria-label="Primary navigation"
        className="fixed left-0 top-0 z-[var(--am-z-nav)] hidden h-full w-16 flex-col items-center gap-1 border-r border-[var(--am-border-light)] bg-[var(--am-surface)]/95 px-2 py-4 backdrop-blur-xl sm:flex lg:w-56 lg:items-stretch lg:px-3"
      >
        <Link
          href="/"
          onClick={(event) => confirmNavigation(event, "/")}
          className="mb-6 flex items-center justify-center py-3 lg:justify-start lg:px-2"
          aria-label="AdaptiveMind Home"
        >
          <Logo size={24} colored compact />
        </Link>

        <div className="flex flex-1 flex-col gap-0.5">
          {primaryNavigationRoutes.map((route) => {
            const isActive = isRouteActive(pathname, route.href);
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={(event) => confirmNavigation(event, route.href)}
                aria-current={isActive ? "page" : undefined}
                title={route.label}
                className={`group flex items-center gap-3 rounded-[var(--am-radius-lg)] px-3 py-2.5 text-sm font-medium transition-all duration-[var(--am-duration-quick)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--am-primary)] ${
                  isActive
                    ? "bg-[var(--am-primary-light)] text-[var(--am-primary)]"
                    : "text-[var(--am-text-secondary)] hover:bg-[var(--am-warm-bg)] hover:text-[var(--am-text-primary)]"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="hidden lg:inline">{route.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-[var(--am-border-light)] w-full">
          <Link
            href="/assessment"
            onClick={(event) => confirmNavigation(event, "/assessment")}
            aria-current={pathname.startsWith("/assessment") ? "page" : undefined}
            className={`flex items-center justify-center gap-2 rounded-[var(--am-radius-lg)] px-3 py-2.5 text-sm font-medium transition-colors lg:justify-start ${
              pathname.startsWith("/assessment")
                ? "bg-[var(--am-primary-light)] text-[var(--am-primary)]"
                : "text-[var(--am-text-secondary)] hover:bg-[var(--am-warm-bg)] hover:text-[var(--am-text-primary)]"
            }`}
          >
            <Dna size={17} strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden lg:inline">Learning DNA</span>
          </Link>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-0 left-0 right-0 z-[var(--am-z-nav)] flex items-center justify-around border-t border-[var(--am-border-light)] bg-[var(--am-surface)]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl sm:hidden"
      >
        {primaryNavigationRoutes.map((route) => {
          const isActive = isRouteActive(pathname, route.href);
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={(event) => confirmNavigation(event, route.href)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-[var(--am-radius-md)] px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-[var(--am-primary)]" : "text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
