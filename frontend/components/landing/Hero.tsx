export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate px-5 pt-20 pb-24 sm:px-6 sm:pt-28 lg:px-8"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.24),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_30%),linear-gradient(135deg,#f7f9fc_0%,#ffffff_48%,#eef8f6_100%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="max-w-3xl text-center lg:text-left">
          <p className="mb-5 inline-flex rounded-full border border-teal-200 bg-white/70 px-4 py-2 text-sm font-medium text-teal-800 shadow-sm backdrop-blur">
            Personalized AI tutoring for every learner
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            The AI tutor that learns how you learn.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 lg:mx-0">
            AdaptiveMind AI personalizes explanations, quizzes, and study plans
            based on every student&apos;s unique learning style.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="#cta"
              className="rounded-full bg-slate-950 px-7 py-3.5 text-center text-base font-semibold text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4"
            >
              Start Learning
            </a>
            <a
              href="#how-it-works"
              className="rounded-full border border-slate-200 bg-white/75 px-7 py-3.5 text-center text-base font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4"
            >
              Watch Demo
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="rounded-[2rem] border border-white/70 bg-white/55 p-3 shadow-2xl shadow-slate-900/12 backdrop-blur-xl">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    AI Learning Preview
                  </p>
                  <p className="text-xs text-slate-400">
                    Learning style: analogies
                  </p>
                </div>
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-300" />
                </div>
              </div>

              <div className="space-y-4 bg-[linear-gradient(145deg,#101827,#16213a)] p-5 sm:p-6">
                <article className="ml-auto max-w-[86%] rounded-2xl rounded-tr-sm bg-white px-4 py-3 text-slate-900 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Student
                  </p>
                  <p className="mt-1 text-base">Explain photosynthesis.</p>
                </article>

                <article className="max-w-[92%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 px-4 py-4 text-white shadow-lg backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                    AdaptiveMind AI
                  </p>
                  <p className="mt-2 text-base leading-7 text-slate-100">
                    Since you learn best through analogies, imagine a plant as a
                    tiny solar-powered kitchen making its own food.
                  </p>
                </article>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {["Analogy", "Quiz", "Plan"].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-center text-xs font-medium text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
