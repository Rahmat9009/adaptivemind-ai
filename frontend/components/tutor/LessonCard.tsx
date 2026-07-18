import { learningDimensionLabels } from "@/lib/learning-dna";
import type { TutorApiResponse } from "@/lib/ai/types";

interface LessonCardProps {
  response: TutorApiResponse;
}

export function LessonCard({ response }: LessonCardProps) {
  const { lesson, source } = response;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/6 sm:p-8" aria-labelledby="lesson-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Personalized lesson</p>
        {source === "demo" ? <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">Demo response</span> : null}
      </div>
      <h2 id="lesson-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{lesson.title}</h2>
      <p className="mt-3 text-sm font-medium text-slate-500">Personalized using {lesson.stylesUsed.map((style) => learningDimensionLabels[style]).join(" + ")}</p>

      <section className="mt-8"><h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Core idea</h3><p className="mt-2 text-lg font-medium leading-8 text-slate-900">{lesson.coreIdea}</p></section>
      <section className="mt-7"><h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">How it works</h3><p className="mt-2 leading-7 text-slate-700">{lesson.explanation}</p></section>
      {lesson.example ? <section className="mt-7 rounded-2xl border border-sky-100 bg-sky-50/70 p-5"><h3 className="font-semibold text-slate-900">Example</h3><p className="mt-2 leading-7 text-slate-700">{lesson.example}</p></section> : null}
      {lesson.analogy ? <section className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-5"><h3 className="font-semibold text-slate-900">Useful analogy</h3><p className="mt-2 leading-7 text-slate-700">{lesson.analogy}</p></section> : null}
      <section className="mt-7"><h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Key points</h3><ul className="mt-3 space-y-2 text-slate-700">{lesson.keyPoints.map((point) => <li key={point} className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />{point}</li>)}</ul></section>
      <section className="mt-7 rounded-2xl bg-slate-950 p-5 text-white"><h3 className="text-sm font-semibold uppercase tracking-wider text-teal-200">Quick understanding check</h3><p className="mt-2 leading-7 text-slate-100">{lesson.checkQuestion}</p></section>
    </article>
  );
}
