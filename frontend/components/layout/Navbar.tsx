"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/am/Logo";
import { primaryNavigationRoutes } from "./navigation";

export function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const onScroll = () => {
      header.toggleAttribute("data-scrolled", window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-[var(--am-z-nav)]"
    >
      {/* Scroll-driven glass overlay — fades in via CSS */}
      <style>{`
        .am-nav-glass {
          position: absolute;
          inset: 0;
          z-index: -10;
          pointer-events: none;
          transition: opacity var(--am-duration-standard);
          background: var(--am-glass-bg);
          backdrop-filter: blur(var(--am-glass-blur));
          -webkit-backdrop-filter: blur(var(--am-glass-blur));
          border-bottom: 1px solid var(--am-glass-border);
          opacity: 0;
        }
        header[data-scrolled] .am-nav-glass { opacity: 1; }
      `}</style>
      <div className="am-nav-glass" aria-hidden="true" />

      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10"
      >
        <Link href="/" className="transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--am-primary)]">
          <Logo size={26} colored />
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {primaryNavigationRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              aria-current={route.href === "/" ? "page" : undefined}
              className={`text-sm font-medium transition-colors ${
                route.href === "/"
                  ? "text-[var(--am-primary)]"
                  : "text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]"
              }`}
            >
              {route.label}
            </Link>
          ))}
          <a
            href="#how-it-works"
            className="text-sm font-medium text-[var(--am-text-secondary)] transition-colors hover:text-[var(--am-text-primary)]"
          >
            How it works
          </a>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/assessment"
            className="am-glass-btn-primary px-5 py-2 text-sm"
          >
            Start assessment
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="am-icon-button lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="home-mobile-navigation"
          title={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {menuOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}
        </button>
      </nav>

      {menuOpen && (
        <div
          id="home-mobile-navigation"
          className="border-b border-[var(--am-border-light)] bg-[var(--am-surface)] px-5 pb-4 pt-2 shadow-[var(--am-shadow-sm)] lg:hidden"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
            {primaryNavigationRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center gap-3 border-b border-[var(--am-border-light)] px-2 py-2 text-sm font-semibold text-[var(--am-text-secondary)]"
                >
                  <Icon size={18} aria-hidden="true" />
                  {route.label}
                </Link>
              );
            })}
          </div>
          <div className="mx-auto mt-3 flex max-w-7xl flex-wrap items-center gap-3">
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="am-btn am-btn-secondary"
            >
              How it works
            </a>
            <Link
              href="/assessment"
              onClick={() => setMenuOpen(false)}
              className="am-btn am-btn-primary"
            >
              Start assessment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
