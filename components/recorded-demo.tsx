"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import type { SculptureStyle } from "@/components/voice-sculpture";
import { SpeechScene } from "@/components/speech-scene";
import { PRIMARY_SENTENCE, REVISED_SENTENCE } from "@/lib/demo";
import { VOICES } from "@/lib/voices";
import original from "@/public/demo/original.json";
import revised from "@/public/demo/revised.json";

export function RecordedDemo() {
  const [step, setStep] = useState(0);
  const [sculpture, setSculpture] = useState<SculptureStyle | "calm">("orbit");
  const [phase, setPhase] = useState<
    "ready" | "connecting" | "speaking" | "stopped" | "complete" | "error"
  >("ready");
  const [run, setRun] = useState(0);
  const active = phase === "connecting" || phase === "speaking";
  const [heard, setHeard] = useState(0);
  const [notice, setNotice] = useState(
    "Real AssemblyAI recording. Sound starts when you press play.",
  );
  const audio = useRef<HTMLAudioElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const phrase = step === 2 ? REVISED_SENTENCE : PRIMARY_SENTENCE;

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
      setPhase("stopped");
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
    setPhase("connecting");
    setRun((value) => value + 1);
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
        setPhase("stopped");
        setNotice("Stopped. There is room to change your mind.");
      }
    };
    player.onplaying = () => {
      if (generation.current === current) setPhase("speaking");
    };
    player.ontimeupdate = update;
    player.onended = () => {
      if (generation.current === current) {
        setPhase("complete");
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
        setPhase("error");
        setNotice("The recording could not load. Press play to retry.");
      }
    };
    void player.play().catch(() => {
      if (generation.current === current) {
        cleanup();
        setPhase("error");
        setNotice("Audio could not start. Press play to try again.");
      }
    });
  };
  const stop = () => {
    cleanup();
    setPhase("stopped");
    setNotice("Stopped by you. Press play to listen again.");
  };
  return (
    <div ref={card} className="demo-card choreography-demo">
      <audio ref={audio} preload="none" />
      <div className="demo-top">
        <span>
          <Volume2 size={18} /> FROM WORDS TO VOICE
        </span>
        <span>
          <i className="status-dot" /> {VOICES.english.find((voice) => voice.id === original.voice)?.name} · Recorded speech
        </span>
      </div>
      <div className="choreography-toolbar">
        <div>
          <span className="choreography-kicker">
            ONE THOUGHT. ALWAYS YOURS.
          </span>
          <h2>
            {
              [
                "Let the words leave the page.",
                "Stop the voice. Keep your thought.",
                "A second thought, made visible.",
              ][step]
            }
          </h2>
        </div>
        <div className="chapter-switch" aria-label="Recorded example chapters">
          {["Speak", "Interrupt", "Revise"].map((label, i) => (
            <button
              key={label}
              onClick={() => play(i)}
              aria-pressed={step === i}
            >
              <span>0{i + 1}</span>
              {label}
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </div>
      <div className="choreography-stage">
        <SpeechScene
          text={phrase}
          previousText={step === 2 ? PRIMARY_SENTENCE : ""}
          heard={heard}
          phase={phase}
          run={run}
          sculpture={sculpture}
        />
      </div>
      <div className="choreography-actions">
        <button
          className="button primary"
          onClick={active ? stop : () => play()}
        >
          {active ? (
            <Square size={16} fill="currentColor" />
          ) : heard ? (
            <RotateCcw size={18} />
          ) : (
            <Play size={17} fill="currentColor" />
          )}
          {active ? "Stop playback" : heard ? "Play again" : "Let it speak"}
        </button>
        <p role="status">{notice}</p>
        <div
          className="sculpture-picker"
          role="group"
          aria-label="Visual motion style"
        >
          <span>Motion</span>
          {(["orbit", "ribbon", "bloom", "calm"] as const).map((style) => (
            <button
              key={style}
              aria-pressed={sculpture === style}
              onClick={() => setSculpture(style)}
            >
              {style[0].toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
