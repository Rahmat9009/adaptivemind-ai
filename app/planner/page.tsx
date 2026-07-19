import type { Metadata } from "next";
import { PlannerShell } from "@/components/planner/PlannerShell";
export const metadata: Metadata = { title: "Study Planner | AdaptiveMind AI", description: "Build a practical personalized study plan." };
export default function PlannerPage() { return <PlannerShell />; }
