"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/am/Logo";

const navItems = [
  { label: "How it works", href: "#how-it-works" },
];

export function Navbar() {
  const headerRef = useRef<HTMLElement>(null);

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

        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--am-text-secondary)] transition-colors hover:text-[var(--am-text-primary)]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tutor"
            className="am-glass-btn text-sm py-2 px-4"
          >
            Tutor
          </Link>
          <Link
            href="/assessment"
            className="am-glass-btn-primary text-sm py-2 px-5"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
