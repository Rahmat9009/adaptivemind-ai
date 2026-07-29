import type { Metadata } from "next";
import { TutorShell } from "@/components/tutor/TutorShell";

export const metadata: Metadata = {
  title: "Adaptive AI Tutor | AdaptiveMind AI",
  description: "Learn with explanations shaped around your current Learning DNA data.",
};

export default function TutorPage() {
  return <TutorShell />;
}
