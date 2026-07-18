export function TutorLoadingState() {
  return <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" role="status"><div className="h-4 w-32 animate-pulse rounded bg-teal-100" /><div className="mt-5 h-8 w-3/4 animate-pulse rounded bg-slate-100" /><div className="mt-6 space-y-3"><div className="h-4 animate-pulse rounded bg-slate-100" /><div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" /><div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" /></div><span className="sr-only">Preparing your personalized lesson.</span></div>;
}
