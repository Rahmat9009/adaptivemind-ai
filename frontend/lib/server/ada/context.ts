import type { TutorConversationMessage, TutorRequest } from "@/lib/ai/types";
import { MAX_PROMPT_SOURCE_CHARACTERS } from "@/lib/sources";

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
  let remainingSourceCharacters = MAX_PROMPT_SOURCE_CHARACTERS;
  const sources = request.sources?.map((source) => ({
    ...source,
    sections: source.sections.flatMap((section) => {
      if (remainingSourceCharacters <= 0) return [];
      const content = section.content.slice(
        0,
        Math.min(8_000, remainingSourceCharacters),
      );
      remainingSourceCharacters -= content.length;
      return content ? [{ ...section, content }] : [];
    }),
  }));

  return {
    ...request,
    conversation: boundConversation(request.conversation),
    lessonContext: request.lessonContext?.slice(0, 4_000),
    sources,
  };
}
