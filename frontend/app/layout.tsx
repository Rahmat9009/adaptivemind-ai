import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdaptiveMind AI | The AI tutor that learns how you learn",
  description:
    "AdaptiveMind AI personalizes explanations, lessons, and study plans around each student's unique Learning DNA — not a one-size-fits-all approach.",
  keywords: ["adaptive learning", "AI tutor", "personalized education", "learning styles", "adaptive tutoring"],
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
    <html lang="en" className="h-full antialiased">
      <body className="relative min-h-full flex flex-col am-noise">
        {children}
      </body>
    </html>
  );
}
