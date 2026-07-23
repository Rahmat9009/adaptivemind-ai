import type { Metadata } from "next";
import { DownloadedLessonsShell } from "@/components/offline/DownloadedLessonsShell";

export const metadata: Metadata = {
  title: "Downloaded Lessons | AdaptiveMind AI",
  description: "Read lessons saved locally on this browser.",
};

export default function DownloadedLessonsPage() {
  return <DownloadedLessonsShell />;
}
