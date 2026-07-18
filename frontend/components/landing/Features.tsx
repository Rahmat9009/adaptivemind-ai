const features = [
  {
    title: "Adaptive Learning",
    description: "The AI continuously learns how you learn best.",
  },
  {
    title: "Personalized Lessons",
    description:
      "Every explanation is tailored to your preferred learning style.",
  },
  {
    title: "Smart Progress",
    description: "Track strengths, weaknesses, and mastery over time.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Tutoring that adjusts with every lesson.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/8"
            >
              <div className="mb-8 h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-300 to-sky-400 shadow-lg shadow-teal-500/20" />
              <h3 className="text-xl font-semibold text-slate-950">
                {feature.title}
              </h3>
              <p className="mt-4 leading-7 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
