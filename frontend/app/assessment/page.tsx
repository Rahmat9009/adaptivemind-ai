import type { Metadata } from "next";
import { AssessmentShell } from "@/components/assessment/AssessmentShell";

export const metadata: Metadata = {
  title: "Learning DNA Assessment | AdaptiveMind AI",
  description:
    "Create a starting hypothesis for the explanation approaches Ada should try, then refine it through observed learning outcomes.",
};

export default function AssessmentPage() {
  return <AssessmentShell />;
}
