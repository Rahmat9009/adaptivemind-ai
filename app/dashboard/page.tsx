import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = { title: "Dashboard | AdaptiveMind AI", description: "Your personalized AdaptiveMind learning dashboard." };

export default function DashboardPage() { return <DashboardShell />; }
