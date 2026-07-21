import type { Metadata } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/am/MotionProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "AdaptiveMind AI | The AI tutor that learns how you learn",
  description:
    "AdaptiveMind AI personalizes explanations, lessons, and study plans around each student's unique Learning DNA — not a one-size-fits-all approach.",
  keywords: ["adaptive learning", "AI tutor", "personalized education", "Learning DNA", "adaptive tutoring"],
  authors: [{ name: "AdaptiveMind AI" }],
  openGraph: {
    title: "AdaptiveMind AI | The AI tutor that learns how you learn",
    description: "AdaptiveMind changes how it teaches based on how you understand.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body className="relative min-h-full flex flex-col bg-[var(--am-bg)] text-[var(--am-text-primary)]">
        {/* Skip navigation — WCAG 2.2 AA */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-[var(--am-radius-lg)] focus:bg-[var(--am-primary)] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
