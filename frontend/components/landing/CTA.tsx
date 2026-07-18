export function CTA() {
  return (
    <section id="about" className="bg-white px-5 py-8 sm:px-6 lg:px-8">
      <div
        id="cta"
        className="mx-auto max-w-7xl rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a_0%,#174153_50%,#0f766e_100%)] px-6 py-16 text-center shadow-2xl shadow-slate-900/15 sm:px-12 sm:py-20"
      >
        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Ready to learn smarter?
        </h2>
        <a
          href="#top"
          className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-base font-semibold text-slate-950 shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-teal-900"
        >
          Start Free
        </a>
      </div>
    </section>
  );
}
