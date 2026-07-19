export function Footer() {
  return (
    <footer className="border-t border-midnight-700/30 bg-midnight-950 text-midnight-200">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-2xl text-paper-50">AdaptiveMind AI</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-midnight-300">
              The AI tutor that learns how you learn. Five dimensions of understanding,
              continuously reshaped around your thinking.
            </p>
            <div className="mt-6 flex gap-2" aria-hidden="true">
              {["dna-visual", "dna-examples", "dna-analogies", "dna-stories", "dna-challenges"].map((c) => (
                <span key={c} className={`h-2 w-2 rounded-full ${c} dna-bg`} />
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow-num text-midnight-400">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="/assessment" className="transition hover:text-paper-50">Assessment</a></li>
              <li><a href="/tutor" className="transition hover:text-paper-50">AI Tutor</a></li>
              <li><a href="/planner" className="transition hover:text-paper-50">Study Planner</a></li>
              <li><a href="/dashboard" className="transition hover:text-paper-50">Dashboard</a></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow-num text-midnight-400">Learning DNA</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><span className="dna-visual dna-bg h-1.5 w-1.5 rounded-full" />Visual</li>
              <li className="flex items-center gap-2"><span className="dna-examples dna-bg h-1.5 w-1.5 rounded-full" />Examples</li>
              <li className="flex items-center gap-2"><span className="dna-analogies dna-bg h-1.5 w-1.5 rounded-full" />Analogies</li>
              <li className="flex items-center gap-2"><span className="dna-stories dna-bg h-1.5 w-1.5 rounded-full" />Stories</li>
              <li className="flex items-center gap-2"><span className="dna-challenges dna-bg h-1.5 w-1.5 rounded-full" />Challenges</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-midnight-700/40 pt-6 text-xs text-midnight-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AdaptiveMind AI. A learning identity, not a learning label.</p>
          <p className="font-mono uppercase tracking-wider">v1 · concept prototype</p>
        </div>
      </div>
    </footer>
  );
}
