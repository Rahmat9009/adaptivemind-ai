import type { Metadata } from "next";
import { AssessmentShell } from "@/components/assessment/AssessmentShell";

export const metadata: Metadata = {
  title: "Learning DNA Assessment | AdaptiveMind AI",
  description: "Discover your initial AdaptiveMind learning profile.",
};

export default function AssessmentPage() {
  return <AssessmentShell />;
}
