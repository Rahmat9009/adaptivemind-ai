interface PageShellProps {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
}

export function PageShell({ children, heading, subheading }: PageShellProps) {
  return (
    <main
      id="main-content"
      className="am-preference-scope min-h-screen bg-[var(--am-bg)]"
    >
      <div className="relative">
        {heading && (
          <div className="am-page-shell-header relative mx-auto max-w-6xl px-5 pb-2 pt-8 sm:px-8 lg:px-10">
            <p className="am-label mb-1 text-[var(--am-text-muted)]">
              AdaptiveMind
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
        <div className="am-page-shell-content relative mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
          {children}
        </div>
      </div>
    </main>
  );
}
