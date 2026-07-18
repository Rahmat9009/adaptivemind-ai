"use client";

import Link from "next/link";
import { startNewTopicStorageKey } from "@/lib/dashboard-storage";

interface QuickActionsProps { hasHistory: boolean; }

export function QuickActions({ hasHistory }: QuickActionsProps) {
  return <section aria-labelledby="quick-actions-title"><h2 id="quick-actions-title" className="text-xl font-semibold text-slate-950">Choose your next step</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Link href="/tutor" className="rounded-2xl border border-indigo-200 bg-indigo-600 p-5 text-white shadow-lg shadow-indigo-900/15 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-3"><p className="font-semibold">{hasHistory ? "Continue learning" : "Start learning"}</p><p className="mt-2 text-sm leading-6 text-indigo-100">{hasHistory ? "Pick up with Ada and your current lesson." : "Begin your first personalized lesson with Ada."}</p></Link><Link href="/tutor" onClick={() => sessionStorage.setItem(startNewTopicStorageKey, "true")} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-3"><p className="font-semibold text-slate-950">Start a new topic</p><p className="mt-2 text-sm leading-6 text-slate-600">Explore a subject or question that is on your mind.</p></Link><Link href="/assessment" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-3"><p className="font-semibold text-slate-950">Retake Learning DNA</p><p className="mt-2 text-sm leading-6 text-slate-600">Refresh your current learning preferences.</p></Link></div></section>;
}
