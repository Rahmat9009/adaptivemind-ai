"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/am/Logo";

export function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node) && !headerRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const publicLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Privacy", href: "/privacy" },
  ];

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
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10 relative z-[var(--am-z-nav)]"
      >
        <Link href="/" className="transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--am-primary)]">
          <Logo size={26} colored />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-5">
          {publicLinks.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="text-sm font-medium text-[var(--am-text-secondary)] transition-colors hover:text-[var(--am-text-primary)]"
            >
              {route.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/tutor"
            className="text-sm font-medium text-[var(--am-text-secondary)] transition-colors hover:text-[var(--am-text-primary)]"
          >
            Open Ada
          </Link>
          <Link
            href="/assessment"
            className="am-glass-btn-primary px-5 py-2 text-sm"
          >
            Start assessment
          </Link>
        </div>

        {/* Mobile Menu Button */}
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

      {/* Mobile Navigation Panel */}
      {menuOpen && (
        <div
          id="home-mobile-navigation"
          ref={menuRef}
          className="absolute top-full left-0 w-full border-b border-[var(--am-border-light)] bg-[var(--am-surface)] px-5 pb-4 pt-2 shadow-[var(--am-shadow-sm)] lg:hidden"
        >
          <div className="mx-auto flex flex-col">
            {publicLinks.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[3rem] items-center border-b border-[var(--am-border-light)] px-2 py-2 text-sm font-semibold text-[var(--am-text-secondary)]"
              >
                {route.label}
              </Link>
            ))}
          </div>
          <div className="mx-auto mt-4 flex flex-col sm:flex-row max-w-7xl items-stretch gap-3">
            <Link
              href="/tutor"
              onClick={() => setMenuOpen(false)}
              className="am-btn am-btn-secondary w-full sm:w-auto"
            >
              Open Ada
            </Link>
            <Link
              href="/assessment"
              onClick={() => setMenuOpen(false)}
              className="am-btn am-btn-primary text-white w-full sm:w-auto"
            >
              Start assessment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
