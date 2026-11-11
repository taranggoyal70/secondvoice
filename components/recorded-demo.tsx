"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { VoiceRibbon } from "@/components/voice-ribbon";
import { PRIMARY_SENTENCE, REVISED_SENTENCE } from "@/lib/demo";
import original from "@/public/demo/original.json";
import revised from "@/public/demo/revised.json";

export function RecordedDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(0);
  const [notice, setNotice] = useState(
    "Real AssemblyAI recording. Sound starts when you press play.",
  );
  const audio = useRef<HTMLAudioElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const phrase = step === 2 ? REVISED_SENTENCE : PRIMARY_SENTENCE;
  const words = phrase.split(/\s+/);
  const cleanup = useCallback(() => {
    generation.current++;
    if (!audio.current) return;
    audio.current.pause();
    audio.current.onended = null;
    audio.current.ontimeupdate = null;
    audio.current.onerror = null;
    audio.current.onplaying = null;
  }, []);
  useEffect(() => {
    const player = audio.current;
    const pause = () => {
      if (!player || player.paused) return;
      cleanup();
      setPlaying(false);
      setNotice("Paused. Press play whenever you’re ready.");
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") pause();
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) pause();
    });
    if (card.current) observer.observe(card.current);
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
      cleanup();
    };
  }, [cleanup]);
  const play = (next = step) => {
    cleanup();
    const player = audio.current;
    if (!player) return;
    const current = generation.current;
    setStep(next);
    setHeard(0);
    setPlaying(true);
    setNotice(
      next === 1
        ? "Listen as playback stops mid-thought."
        : next === 2
          ? "A revised message. The speaker decides what comes next."
          : "Listen to the message, word by word.",
    );
    const data = next === 2 ? revised : original;
    const timings =
      data.frames.find((frame) => frame.type === "WordBoundaries")?.words ?? [];
    player.src = next === 2 ? "/demo/revised.wav" : "/demo/original.wav";
    player.currentTime = 0;
    const update = () => {
      if (generation.current !== current) return;
      const cutoff = next === 1 ? (timings[5]?.end ?? 1500) : Infinity;
      setHeard(
        timings.filter(
          (word) => word.end <= Math.min(player.currentTime * 1000, cutoff),
        ).length,
      );
      if (player.currentTime * 1000 >= cutoff) {
        cleanup();
        setPlaying(false);
        setNotice("Stopped. There is room to change your mind.");
      }
    };
    player.ontimeupdate = update;
    player.onended = () => {
      if (generation.current === current) {
        setPlaying(false);
        setHeard(
          (next === 2 ? REVISED_SENTENCE : PRIMARY_SENTENCE).split(/\s+/)
            .length,
        );
        setNotice("Finished. Every word was chosen by the speaker.");
      }
    };
    player.onerror = () => {
      if (generation.current === current) {
        cleanup();
        setPlaying(false);
        setNotice("The recording could not load. Press play to retry.");
      }
    };
    void player.play().catch(() => {
      if (generation.current === current) {
        cleanup();
        setPlaying(false);
        setNotice("Audio could not start. Press play to try again.");
      }
    });
  };
  const stop = () => {
    cleanup();
    setPlaying(false);
    setNotice("Stopped by you. Press play to listen again.");
  };
  return (
    <div ref={card} className={`demo-card ${playing ? "is-speaking" : ""}`}>
      <audio ref={audio} preload="none" />
      <div className="demo-top">
        <span>
          <Volume2 size={18} /> THE SECONDVOICE EXPERIENCE
        </span>
        <span>
          <i className="status-dot" /> Real recorded speech
        </span>
      </div>
      <div className="demo-body">
        <div className="demo-direction">
          <span className="demo-count">0{step + 1} / 03</span>
          <h2>
            {
              [
                <>
                  A thought
                  <br />
                  becomes a voice.
                </>,
                <>
                  You can
                  <br />
                  change your mind.
                </>,
                <>
                  The next words
                  <br />
                  are still yours.
                </>,
              ][step]
            }
          </h2>
          <p>
            {
              [
                "Hear a message chosen by the speaker.",
                "Listen as the message stops mid-thought.",
                "A fresh thought. Ready to be heard.",
              ][step]
            }
          </p>
          <div className="demo-chapters" aria-label="Recorded example chapters">
            {["Speak", "Interrupt", "Revise"].map((label, i) => (
              <button
                key={label}
                aria-pressed={step === i}
                onClick={() => play(i)}
              >
                <span>0{i + 1}</span>
                {label}
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </div>
        <div className="demo-reading">
          <div className="demo-reading-label">
            <span>THE SPEAKER’S WORDS</span>
            <span>
              {playing
                ? "Playing"
                : heard >= words.length
                  ? "Complete"
                  : heard
                    ? "Stopped"
                    : "Ready"}
            </span>
          </div>
          <div className="demo-quote" aria-label={phrase}>
            {words.map((word, i) => (
              <span
                aria-hidden="true"
                key={`${step}-${i}`}
                className={i < heard ? "word-spoken" : ""}
              >
                {word}{" "}
              </span>
            ))}
          </div>
          <VoiceRibbon active={playing} />
          <div className="demo-playback">
            <button
              className="button primary"
              onClick={playing ? stop : () => play()}
            >
              {playing ? (
                <Square size={16} fill="currentColor" />
              ) : heard > 0 ? (
                <RotateCcw size={19} />
              ) : (
                <Play size={17} fill="currentColor" />
              )}
              {playing
                ? "Stop playback"
                : heard > 0
                  ? "Play again"
                  : "Listen to the example"}
            </button>
            <span>
              Sound on your terms.
              <br />
              <strong>Press play to listen.</strong>
            </span>
          </div>
        </div>
      </div>
      <p className="demo-notice" role="status">
        {notice}
      </p>
    </div>
  );
}
