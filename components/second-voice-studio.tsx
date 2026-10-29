"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import {
  AudioLines,
  CircleStop,
  Contrast,
  Languages,
  Mic2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssemblyAITTSSession, type SupportedLanguage } from "@/lib/assemblyai/tts-session";
import {
  PHASE_LABELS,
  PHRASE_CHIPS,
  PRIMARY_SENTENCE,
  REVISED_SENTENCE,
  SPANISH_SENTENCE,
  type StudioPhase,
} from "@/lib/demo";
import { JudgeConsole, type EventTone, type StudioEvent } from "./judge-console";

const VoiceSculpture = dynamic(
  () => import("./voice-sculpture").then((module) => module.VoiceSculpture),
  {
    ssr: false,
    loading: () => <div className="sculpture-loading">Tuning voice instrument…</div>,
  },
);

const VOICES = [
  { id: "aai-audrey", label: "Audrey", tone: "steady · warm" },
  { id: "aai-titus", label: "Titus", tone: "deep · clear" },
  { id: "aai-yasmin", label: "Yasmin", tone: "expressive · bright" },
];

type DemoMode = "replay" | "live";

const INITIAL_EVENTS: StudioEvent[] = [
  { id: 0, label: "READY", detail: "waiting for speaker intent", at: "T+0.00", tone: "neutral" },
];

