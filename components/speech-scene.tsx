"use client";
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  Pause,
  PencilLine,
  Volume2,
} from "lucide-react";
import { changedWordIndexes, wordFlightIndexes } from "@/lib/speech-motion";
import { VoiceRibbon } from "@/components/voice-ribbon";

type Phase =
  "ready" | "connecting" | "speaking" | "stopped" | "complete" | "error";
type Props = {
  text: string;
  previousText?: string;
  heard: number;
  phase: Phase;
  run: number;
  compact?: boolean;
  sourceElement?: RefObject<HTMLTextAreaElement | null>;
};

export function SpeechScene({
  text,
  previousText = "",
  heard,
  phase,
  run,
  compact = false,
  sourceElement,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const sourceWords = useRef<(HTMLSpanElement | null)[]>([]);
  const targetWords = useRef<(HTMLSpanElement | null)[]>([]);
  const flights = useRef(new Set<Animation>());
  const previousCount = useRef({ run: -1, count: 0 });
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const changed = useMemo(
    () => changedWordIndexes(previousText, text),
    [previousText, text],
  );
  const revised = Boolean(previousText && previousText !== text);
  const played = Math.min(words.length, Math.max(0, heard));
  const stopFlights = useCallback(() => {
    flights.current.forEach((animation) => animation.cancel());
    flights.current.clear();
    layer.current?.replaceChildren();
  }, []);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const clear = () => {
      flights.current.forEach((animation) => animation.cancel());
      flights.current.clear();
      layer.current?.replaceChildren();
    };
    const visibility = () => {
      container.dataset.hidden = String(document.hidden);
      if (document.hidden) clear();
    };
    const intersection = new IntersectionObserver((entries) => {
      container.dataset.visible = String(entries[0].isIntersecting);
      if (!entries[0].isIntersecting) clear();
    });
    intersection.observe(container);
    const resize = new ResizeObserver(clear);
    resize.observe(container);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    motion.addEventListener("change", clear);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clear();
      resize.disconnect();
      intersection.disconnect();
      motion.removeEventListener("change", clear);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (previousCount.current.run !== run) {
      stopFlights();
      previousCount.current = { run, count: 0 };
    }
    if (
      phase !== "speaking" ||
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      stopFlights();
      previousCount.current.count = played;
      return;
    }
    const indexes = wordFlightIndexes(
      previousCount.current.count,
      played,
      words.length,
    );
    previousCount.current.count = played;
    const box = root.current?.getBoundingClientRect();
    if (!box || !layer.current) return;
    indexes.forEach((index, order) => {
      const target = targetWords.current[index];
      const source = sourceWords.current[index];
      if (!target) return;
      const to = target.getBoundingClientRect();
      const from =
        source?.getBoundingClientRect() ??
        sourceElement?.current?.getBoundingClientRect();
      if (to.top < 0 || to.bottom > window.innerHeight) return;
      const sameRow = from && from.top > 0 && Math.abs(from.top - to.top) < 350;
      const x1 =
        from && sameRow
          ? (source ? from.left : from.right - 70) - box.left
          : 12;
      const y1 =
        from && sameRow
          ? (source ? from.top : from.top + 90) - box.top
          : to.top - box.top + 45;
      const x2 = to.left - box.left,
        y2 = to.top - box.top;
      const chip = document.createElement("span");
      chip.className = "word-flight";
      chip.textContent = words[index];
      layer.current!.appendChild(chip);
      const animation = chip.animate(
        [
          { transform: `translate(${x1}px,${y1}px) scale(.82)`, opacity: 0 },
          { opacity: 0.95, offset: 0.16 },
          {
            transform: `translate(${(x1 + x2) / 2}px,${Math.min(y1, y2) - 28}px) scale(1)`,
            opacity: 0.9,
            offset: 0.55,
          },
          { transform: `translate(${x2}px,${y2}px) scale(.88)`, opacity: 0 },
        ],
        {
          duration: 620,
          delay: order * 32,
          easing: "cubic-bezier(.22,.65,.25,1)",
          fill: "both",
        },
      );
      flights.current.add(animation);
      const remove = () => {
        flights.current.delete(animation);
        chip.remove();
      };
      animation.onfinish = remove;
      animation.oncancel = remove;
    });
  }, [run, played, phase, words, sourceElement, stopFlights]);

  return (
    <div
      ref={root}
      className={`speech-scene ${compact ? "compact-scene" : ""}`}
      data-phase={phase}
      data-revised={revised}
    >
      {!compact && (
        <div className="source-document" key={`source-${run}`}>
          <div className="document-heading">
            <span>
              <FileText size={16} />
              {revised ? "YOUR REVISED MESSAGE" : "YOUR MESSAGE"}
            </span>
            <span>{revised ? "02" : "01"}</span>
          </div>
          {revised && (
            <div className="previous-thought">
              <span>Previous thought</span>
              <p>{previousText}</p>
            </div>
          )}
          <p className="source-sentence">
            {words.map((word, i) => (
              <span
                ref={(el) => {
                  sourceWords.current[i] = el;
                }}
                key={i}
                className={`${changed.has(i) ? "revised-word" : ""} ${i === played - 1 && phase === "speaking" ? "source-active" : ""}`}
                style={{ animationDelay: `${Math.min(i, 10) * 24}ms` }}
              >
                {word}{" "}
              </span>
            ))}
          </p>
          <div className="document-footer">
            <PencilLine size={14} />
            <span>
              {revised
                ? "New words. Same person in control."
                : "Your words stay visible while the voice speaks."}
            </span>
          </div>
        </div>
      )}
      {!compact && (
        <div className="speech-bridge" aria-hidden="true">
          <span />
          <ArrowRight size={19} />
          <span />
        </div>
      )}
      <div className="spoken-document" key={`voice-${run}`}>
        <div className="spoken-heading">
          <span>
            <Volume2 size={16} />
            {phase === "stopped"
              ? "PLAYBACK STOPPED"
              : phase === "complete"
                ? "MESSAGE COMPLETE"
                : phase === "speaking"
                  ? "BECOMING SPEECH"
                  : phase === "connecting"
                    ? "CONNECTING YOUR VOICE"
                    : "YOUR VOICE"}
          </span>
          {phase === "stopped" ? (
            <span className="halt-stamp">
              <Pause size={12} />
              Stopped
            </span>
          ) : phase === "complete" ? (
            <Check size={17} />
          ) : (
            <i className="status-dot" />
          )}
        </div>
        {compact && revised && (
          <div className="revision-receipt">
            <PencilLine size={13} />
            Revised message{" "}
            <span>
              {changed.size} {changed.size === 1 ? "new word" : "new words"}
            </span>
          </div>
        )}
        <p
          className="spoken-sentence"
          aria-label={text || "Your voice is ready"}
        >
          {words.length ? (
            words.map((word, i) => (
              <span
                ref={(el) => {
                  targetWords.current[i] = el;
                }}
                aria-hidden="true"
                key={i}
                className={`speech-word ${i < played ? "has-played" : "awaiting-word"} ${i === played - 1 && phase === "speaking" ? "current-word" : ""} ${changed.has(i) && revised ? "changed-word" : ""}`}
                data-cut={phase === "stopped" && i === Math.max(0, played - 1)}
              >
                {word}{" "}
              </span>
            ))
          ) : (
            <span className="scene-empty">
              Your words.
              <br />
              <strong>Ready to be heard.</strong>
            </span>
          )}
        </p>
        <div className="speech-track">
          <VoiceRibbon active={phase === "speaking"} />
          <span className="speech-cut" aria-hidden="true">
            Ⅱ
          </span>
        </div>
        <div className="speech-caption">
          <span>
            {phase === "stopped"
              ? played
                ? "Playback stopped. The draft remains yours."
                : "Stopped before word timing arrived."
              : phase === "complete"
                ? "A thought, spoken. Take your time with the next."
                : "Word highlights follow playback timing."}
          </span>
          <span>
            {String(played).padStart(2, "0")}
            <i> / {String(words.length).padStart(2, "0")}</i>
          </span>
        </div>
      </div>
      <div ref={layer} className="word-flight-layer" aria-hidden="true" />
    </div>
  );
}
