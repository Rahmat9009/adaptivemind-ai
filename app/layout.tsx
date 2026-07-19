import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
});

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
    <html lang="en" className={`h-full antialiased ${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}>
      <body
        className="min-h-full flex flex-col bg-paper-50 text-ink-900"
        style={{ fontFamily: "var(--font-inter), var(--font-sans)" }}
      >
        {children}
      </body>
    </html>
  );
}
