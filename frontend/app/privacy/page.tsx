import type { Metadata } from "next";
import { PrivacyPageShell } from "@/components/privacy/PrivacyPageShell";

export const metadata: Metadata = {
  title: "Privacy and local data | AdaptiveMind AI",
  description:
    "How AdaptiveMind stores local learning data, sends live Ada requests, and gives learners control over browser data.",
};

export default function PrivacyPage() {
  return <PrivacyPageShell />;
}
