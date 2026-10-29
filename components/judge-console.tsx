"use client";

import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, RadioTower } from "lucide-react";
import type { StudioPhase } from "@/lib/demo";

export type EventTone = "signal" | "voice" | "cut" | "complete" | "neutral";
export type StudioEvent = { id: number; label: string; detail: string; at: string; tone: EventTone };

type JudgeConsoleProps = {
  activeVoice: string;
  events: StudioEvent[];
  heardCount: number;
  heardText: string;
  language: string;
  mode: string;
  phase: StudioPhase;
  totalWords: number;
};

export function JudgeConsole({
  activeVoice,
  events,
  heardCount,
  heardText,
  language,
  mode,
  phase,
  totalWords,
}: JudgeConsoleProps) {
  return (
    <div className="judge-console">
      <section className={`listener-view listener-view--${phase}`} aria-label="Listener view">
        <div className="console-title">
          <span><BadgeCheck size={15} /> Listener view</span>
          <small>speaker-controlled</small>
        </div>
        <blockquote>
          {heardText || "The listener sees only words that have reached playback."}
          {phase === "speaking" ? <span className="listener-cursor" aria-hidden="true" /> : null}
        </blockquote>
        <div className="listener-meta">
          <span>Voice / {activeVoice}</span>
          <span>{language}</span>
          <span>{heardCount}/{totalWords} heard</span>
        </div>
      </section>

      <section className="event-stream" aria-label="Live voice event stream">
        <div className="console-title">
          <span><RadioTower size={15} /> Event stream</span>
          <small>{mode}</small>
        </div>
        <div className="event-list">
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`event-row event-row--${event.tone}`}
                key={event.id}
              >
                <time>{event.at}</time>
                <strong>{event.label}</strong>
                <span>{event.detail}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
