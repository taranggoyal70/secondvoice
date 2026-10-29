import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, Unbounded } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SecondVoice — speech that stays yours",
  description:
    "A consent-first, real-time voice prosthesis powered by AssemblyAI streaming text to speech.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${unbounded.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
