import { NextResponse } from "next/server";
import { createDemoEvaluation, createDemoFollowUp, createDemoLesson, createDemoExplainBack, createDemoHint } from "@/lib/ai/demo";
import { createProviderEvaluation, createProviderFollowUp, createProviderLesson, createProviderExplainBack, createProviderHint } from "@/lib/ai/provider";
import type { TeachingMode, TutorAction, TutorConversationMessage, TutorLessonSummary, TutorRequest } from "@/lib/ai/types";
import { learningDimensions, type LearningDimension, type LearningScores } from "@/lib/learning-dna";

const actions: TutorAction[] = ["initial", "simpler", "different", "example", "challenge", "followup", "evaluate", "explain-back", "retrieval-check", "hint", "review"];
const teachingModes: TeachingMode[] = ["adaptive", "visual", "example", "analogy", "story", "challenge"];

function isLearningScores(value: unknown): value is LearningScores {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return learningDimensions.every((dimension) => typeof record[dimension] === "number" && record[dimension] >= 0 && record[dimension] <= 100);
}

function isLearningDimensionArray(value: unknown): value is LearningDimension[] {
  return Array.isArray(value)
    && value.length <= learningDimensions.length
    && value.every((dimension) => typeof dimension === "string" && learningDimensions.includes(dimension as LearningDimension));
}

function isLessonSummary(value: unknown): value is TutorLessonSummary {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.title === "string" && record.title.length <= 160
    && typeof record.coreIdea === "string" && record.coreIdea.length <= 500
    && typeof record.explanation === "string" && record.explanation.length <= 360
    && isLearningDimensionArray(record.stylesUsed);
}

function isConversation(value: unknown): value is TutorConversationMessage[] {
  if (!Array.isArray(value) || value.length > 8) return false;
  let totalLength = 0;
  return value.every((message) => {
    if (typeof message !== "object" || message === null) return false;
    const record = message as Record<string, unknown>;
    const content = typeof record.content === "string" ? record.content.trim() : "";
    totalLength += content.length;
    return typeof record.id === "string" && record.id.length > 0 && record.id.length <= 80
      && (record.role === "student" || record.role === "tutor")
      && content.length > 0 && content.length <= 500
      && typeof record.createdAt === "string" && record.createdAt.length > 0 && record.createdAt.length <= 40
      && totalLength <= 2400;
  });
}

function parseRequest(value: unknown): TutorRequest | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const topic = typeof record.topic === "string" ? record.topic.trim() : "";
  const subject = typeof record.subject === "string" ? record.subject.trim() : "General learning";
  const level = typeof record.level === "string" ? record.level.trim() : "General";
  const action = record.action;
  const teachingMode = record.teachingMode;
  const previousStyles = record.previousStyles;
  const previousTeachingMode = record.previousTeachingMode;
  const previousTitle = record.previousTitle;
  const previousExplanation = record.previousExplanation;
  const question = typeof record.question === "string" ? record.question.trim() : "";
  const currentLesson = record.currentLesson;
  const conversation = record.conversation;
  const learnerAnswer = typeof record.learnerAnswer === "string" ? record.learnerAnswer.trim() : "";
  const checkQuestion = typeof record.checkQuestion === "string" ? record.checkQuestion.trim() : "";
  const lessonCoreIdea = typeof record.lessonCoreIdea === "string" ? record.lessonCoreIdea.trim() : "";
  const lessonContext = typeof record.lessonContext === "string" ? record.lessonContext.trim() : "";
  const learnerResponse = typeof record.learnerResponse === "string" ? record.learnerResponse.trim() : "";
  const currentHintLevel = typeof record.currentHintLevel === "number" ? record.currentHintLevel : 0;
  const reviewSkillId = typeof record.reviewSkillId === "string" ? record.reviewSkillId.trim() : "";
  if (!topic || topic.length > 160 || subject.length > 50 || level.length > 50 || !isLearningScores(record.scores) || typeof action !== "string" || !actions.includes(action as TutorAction) || typeof teachingMode !== "string" || !teachingModes.includes(teachingMode as TeachingMode) || (previousStyles !== undefined && !isLearningDimensionArray(previousStyles)) || (previousTeachingMode !== undefined && (typeof previousTeachingMode !== "string" || !teachingModes.includes(previousTeachingMode as TeachingMode))) || (previousTitle !== undefined && (typeof previousTitle !== "string" || previousTitle.length > 160)) || (previousExplanation !== undefined && (typeof previousExplanation !== "string" || previousExplanation.length > 360))) return null;
  if (action === "followup" && (!question || question.length > 500 || !isLessonSummary(currentLesson) || (conversation !== undefined && !isConversation(conversation)))) return null;
  if (action === "evaluate" && (!learnerAnswer || learnerAnswer.length > 1000 || !checkQuestion || checkQuestion.length > 500 || !lessonCoreIdea || lessonCoreIdea.length > 500 || lessonContext.length > 500)) return null;
  if (action === "explain-back" && (!learnerResponse || learnerResponse.length > 1000 || lessonContext.length > 500)) return null;
  if (action === "hint" && (currentHintLevel < 0 || currentHintLevel > 3 || lessonContext.length > 500)) return null;
  if (action === "review" && (!reviewSkillId || reviewSkillId.length > 100)) return null;
  return {
    topic, subject: subject || "General learning", level: level || "General", scores: record.scores,
    action: action as TutorAction, teachingMode: teachingMode as TeachingMode,
    previousStyles, previousTeachingMode: previousTeachingMode as TeachingMode | undefined,
    previousTitle, previousExplanation,
    question: question || undefined,
    currentLesson: currentLesson as TutorLessonSummary | undefined,
    conversation: conversation as TutorConversationMessage[] | undefined,
    learnerAnswer: learnerAnswer || undefined,
    checkQuestion: checkQuestion || undefined,
    lessonCoreIdea: lessonCoreIdea || undefined,
    lessonContext: lessonContext || undefined,
    learnerResponse: learnerResponse || undefined,
    currentHintLevel,
    reviewSkillId: reviewSkillId || undefined,
  };
}

