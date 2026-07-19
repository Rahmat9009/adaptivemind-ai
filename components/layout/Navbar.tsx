"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Mode = "marketing" | "app";

const marketingItems = [
  { label: "Approach", href: "#approach" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Tutor", href: "#preview" },
];

const appItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tutor", href: "/tutor" },
  { label: "Planner", href: "/planner" },
  { label: "Assessment", href: "/assessment" },
];

export function Navbar({ mode = "marketing" }: { mode?: Mode }) {
  const pathname = usePathname();
  const items = mode === "marketing" ? marketingItems : appItems;
  const isInApp = mode === "app" || pathname.startsWith("/dashboard") || pathname.startsWith("/tutor") || pathname.startsWith("/planner") || pathname.startsWith("/assessment");

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl ${
        isInApp
          ? "border-b border-ink-900/8 bg-paper-50/85"
          : "border-b border-midnight-700/30 bg-midnight-950/70"
      }`}
    >
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12"
      >
        <Link
          href="/"
          className={`flex items-center gap-2.5 text-base font-semibold tracking-tight focus:outline-none ${
            isInApp ? "text-ink-950" : "text-paper-50"
          }`}
        >
          <span className="relative inline-flex h-7 w-7 items-center justify-center">
            <span className="absolute h-2 w-2 rounded-full bg-dna-visual" style={{ transform: "translate(-5px,-3px)" }} />
            <span className="absolute h-2 w-2 rounded-full bg-dna-analogies" style={{ transform: "translate(5px,-1px)" }} />
            <span className="absolute h-2 w-2 rounded-full bg-dna-stories" style={{ transform: "translate(-2px,5px)" }} />
            <span className="absolute h-2 w-2 rounded-full bg-dna-examples" style={{ transform: "translate(6px,4px)", opacity: 0.55 }} />
          </span>
          <span className="font-display">AdaptiveMind</span>
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {items.map((item) => {
            const active = !item.href.startsWith("#") && pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm font-medium transition hover:opacity-80 focus:outline-none ${
                  isInApp
                    ? active ? "text-ink-950" : "text-ink-700"
                    : "text-midnight-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/assessment"
          className={`rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 ${
            isInApp
              ? "bg-ink-950 text-paper-50 shadow-ink-900/15 hover:bg-ink-800"
              : "bg-paper-50 text-midnight-950 shadow-black/30 hover:bg-paper-100"
          }`}
        >
          {isInApp ? "Retake assessment" : "Begin assessment"}
        </Link>
      </nav>
    </header>
  );
}
