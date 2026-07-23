import type { TutorConversationMessage, TutorRequest } from "@/lib/ai/types";

const MAX_CONTEXT_MESSAGES = 8;
const MAX_CONTEXT_CHARACTERS = 2_400;

export function boundConversation(
  conversation: TutorConversationMessage[] | undefined,
): TutorConversationMessage[] {
  const recent = (conversation ?? []).slice(-MAX_CONTEXT_MESSAGES);
  const bounded: TutorConversationMessage[] = [];
  let usedCharacters = 0;

  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const message = recent[index];
    if (usedCharacters + message.content.length > MAX_CONTEXT_CHARACTERS) break;
    bounded.unshift(message);
    usedCharacters += message.content.length;
  }

  return bounded;
}

export function withBoundedContext(request: TutorRequest): TutorRequest {
  return {
    ...request,
    conversation: boundConversation(request.conversation),
    lessonContext: request.lessonContext?.slice(0, 4_000),
  };
}