function lessonMatchesAction(action: Exclude<TutorAction, "followup" | "evaluate">, lesson: { challenge?: string; practicePrompt?: string }): boolean {
  if (action === "challenge") return Boolean(lesson.challenge);
  if (action === "example") return Boolean(lesson.practicePrompt);
  return true;
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

  if (tutorRequest.action === "followup") {
    try {
      const providerFollowUp = await createProviderFollowUp(tutorRequest);
      if (providerFollowUp) return NextResponse.json({ followUp: providerFollowUp, source: "provider", teachingMode: tutorRequest.teachingMode, action: "followup" });

      if (process.env.NODE_ENV === "development") {
        const demoFollowUp = createDemoFollowUp(tutorRequest);
        if (demoFollowUp) return NextResponse.json({ followUp: demoFollowUp, source: "demo", teachingMode: tutorRequest.teachingMode, action: "followup" });
      }
      return NextResponse.json({ error: "The tutor is not configured yet. Add an AI provider or try a supported demo topic in development." }, { status: 503 });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        const demoFollowUp = createDemoFollowUp(tutorRequest);
        if (demoFollowUp) return NextResponse.json({ followUp: demoFollowUp, source: "demo", teachingMode: tutorRequest.teachingMode, action: "followup" });
      }
      const message = error instanceof Error ? error.message : "The tutor could not answer this follow-up.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }
  if (tutorRequest.action === "evaluate") {
    try {
      const evaluation = await createProviderEvaluation(tutorRequest);
      if (evaluation) return NextResponse.json({ evaluation, source: "provider", teachingMode: tutorRequest.teachingMode, action: "evaluate" });
      if (process.env.NODE_ENV === "development") {
        const demo = createDemoEvaluation(tutorRequest);
        if (demo) return NextResponse.json({ evaluation: demo, source: "demo", teachingMode: tutorRequest.teachingMode, action: "evaluate" });
      }
      return NextResponse.json({ error: "The tutor is not configured yet. Add an AI provider or try a supported demo topic in development." }, { status: 503 });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        const demo = createDemoEvaluation(tutorRequest);
        if (demo) return NextResponse.json({ evaluation: demo, source: "demo", teachingMode: tutorRequest.teachingMode, action: "evaluate" });
      }
      return NextResponse.json({ error: error instanceof Error ? error.message : "The tutor could not evaluate this answer." }, { status: 502 });
    }
  }

  if (tutorRequest.action === "explain-back") {
    try {
      const explainBack = await createProviderExplainBack({
        topic: tutorRequest.topic,
        subject: tutorRequest.subject,
        level: tutorRequest.level,
        scores: tutorRequest.scores,
        teachingMode: tutorRequest.teachingMode,
        learnerResponse: tutorRequest.learnerResponse ?? "",
        lessonContext: tutorRequest.lessonContext ?? "",
      });
      if (explainBack) return NextResponse.json({ evaluation: explainBack, source: "provider", teachingMode: tutorRequest.teachingMode, action: "explain-back" });
      if (process.env.NODE_ENV === "development") {
        const demo = createDemoExplainBack({
          topic: tutorRequest.topic,
          learnerResponse: tutorRequest.learnerResponse ?? "",
          lessonContext: tutorRequest.lessonContext ?? "",
          scores: tutorRequest.scores,
          teachingMode: tutorRequest.teachingMode,
        });
        if (demo) return NextResponse.json({ evaluation: demo, source: "demo", teachingMode: tutorRequest.teachingMode, action: "explain-back" });
      }
      return NextResponse.json({ error: "The tutor is not configured yet." }, { status: 503 });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        const demo = createDemoExplainBack({
          topic: tutorRequest.topic,
          learnerResponse: tutorRequest.learnerResponse ?? "",
          lessonContext: tutorRequest.lessonContext ?? "",
          scores: tutorRequest.scores,
          teachingMode: tutorRequest.teachingMode,
        });
        if (demo) return NextResponse.json({ evaluation: demo, source: "demo", teachingMode: tutorRequest.teachingMode, action: "explain-back" });
      }
      return NextResponse.json({ error: error instanceof Error ? error.message : "The tutor could not evaluate this explanation." }, { status: 502 });
    }
  }

  if (tutorRequest.action === "hint") {
    try {
      const hint = await createProviderHint({
        topic: tutorRequest.topic,
        subject: tutorRequest.subject,
        level: tutorRequest.level,
        scores: tutorRequest.scores,
        teachingMode: tutorRequest.teachingMode,
        currentLevel: tutorRequest.currentHintLevel ?? 0,
        lessonContext: tutorRequest.lessonContext ?? "",
      });
      if (hint) return NextResponse.json({ hints: hint.hints, source: "provider", teachingMode: tutorRequest.teachingMode, action: "hint" });
      if (process.env.NODE_ENV === "development") {
        const demo = createDemoHint({
          topic: tutorRequest.topic,
          currentLevel: tutorRequest.currentHintLevel ?? 0,
          scores: tutorRequest.scores,
          teachingMode: tutorRequest.teachingMode,
        });
        if (demo) return NextResponse.json({ hints: demo.hints, source: "demo", teachingMode: tutorRequest.teachingMode, action: "hint" });
      }
      return NextResponse.json({ error: "The tutor is not configured yet." }, { status: 503 });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        const demo = createDemoHint({
          topic: tutorRequest.topic,
          currentLevel: tutorRequest.currentHintLevel ?? 0,
          scores: tutorRequest.scores,
          teachingMode: tutorRequest.teachingMode,
        });
        if (demo) return NextResponse.json({ hints: demo.hints, source: "demo", teachingMode: tutorRequest.teachingMode, action: "hint" });
      }
      return NextResponse.json({ error: error instanceof Error ? error.message : "The tutor could not generate a hint." }, { status: 502 });
    }
  }

  try {
    const providerLesson = await createProviderLesson(tutorRequest);
    if (providerLesson && lessonMatchesAction(tutorRequest.action, providerLesson)) return NextResponse.json({ lesson: providerLesson, source: "provider", teachingMode: tutorRequest.teachingMode, action: tutorRequest.action });

    if (process.env.NODE_ENV === "development") {
      const demoLesson = createDemoLesson(tutorRequest);
      if (demoLesson) return NextResponse.json({ lesson: demoLesson, source: "demo", teachingMode: tutorRequest.teachingMode, action: tutorRequest.action });
    }

    return NextResponse.json({ error: "The tutor is not configured yet. Add an AI provider or try a supported demo topic in development." }, { status: 503 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const demoLesson = createDemoLesson(tutorRequest);
      if (demoLesson) return NextResponse.json({ lesson: demoLesson, source: "demo", teachingMode: tutorRequest.teachingMode, action: tutorRequest.action });
    }
    const message = error instanceof Error ? error.message : "The tutor could not create a lesson.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
