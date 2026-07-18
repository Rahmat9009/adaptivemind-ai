export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="font-semibold text-slate-900">AdaptiveMind AI</p>
        <p>Copyright 2026 AdaptiveMind AI. All rights reserved.</p>
        <a
          href="https://github.com"
          className="font-medium text-slate-600 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4"
          aria-label="AdaptiveMind AI on GitHub"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
