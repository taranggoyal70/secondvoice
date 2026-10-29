export type StudioPhase = "idle" | "composing" | "speaking" | "interrupted" | "complete" | "error";

export const PRIMARY_SENTENCE =
  "I need a little more time, but I want to answer this in my own words.";

export const REVISED_SENTENCE =
  "I want to answer for myself. Give me a moment, and I will tell you what I need.";

export const SPANISH_SENTENCE =
  "Quiero responder por mí misma. Dame un momento para encontrar mis palabras.";

export const PHRASE_CHIPS = [
  "I need more time",
  "Please ask me directly",
  "I want to answer for myself",
  "That is not what I meant",
];

export const PHASE_LABELS: Record<StudioPhase, string> = {
  idle: "Ready",
  composing: "Composing",
  speaking: "Speaking",
  interrupted: "Interrupted",
  complete: "Turn complete",
  error: "Needs attention",
};
