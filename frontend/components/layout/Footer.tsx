import { Logo } from "@/components/am/Logo";

const socialLinks = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46L20 4" />
      </svg>
    ),
  },
  {
    label: "Website",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--am-border-light)] bg-[var(--am-bg)]">
      {/* Warm ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 opacity-40"
        style={{ background: "var(--am-glow-warm)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col items-center gap-4 sm:items-start">
            <div className="flex items-center gap-2.5">
              <Logo size={22} colored compact />
              <span className="text-sm font-semibold text-[var(--am-text-primary)] font-[var(--font-editorial)]">
                AdaptiveMind AI
              </span>
            </div>
            <p className="max-w-xs text-center text-sm leading-6 text-[var(--am-text-muted)] sm:text-left">
              Learning adapts to you — not the other way around.
            </p>
          </div>

          {/* Social icons — liquid-glass circular */}
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-label={link.label}
                className="am-glass-icon"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-[var(--am-border-light)] pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-[var(--am-text-muted)]">
            &copy; {new Date().getFullYear()} AdaptiveMind AI. Learning evolves.
          </p>
          <nav aria-label="Legal" className="flex gap-4 text-xs text-[var(--am-text-muted)]">
            <a href="#" className="transition-colors hover:text-[var(--am-text-primary)]">Privacy</a>
            <a href="#" className="transition-colors hover:text-[var(--am-text-primary)]">Terms</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