export function SecondVoiceStudio() {
  const reduceMotion = useReducedMotion() ?? false;
  const [mode, setMode] = useState<DemoMode>("replay");
  const [phase, setPhase] = useState<StudioPhase>("idle");
  const [sentence, setSentence] = useState(PRIMARY_SENTENCE);
  const [activeWord, setActiveWord] = useState(-1);
  const [heardCount, setHeardCount] = useState(0);
  const [language, setLanguage] = useState<SupportedLanguage>("english");
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [latency, setLatency] = useState<number | null>(null);
  const [energy, setEnergy] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [notice, setNotice] = useState("Replay mode is ready. No API key is used until you choose Live.");
  const [events, setEvents] = useState<StudioEvent[]>(INITIAL_EVENTS);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const session = useRef<AssemblyAITTSSession | null>(null);
  const sessionConfig = useRef<string | null>(null);
  const runStartedAt = useRef(0);
  const eventId = useRef(1);

  const words = useMemo(() => sentence.trim().split(/\s+/).filter(Boolean), [sentence]);
  const progress = words.length === 0 ? 0 : heardCount / words.length;
  const heardText = words.slice(0, heardCount).join(" ");
  const activeVoice = VOICES.find((voice) => voice.id === voiceId)?.label ?? "Selected voice";

  const pushEvent = useCallback((label: string, detail: string, tone: EventTone = "signal") => {
    const elapsed = runStartedAt.current > 0 ? (performance.now() - runStartedAt.current) / 1000 : 0;
    const event: StudioEvent = {
      id: eventId.current,
      label,
      detail,
      at: `T+${elapsed.toFixed(2)}`,
      tone,
    };
    eventId.current += 1;
    setEvents((current) => [event, ...current].slice(0, 6));
  }, []);

  const clearDemoTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const closeSession = useCallback(() => {
    session.current?.close();
    session.current = null;
    sessionConfig.current = null;
    setEnergy(0);
  }, []);

  useEffect(() => {
    return () => {
      clearDemoTimers();
      closeSession();
    };
  }, [clearDemoTimers, closeSession]);

  const animateWords = useCallback(
    (text: string, startDelay = 0, onDone?: () => void, limit?: number) => {
      const nextWords = text.trim().split(/\s+/);
      const wordsToAnimate = nextWords.slice(0, limit ?? nextWords.length);
      wordsToAnimate.forEach((_, index) => {
        const timer = setTimeout(
          () => {
            setActiveWord(index);
            setHeardCount(index + 1);
            setEnergy(0.34 + ((index * 17) % 5) * 0.1);
            if (index === wordsToAnimate.length - 1) onDone?.();
          },
          startDelay + index * 235,
        );
        timers.current.push(timer);
      });
    },
    [],
  );

  const runGuidedDemo = useCallback(() => {
    clearDemoTimers();
    setMode("replay");
    setPhase("composing");
    setSentence(PRIMARY_SENTENCE);
    setLanguage("english");
    setActiveWord(-1);
    setHeardCount(0);
    setLatency(164);
    setEnergy(0);
    setNotice("Guided replay: a deterministic preview of the live interaction, without spending credits.");
    runStartedAt.current = performance.now();
    eventId.current = 1;
    setEvents([{ id: 0, label: "INTENT", detail: "14 words composed from two selections", at: "T+0.00", tone: "signal" }]);

    timers.current.push(
      setTimeout(() => {
        setPhase("speaking");
        pushEvent("AUDIO", "first byte · 164 ms", "voice");
        pushEvent("GENERATE", "partial sentence streaming", "signal");
        animateWords(PRIMARY_SENTENCE, 0, undefined, 7);
      }, 720),
      setTimeout(() => {
        setPhase("interrupted");
        setEnergy(0);
        setHeardCount(7);
        setActiveWord(6);
        setNotice("Interrupted at the heard boundary. Unplayed words were dropped.");
        pushEvent("CANCEL", "7 heard · 7 unheard words dropped", "cut");
      }, 2650),
      setTimeout(() => {
        setSentence(REVISED_SENTENCE);
        setActiveWord(-1);
        setHeardCount(0);
        setPhase("composing");
        pushEvent("REVISE", "speaker changed the intended meaning", "signal");
      }, 3900),
      setTimeout(() => {
        setPhase("speaking");
        setNotice("Intent revised. The same voice session continues.");
        pushEvent("RESUME", "same voice · same session", "voice");
        animateWords(REVISED_SENTENCE, 0, () => {
          setPhase("complete");
          setEnergy(0);
          pushEvent("COMPLETE", "listener received the revised turn", "complete");
        });
      }, 4700),
    );
  }, [animateWords, clearDemoTimers, pushEvent]);

  const interrupt = useCallback(() => {
    if (phase !== "speaking") return;
    clearDemoTimers();
    session.current?.cancel();
    setEnergy(0);
    setPhase("interrupted");
    setNotice(`Stopped after “${words[Math.max(0, heardCount - 1)] ?? "the last word"}”. Edit and resume when ready.`);
    pushEvent("CUT", `${heardCount} heard · local audio queue cleared`, "cut");
  }, [clearDemoTimers, heardCount, phase, pushEvent, words]);

  const speakLive = useCallback(async () => {
    clearDemoTimers();
    setMode("live");
    setPhase("composing");
    setActiveWord(-1);
    setHeardCount(0);
    setNotice("Opening a private, short-lived AssemblyAI voice session…");
    runStartedAt.current = performance.now();
    eventId.current = 1;
    setEvents([{ id: 0, label: "CONNECT", detail: "minting a 60-second browser token", at: "T+0.00", tone: "signal" }]);

    try {
      const nextConfig = `${voiceId}:${language}`;
      if (session.current && sessionConfig.current !== nextConfig) {
        closeSession();
      }

      if (!session.current) {
        session.current = new AssemblyAITTSSession({
          onStatus: (status) => {
            if (status === "speaking") setPhase("speaking");
            if (status === "cancelled") setPhase("interrupted");
          },
          onSessionReady: (sessionId, wordBoundaries) => {
            pushEvent("BEGIN", `${sessionId.slice(0, 8)} · timing ${wordBoundaries ? "on" : "off"}`, "signal");
          },
          onWord: (_, index) => {
            setActiveWord(index);
            setHeardCount(index + 1);
          },
          onFrame: (type, detail) => {
            const tone: EventTone = type === "Cancel" || type === "Cancelled" ? "cut" : type === "Audio" ? "voice" : "signal";
            pushEvent(type.toUpperCase(), detail, tone);
          },
          onPlaybackComplete: () => {
            setPhase("complete");
            setActiveWord(-1);
            setEnergy(0);
            pushEvent("COMPLETE", "playback reached the listener", "complete");
          },
          onEnergy: setEnergy,
          onLatency: (milliseconds) => setLatency(milliseconds),
          onError: (message) => {
            setPhase("error");
            setNotice(message);
            pushEvent("ERROR", message, "cut");
          },
        });
        sessionConfig.current = nextConfig;
      }

      await session.current.connect(voiceId, language);
      setNotice("Live session connected. Audio and word timing are streaming from AssemblyAI.");
      await session.current.speakStreamed(sentence.trim());
    } catch (error) {
      setPhase("error");
      setNotice(error instanceof Error ? error.message : "The live voice session could not start.");
    }
  }, [clearDemoTimers, closeSession, language, pushEvent, sentence, voiceId]);

  const reset = useCallback(() => {
    clearDemoTimers();
    session.current?.cancel();
    setPhase("idle");
    setSentence(PRIMARY_SENTENCE);
    setLanguage("english");
    setActiveWord(-1);
    setHeardCount(0);
    setLatency(null);
    setEnergy(0);
    setNotice("Ready for another turn.");
    runStartedAt.current = 0;
    eventId.current = 1;
    setEvents(INITIAL_EVENTS);
  }, [clearDemoTimers]);

  const choosePhrase = useCallback((phrase: string) => {
    clearDemoTimers();
    setSentence(phrase.endsWith(".") ? phrase : `${phrase}.`);
    setPhase("composing");
    setActiveWord(-1);
    setHeardCount(0);
    setNotice("Phrase selected. Add detail or speak it as written.");
  }, [clearDemoTimers]);

  const switchLanguage = () => {
    clearDemoTimers();
    closeSession();
    const next = language === "english" ? "spanish" : "english";
    setLanguage(next);
    setSentence(next === "spanish" ? SPANISH_SENTENCE : REVISED_SENTENCE);
    setActiveWord(-1);
    setHeardCount(0);
    setPhase("composing");
    setNotice(`Language set to ${next}. TTS language is explicit, never guessed.`);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("textarea, input, select, [contenteditable='true']")) return;
      const chipIndex = Number(event.key) - 1;
      if (chipIndex >= 0 && chipIndex < PHRASE_CHIPS.length) {
        event.preventDefault();
        choosePhrase(PHRASE_CHIPS[chipIndex]);
      }
      if (event.key === "Escape") interrupt();
      if (event.key.toLowerCase() === "r") runGuidedDemo();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [choosePhrase, interrupt, runGuidedDemo]);

  return (
    <div className={`studio-shell ${highContrast ? "is-high-contrast" : ""}`}>
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="SecondVoice home">
          <span className="wordmark-mark"><Waves size={19} /></span>
          SECONDVOICE
        </a>
        <div className="topbar-center">
          <span className={`live-dot live-dot--${phase}`} />
          {PHASE_LABELS[phase]}
        </div>
        <div className="topbar-actions">
          <button
            className={`contrast-toggle ${highContrast ? "is-active" : ""}`}
            onClick={() => setHighContrast((current) => !current)}
            aria-pressed={highContrast}
            aria-label="Toggle high contrast"
          >
            <Contrast size={15} />
          </button>
          <div className="mode-switch" aria-label="Demo source">
            <button className={mode === "replay" ? "is-active" : ""} onClick={() => setMode("replay")}>Replay</button>
            <button className={mode === "live" ? "is-active" : ""} onClick={() => setMode("live")}>Live</button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><ShieldCheck size={16} /> Consent-first assistive speech</div>
          <h1>Your words.<br /><span>Your timing.</span><br />Still your voice.</h1>
          <p>
            Compose with a few intentional inputs. Speak before the sentence is finished.
            Interrupt instantly. SecondVoice keeps the speaker in control of every turn.
          </p>
          <div className="hero-actions">
            <button className="button button--primary" onClick={runGuidedDemo}>
              <Play size={17} fill="currentColor" /> Run the 90-second demo
            </button>
            <button className="button button--quiet" onClick={reset}>
              <RotateCcw size={16} /> Reset turn
            </button>
          </div>
        </div>

        <div className={`sculpture-frame sculpture-frame--${phase}`}>
          <VoiceSculpture energy={energy} phase={phase} progress={progress} reducedMotion={reduceMotion} />
          <div className="sculpture-label">
            <span>VOICE / MAYA-01</span>
            <strong>{Math.round(progress * 100).toString().padStart(2, "0")}% heard</strong>
          </div>
          <div className="sculpture-axis" aria-hidden="true"><span /><span /><span /></div>
        </div>
      </section>

      <section className="instrument" aria-label="SecondVoice instrument">
        <div className="instrument-rail">
          <div>
            <label className="rail-label" htmlFor="voice">Voice</label>
            <select
              id="voice"
              value={voiceId}
              onChange={(event) => {
                closeSession();
                setVoiceId(event.target.value);
              }}
            >
              {VOICES.map((voice) => (
                <option value={voice.id} key={voice.id}>{voice.label} · {voice.tone}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="rail-label">First audio</span>
            <strong>{latency ? `${latency} ms` : "—"}</strong>
          </div>
          <div>
            <span className="rail-label">Language</span>
            <strong>{language.toUpperCase()}</strong>
          </div>
          <div>
            <span className="rail-label">Transport</span>
            <strong>PCM / 24 kHz</strong>
          </div>
        </div>

        <div className="phrase-palette">
          <div className="section-heading">
            <span>Intent palette</span>
            <small>One tap starts the thought</small>
          </div>
          <div className="chip-row">
            {PHRASE_CHIPS.map((phrase, index) => (
              <button
                key={phrase}
                className="phrase-chip"
                onClick={() => choosePhrase(phrase)}
                aria-keyshortcuts={`${index + 1}`}
                title={`Shortcut: ${index + 1}`}
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>

        <div className="sentence-stage">
          <div className="section-heading">
            <span>Sentence timeline</span>
            <small>Solid = heard · outline = not yet heard</small>
          </div>
          <div className="word-timeline" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {words.map((word, index) => {
                const heard = index < heardCount;
                const current = index === activeWord;
                return (
                  <motion.span
                    layout
                    key={`${word}-${index}`}
                    className={`timeline-word ${heard ? "is-heard" : ""} ${current ? "is-current" : ""}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </AnimatePresence>
            {phase === "interrupted" && <span className="interrupt-mark">CUT</span>}
          </div>
          <label className="composer-label" htmlFor="sentence">Edit the next turn</label>
          <textarea
            id="sentence"
            value={sentence}
            onChange={(event) => {
              clearDemoTimers();
              setSentence(event.target.value);
              setActiveWord(-1);
              setHeardCount(0);
              setPhase("composing");
            }}
            rows={3}
          />

          <div className="transport-row">
            <div className="transport-group">
              <button className="button button--live" onClick={speakLive} disabled={!sentence.trim() || phase === "speaking"}>
                <AudioLines size={18} /> Speak live
              </button>
              <button className="button button--interrupt" onClick={interrupt} disabled={phase !== "speaking"}>
                <CircleStop size={18} /> Interrupt
              </button>
            </div>
            <button className="language-control" onClick={switchLanguage}>
              <Languages size={17} /> {language === "english" ? "Switch to Spanish" : "Switch to English"}
            </button>
          </div>

          <p className={`system-notice system-notice--${phase}`}>{notice}</p>

          <JudgeConsole
            activeVoice={activeVoice}
            events={events}
            heardCount={heardCount}
            heardText={heardText}
            language={language}
            mode={mode}
            phase={phase}
            totalWords={words.length}
          />
        </div>
      </section>

      <section className="evidence-strip">
        <div className="evidence-intro">
          <span className="eyebrow"><Sparkles size={15} /> The technical proof</span>
          <h2>The interface shows what the voice system is actually doing.</h2>
        </div>
        <div className="evidence-grid">
          <article><span>01</span><h3>Streams early</h3><p>Partial text enters one persistent TTS session so speech can begin before the thought is fully composed.</p></article>
          <article><span>02</span><h3>Stops cleanly</h3><p>Cancel halts synthesis and clears browser audio already queued for playback.</p></article>
          <article><span>03</span><h3>Tracks what landed</h3><p>Word boundaries drive the heard timeline and degrade gracefully if timing is unavailable.</p></article>
        </div>
      </section>

      <footer>
        <span>SECONDVOICE / ASSEMBLYAI TTS HACKATHON</span>
        <span><Mic2 size={14} /> Built for a speaker, not around them.</span>
      </footer>
    </div>
  );
}
