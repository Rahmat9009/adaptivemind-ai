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
      <main id="main-content" className="min-h-screen bg-[var(--am-bg)] pb-24 sm:ml-16 lg:ml-56 sm:pb-0">
        <div className="relative">
          {heading && (
            <div className="relative mx-auto max-w-6xl px-5 pt-8 pb-2 sm:px-8 lg:px-10">
              <p className="am-label text-[var(--am-text-muted)] mb-1">
                {subheading || "AdaptiveMind"}
              </p>
              <h1 className="am-heading-serif text-3xl text-[var(--am-text-primary)] sm:text-4xl">
                {heading}
              </h1>
              {subheading && (
                <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--am-text-secondary)]">
                  {subheading}
                </p>
              )}
            </div>
          )}
          <div className="relative mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
