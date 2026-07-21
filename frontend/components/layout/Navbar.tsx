"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/am/Logo";

const navItems = [
  { label: "How it works", href: "#how-it-works" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-[var(--am-z-nav)] transition-all duration-[var(--am-duration-standard)] ${
        scrolled
          ? "border-b border-[var(--am-border-light)] bg-[var(--am-surface)]/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav aria-label="Primary" className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10">
        <Link href="/" className="transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--am-primary)]">
          <Logo size={26} colored />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-[var(--am-text-secondary)] transition-colors hover:text-[var(--am-text-primary)]">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/tutor" className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--am-text-secondary)] transition-colors hover:text-[var(--am-text-primary)]">
            Tutor
          </Link>
          <Link href="/assessment" className="am-btn am-btn-primary text-sm py-2 px-5">
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
