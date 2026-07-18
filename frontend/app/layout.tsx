import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdaptiveMind AI | The AI tutor that learns how you learn",
  description:
    "AdaptiveMind AI personalizes explanations, quizzes, and study plans for every student's unique learning style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
