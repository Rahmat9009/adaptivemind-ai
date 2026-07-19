import type { Metadata } from "next";
import { AssessmentShell } from "@/components/assessment/AssessmentShell";

export const metadata: Metadata = {
  title: "Learning DNA Assessment | AdaptiveMind AI",
  description:
    "Discover your unique Learning DNA — the combination of teaching approaches that helps you learn best.",
};

export default function AssessmentPage() {
  return <AssessmentShell />;
}
