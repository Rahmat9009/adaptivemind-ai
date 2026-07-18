"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tutor", href: "/tutor" },
  { label: "Assessment", href: "/assessment" },
  { label: "Learning DNA", href: "/assessment/results" },
];

export function AppNavigation() {
  const pathname = usePathname();
  return <header className="border-b border-white/70 bg-white/75 backdrop-blur-xl"><nav aria-label="Application navigation" className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-5 py-4 sm:px-6 lg:px-8"><Link href="/dashboard" className="shrink-0 text-base font-semibold tracking-tight text-slate-950">AdaptiveMind AI</Link><div className="ml-auto flex shrink-0 items-center gap-1">{navigation.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${active ? "bg-indigo-50 text-indigo-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>{item.label}</Link>; })}</div></nav></header>;
}
