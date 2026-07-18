import { NextResponse } from "next/server";
import { createDemoLesson } from "@/lib/ai/demo";
import { createProviderLesson } from "@/lib/ai/provider";
import type { TutorAction, TutorRequest } from "@/lib/ai/types";
import { learningDimensions, type LearningScores } from "@/lib/learning-dna";

const actions: TutorAction[] = ["initial", "simpler", "different", "example", "challenge"];

function isLearningScores(value: unknown): value is LearningScores {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return learningDimensions.every((dimension) => typeof record[dimension] === "number" && record[dimension] >= 0 && record[dimension] <= 100);
}

function parseRequest(value: unknown): TutorRequest | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const topic = typeof record.topic === "string" ? record.topic.trim() : "";
  const subject = typeof record.subject === "string" ? record.subject.trim() : "General learning";
  const level = typeof record.level === "string" ? record.level.trim() : "General";
  const action = record.action;
  if (!topic || topic.length > 160 || subject.length > 50 || level.length > 50 || !isLearningScores(record.scores) || typeof action !== "string" || !actions.includes(action as TutorAction)) return null;
  return { topic, subject: subject || "General learning", level: level || "General", scores: record.scores, action: action as TutorAction };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  const tutorRequest = parseRequest(body);
  if (!tutorRequest) {
    return NextResponse.json({ error: "Enter a topic and choose valid lesson settings." }, { status: 400 });
  }

  try {
    const providerLesson = await createProviderLesson(tutorRequest);
    if (providerLesson) return NextResponse.json({ lesson: providerLesson, source: "provider" });

    if (process.env.NODE_ENV === "development") {
      const demoLesson = createDemoLesson(tutorRequest);
      if (demoLesson) return NextResponse.json({ lesson: demoLesson, source: "demo" });
    }

    return NextResponse.json({ error: "The tutor is not configured yet. Add an AI provider or try a supported demo topic in development." }, { status: 503 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const demoLesson = createDemoLesson(tutorRequest);
      if (demoLesson) return NextResponse.json({ lesson: demoLesson, source: "demo" });
    }
    const message = error instanceof Error ? error.message : "The tutor could not create a lesson.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
