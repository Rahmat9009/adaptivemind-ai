const steps = [
  "Take a quick learning assessment.",
  "AdaptiveMind builds your learning profile.",
  "Learn with personalized AI lessons.",
  "Improve continuously as the AI adapts.",
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[#f7f9fc] px-5 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            How it Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            A smarter path from assessment to mastery.
          </h2>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
          {steps.map((step, index) => (
            <div key={step} className="contents">
              <article className="rounded-3xl border border-white/70 bg-white/65 p-6 text-center shadow-lg shadow-slate-900/6 backdrop-blur">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white">
                  {index + 1}
                </div>
                <p className="mt-5 text-base font-medium leading-7 text-slate-700">
                  {step}
                </p>
              </article>
              {index < steps.length - 1 ? (
                <div
                  className="flex items-center justify-center text-2xl font-semibold text-teal-600 lg:rotate-[-90deg]"
                  aria-hidden="true"
                >
                  ↓
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
