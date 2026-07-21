import { Logo } from "@/components/am/Logo";

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--am-border-light)] bg-[var(--am-surface)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm text-[var(--am-text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <div className="flex items-center gap-2">
          <Logo size={22} colored compact />
          <span className="text-sm font-semibold text-[var(--am-text-primary)] font-[var(--font-editorial)]">
            AdaptiveMind AI
          </span>
        </div>
        <p>&copy; {new Date().getFullYear()} AdaptiveMind AI. Learning evolves.</p>
      </div>
    </footer>
  );
}
