import type { Metadata } from "next";
import { ResultsExperience } from "@/components/assessment/ResultsExperience";

export const metadata: Metadata = {
  title: "Your Learning DNA | AdaptiveMind AI",
  description: "Review your initial AdaptiveMind learning profile.",
};

export default function AssessmentResultsPage() {
  return <ResultsExperience />;
}
