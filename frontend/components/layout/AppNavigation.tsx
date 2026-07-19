"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tutor", href: "/tutor" },
  { label: "Planner", href: "/planner" },
  { label: "Assessment", href: "/assessment" },
];

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/8 bg-paper-50/85 backdrop-blur-xl">
      <nav
        aria-label="Application navigation"
        className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4 sm:px-8 lg:px-12"
      >
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 text-base font-semibold tracking-tight text-ink-950"
        >
          <span className="relative inline-flex h-6 w-6 items-center justify-center">
            <span className="absolute h-1.5 w-1.5 rounded-full bg-dna-visual" style={{ transform: "translate(-4px,-2px)" }} />
            <span className="absolute h-1.5 w-1.5 rounded-full bg-dna-analogies" style={{ transform: "translate(4px,0px)" }} />
            <span className="absolute h-1.5 w-1.5 rounded-full bg-dna-stories" style={{ transform: "translate(-1px,4px)" }} />
          </span>
          <span className="font-display">AdaptiveMind</span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-ink-950 text-paper-50"
                    : "text-ink-600 hover:bg-ink-900/5 hover:text-ink-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
