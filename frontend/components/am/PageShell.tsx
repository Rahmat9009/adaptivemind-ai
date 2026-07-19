"use client";

import { AppNavigation } from "@/components/layout/AppNavigation";

interface PageShellProps {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
}

export function PageShell({ children, heading, subheading }: PageShellProps) {
  return (
    <>
      <AppNavigation />
      <main className="min-h-screen bg-[var(--am-bg-reading)] pb-24 sm:ml-16 lg:ml-64 sm:pb-0">
        <div className="am-spatial-bg relative">
          {/* Subtle top gradient */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--am-primary)]/20 to-transparent" />

          {heading && (
            <div className="relative mx-auto max-w-6xl px-5 pt-10 pb-2 sm:px-8 lg:px-10">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--am-text-primary)] sm:text-4xl">
                {heading}
              </h1>
              {subheading && (
                <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--am-text-secondary)]">
                  {subheading}
                </p>
              )}
            </div>
          )}
          <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
