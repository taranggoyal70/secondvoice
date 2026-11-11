import type { Metadata } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://secondvoice-green.vercel.app"),
  title: "SecondVoice — speech that stays yours",
  openGraph: {
    title: "A pause. Still your turn.",
    description:
      "Your words. Your pace. Compose, speak, stop, and revise with SecondVoice.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SecondVoice — A pause. Still your turn.",
  },
  description:
    "An assistive communication prototype. Compose a message, speak it aloud, stop, and revise with AssemblyAI streaming speech.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
