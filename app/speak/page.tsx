import type { Metadata } from "next";
import { STARTER_PHRASES } from "@/lib/phrases";
import { SecondVoiceStudio } from "@/components/second-voice-studio";
export const metadata: Metadata = {
  title: "Your words — SecondVoice",
  description:
    "Compose, speak, stop, and revise. A focused communication workspace with reusable phrases and a large listener view.",
};
export default async function SpeakPage({ searchParams }: { searchParams: Promise<{ starter?: string | string[] }> }) {
  const { starter } = await searchParams;
  const initialMessage = STARTER_PHRASES.find(phrase => phrase.id === starter)?.text ?? "";
  return <SecondVoiceStudio initialMessage={initialMessage} />;
}
