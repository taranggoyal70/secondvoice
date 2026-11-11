export const STARTER_PHRASES = [
  { id: "more-time", text: "I need a little more time." },
  { id: "ask-me", text: "Please ask me directly." },
  { id: "try-again", text: "That isn’t what I meant." },
  { id: "continue", text: "I’m ready to continue." },
];

export const PHRASES_KEY = "secondvoice.phrases.v1";
export const MAX_PHRASES = 12;
export const MAX_MESSAGE = 1800;

export function readPhrases(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      const phrase = item.trim();
      if (
        !phrase ||
        phrase.length > MAX_MESSAGE ||
        result.some((p) => p.toLowerCase() === phrase.toLowerCase())
      )
        continue;
      result.push(phrase);
      if (result.length === MAX_PHRASES) break;
    }
    return result;
  } catch {
    return [];
  }
}

export function addPhrase(
  phrases: string[],
  text: string,
): { phrases: string[]; message: string } {
  const phrase = text.trim();
  if (!phrase || phrase.length > MAX_MESSAGE)
    return {
      phrases,
      message: "Write a message first (up to 1,800 characters).",
    };
  if (phrases.some((p) => p.toLowerCase() === phrase.toLowerCase()))
    return { phrases, message: "This phrase is already saved." };
  if (phrases.length >= MAX_PHRASES)
    return {
      phrases,
      message: "Your 12 phrase slots are full. Remove one to make room.",
    };
  return {
    phrases: [...phrases, phrase],
    message: "Phrase saved on this browser.",
  };
}
