"use client";

import { ArrowRight, ArrowUpRight, Square, Volume2, RotateCcw, Waves, Contrast } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AssemblyAITTSSession, type SupportedLanguage } from "@/lib/assemblyai/tts-session";
import { PRIMARY_SENTENCE, REVISED_SENTENCE, PHRASE_CHIPS } from "@/lib/demo";
import originalRecording from "@/public/demo/original.json";
import revisedRecording from "@/public/demo/revised.json";

const BEATS = ["Find the words", "Begin speaking", "Change your mind", "Keep your turn"];
const TITLES = ["Every word belongs to you.", "A thought becomes a voice.", "You can change your mind.", "The conversation continues."];
type Status = "ready" | "connecting" | "speaking" | "stopped" | "complete" | "error";
type Entry = { text: string; kind: "stopped" | "complete"; simulated: boolean };

export function SecondVoiceStudio() {
  const [mode, setMode] = useState<"story" | "live">("story");
  const [beat, setBeat] = useState(0);
  const [status, setStatus] = useState<Status>("ready");
  const [text, setText] = useState(PRIMARY_SENTENCE);
  const [heard, setHeard] = useState("");
  const [voice, setVoice] = useState("aai-audrey");
  const [language, setLanguage] = useState<SupportedLanguage>("english");
  const [latency, setLatency] = useState<number | null>(null);
  const [notice, setNotice] = useState("Explore the four moments below, then try your own message with Live voice.");
  const [log, setLog] = useState<string[]>([]);
  const [history, setHistory] = useState<Entry[]>([]);
  const [contrast, setContrast] = useState(false);
  const recordedAudio = useRef<HTMLAudioElement | null>(null);
  const session = useRef<AssemblyAITTSSession | null>(null);
  const epoch = useRef(0);
  const busy = useRef(false);
  const lastHeard = useRef("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const active = status === "connecting" || status === "speaking";

  const dispose = useCallback(() => {
    epoch.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (recordedAudio.current) {
      recordedAudio.current.pause();
      recordedAudio.current.onended = null;
      recordedAudio.current.ontimeupdate = null;
      recordedAudio.current.onplaying = null;
      recordedAudio.current.onerror = null;
    }
    session.current?.close();
    session.current = null;
    busy.current = false;
  }, []);
  useEffect(() => () => dispose(), [dispose]);

  const story = useCallback((step: number) => {
    dispose();
    setMode("story"); setBeat(step); setLatency(null); setLog([]);
    setVoice("aai-audrey"); setLanguage("english");
    const phrase = step === 3 ? REVISED_SENTENCE : PRIMARY_SENTENCE;
    setText(phrase);
    const preview = "";
    setHeard(preview); lastHeard.current = preview;
    setStatus(step === 0 ? "ready" : "connecting");
    setHistory(step === 3 ? [{ text: "I need a little more time,", kind: "stopped", simulated: true }] : []);
    setNotice(["Explore this recorded example, or choose Live voice to speak your own message.", "Playing speech recorded from AssemblyAI. Timings follow the audio playback clock.", "This recorded example stops after the first phrase. You can stop live speech at any time.", "Playing the revised message. The earlier turn remains visible."][step]);
    if (step > 0 && recordedAudio.current) {
      const id = epoch.current;
      const audio = recordedAudio.current;
      const recording = step === 3 ? revisedRecording : originalRecording;
      const timings = recording.frames.find(frame => frame.type === "WordBoundaries")?.words ?? [];
      audio.src = step === 3 ? "/demo/revised.wav" : "/demo/original.wav";
      audio.currentTime = 0;
      busy.current = true;
      audio.onplaying = () => { if (id === epoch.current) setStatus("speaking"); };
      audio.ontimeupdate = () => {
        if (id !== epoch.current) return;
        const cutoff = step === 2 ? (timings[5]?.end ?? 1500) : Infinity;
        const elapsed = Math.min(audio.currentTime * 1000, cutoff);
        const portion = timings.filter(word => word.end <= elapsed).map(word => word.word).join(" ");
        lastHeard.current = portion; setHeard(portion);
        if (audio.currentTime * 1000 >= cutoff) { audio.pause(); busy.current = false; setStatus("stopped"); }
      };
      audio.onended = () => { if (id === epoch.current) { busy.current = false; setHeard(phrase); setStatus("complete"); } };
      audio.onerror = () => { if (id === epoch.current) { busy.current = false; setStatus("error"); setNotice("The recording could not load. Retry or use Live voice."); } };
      void audio.play().catch(() => { if (id === epoch.current) { busy.current = false; setStatus("ready"); setNotice("Press Play recording to enable audio in this browser."); } });
    }
  }, [dispose]);

  const changeMode = (next: "story" | "live") => {
    if (next === "story") { story(0); return; }
    dispose(); setMode(next); setStatus("ready"); setHeard(""); lastHeard.current = ""; setLatency(null);
    setHistory([]); setLog([]);
    setNotice(next === "live" ? "Write a message and press Speak. Only your chosen text is sent for synthesis." : "Recorded walkthrough · select a moment to explore.");
  };

  const stop = useCallback(() => {
    if (!busy.current && status !== "speaking") return;
    const received = lastHeard.current;
    session.current?.cancel();
    dispose(); setStatus("stopped");
    if (received) setHistory(previous => [...previous, { text: received, kind: "stopped", simulated: mode === "story" }]);
    setNotice("Playback stopped. Word timings are best-effort; the displayed text may not include every word played.");
  }, [dispose, mode, status]);

  const speak = async () => {
    if (busy.current || !text.trim()) return;
    dispose(); busy.current = true;
    const id = epoch.current;
    const utterance = text.trim();
    const current = () => epoch.current === id;
    setMode("live"); setStatus("connecting"); setHeard(""); lastHeard.current = ""; setLatency(null);
    setNotice("Connecting to AssemblyAI…");
    const next = new AssemblyAITTSSession({
      onStatus: state => { if (current() && state === "speaking") setStatus("speaking"); },
      onWord: (_, index) => {
        if (!current()) return;
        const portion = utterance.split(/\s+/).slice(0, index + 1).join(" ");
        lastHeard.current = portion; setHeard(portion);
      },
      onLatency: value => { if (current()) setLatency(value); },
      onFrame: (type, detail) => { if (current()) setLog(previous => [...previous.slice(-11), `${type}: ${detail}`]); },
      onPlaybackComplete: () => {
        if (!current()) return;
        setStatus("complete"); setHeard(utterance); lastHeard.current = utterance;
        setHistory(previous => [...previous, { text: utterance, kind: "complete", simulated: false }]);
        setNotice("Your message has finished playing.");
        dispose();
      },
      onError: message => { if (current()) { setStatus("error"); setNotice(message); dispose(); } },
    });
    session.current = next;
    try {
      await next.connect(voice, language);
      if (!current()) return;
      setNotice("Streaming your message. Press Stop or Escape at any time.");
      await next.speakStreamed(utterance);
    } catch (error) {
      if (!current()) return;
      setStatus("error"); setNotice(error instanceof Error ? error.message : "Could not start voice playback.");
      dispose();
    }
  };

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); stop(); return; }
      if ((event.target as HTMLElement)?.matches("input, textarea, select")) return;
      if (mode === "story" && event.key === "ArrowRight") { event.preventDefault(); story(Math.min(3, beat + 1)); }
      if (mode === "story" && event.key === "ArrowLeft") { event.preventDefault(); story(Math.max(0, beat - 1)); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [beat, mode, stop, story]);

  const receivedCount = heard ? heard.split(/\s+/).length : 0;
  return (
    <div className={`sheet ${contrast ? "high-contrast" : ""}`}>
      <audio ref={recordedAudio} preload="none" />
      <a href="#workspace" className="skip-link">Skip to voice workspace</a>
      <header className="site-nav">
        <a className="brand" href="#top"><Waves size={22} strokeWidth={2.5} /> SecondVoice<span className="brand-period">.</span></a>
        <nav aria-label="Main navigation"><a href="#workspace">Experience</a><a href="#mechanism">How it works</a></nav>
        <div className="nav-end"><button className="icon-button" aria-label="Toggle high contrast" aria-pressed={contrast} onClick={() => setContrast(!contrast)}><Contrast size={18} /></button><button className="button primary small" onClick={() => { changeMode("live"); document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" }); }}>Try your voice <ArrowUpRight size={16} /></button></div>
      </header>

      <section className="intro" id="top">
        <div className="intro-kicker"><span className="signal-square" /> A little more time. A voice of your own.</div>
        <h1><span className="dot-type">A pause.</span><br />Still your turn.</h1>
        <div className="intro-bottom"><p>For moments when speaking takes more.<br />Find your words, speak them, change your mind.</p><div className="intro-note"><span>ASSEMBLYAI × SECONDVOICE</span><span>An assistive communication prototype</span></div></div>
        <div className="thread-art" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
      </section>

      <section id="workspace" className="experience">
        <div className="section-bar"><span className="section-label">01 / THE EXPERIENCE</span><div className="mode-tabs" role="group" aria-label="Experience mode"><button aria-pressed={mode === "story"} onClick={() => changeMode("story")}>Walkthrough</button><button aria-pressed={mode === "live"} onClick={() => changeMode("live")}>Live voice <span className="tiny-dot" /></button></div></div>
        <div className="experience-heading"><h2>{mode === "story" ? TITLES[beat] : "Say it your way."}</h2><span className="mode-description">{mode === "story" ? "Recorded AssemblyAI audio · no API calls" : "Real synthesis · AssemblyAI"}</span></div>
        {mode === "story" && <div className="beat-track" aria-label="Walkthrough steps">{BEATS.map((label, i) => <button key={label} aria-current={beat === i ? "step" : undefined} onClick={() => story(i)}><span>{String(i + 1).padStart(2, "0")}</span>{label}<i /></button>)}</div>}

        <div className="conversation-grid">
          <section className="speaker-pane" aria-labelledby="speaker-title">
            <div className="pane-heading"><span className="letter-marker">A</span><h3 id="speaker-title">Your words</h3><span>What you want to say.</span></div>
            <div className="message-paper">
              <div className="message-person"><span className="person-mark">Y</span><div><strong>You</strong><span>You choose every word.</span></div><span className="draft-label">DRAFT</span></div>
              <label htmlFor="message">Your message</label>
              <textarea id="message" disabled={active} readOnly={mode === "story"} value={text} maxLength={1800} onChange={event => { dispose(); setText(event.target.value); setHeard(""); setStatus("ready"); }} />
              <div className="message-meta"><span>{words.length} words</span><button className="text-button" disabled={active || mode === "story"} onClick={() => { setText(""); setHeard(""); setStatus("ready"); }}>Clear</button></div>
              <div className="voice-controls"><label>Voice<select aria-label="Voice" disabled={active || mode === "story"} value={voice} onChange={event => setVoice(event.target.value)}><option value="aai-audrey">Audrey</option><option value="aai-titus">Titus</option><option value="aai-yasmin">Yasmin</option></select></label><label>Language<select aria-label="Language" disabled={active || mode === "story"} value={language} onChange={event => setLanguage(event.target.value as SupportedLanguage)}><option value="english">English</option><option value="spanish">Spanish</option></select></label></div>
              <div className="playback-controls"><button className="button primary" disabled={active || !text.trim()} onClick={mode === "story" ? () => story(beat === 3 ? 3 : 1) : speak}>{mode === "story" ? <ArrowRight size={17} /> : <Volume2 size={17} />}{mode === "story" ? "Play recording" : "Speak message"}</button><button className="button stop-button" disabled={!active} onClick={stop}><Square size={13} fill="currentColor" /> Stop <kbd>esc</kbd></button></div>
            </div>
            <div className="phrase-list"><span>A place to start</span>{PHRASE_CHIPS.slice(0, 3).map(phrase => <button key={phrase} disabled={active} onClick={() => { dispose(); setMode("live"); setText(`${phrase}.`); setHeard(""); setStatus("ready"); }}>{phrase}<ArrowUpRight size={14} /></button>)}</div>
          </section>

          <section className="listener-pane" aria-labelledby="listener-title">
            <div className="pane-heading"><span className="letter-marker orange">B</span><h3 id="listener-title">Your voice</h3><span>What reaches the listener.</span></div>
            <div className={`voice-output is-${status}`}><div className="output-label"><span className="tiny-dot" /> {mode === "story" ? `RECORDING / ${status.toUpperCase()}` : status.toUpperCase()}</div>
              <div className="spoken-text" aria-live="polite">{heard || <span className="empty-voice">Your next thought<br />starts here<span className="orange-text">.</span></span>}</div>
              <div className="voice-line" aria-hidden="true">{Array.from({ length: 55 }, (_, i) => <i key={i} style={{ height: `${status === "speaking" ? 8 + Math.abs(Math.sin(i * 1.3)) * 32 : 3}px`, animationDelay: `${i * 25}ms` }} />)}</div>
              <div className="output-foot"><span>{mode === "story" ? "Recorded word timings" : "Timed words · best effort"}</span><span>{receivedCount.toString().padStart(2, "0")} / {words.length.toString().padStart(2, "0")}</span></div>
            </div>
            {history.length > 0 && <div className="turn-history"><span className="section-label">CONVERSATION RECORD</span>{history.map((entry, i) => <div key={`${i}-${entry.text}`}><span>{entry.kind === "stopped" ? "Interrupted" : "Completed"}{entry.simulated ? " · recorded" : ""}</span><p>{entry.text}</p></div>)}</div>}
            <div className={`session-note ${status === "error" ? "error" : ""}`} role="status">{notice}</div>
            {mode === "live" && <span className="latency">Time to first audio frame: {latency === null ? "not measured" : `${latency} ms`}</span>}
          </section>
        </div>
        <div className="experience-footer"><span>Fig. 1 &nbsp; Your intent stays yours. Playback follows your lead.</span>{mode === "story" && <button className="text-button next-beat" onClick={() => story((beat + 1) % 4)}>{beat === 3 ? "Start again" : "Next moment"}{beat === 3 ? <RotateCcw size={16} /> : <ArrowRight size={16} />}</button>}</div>
        <details className="technical-details"><summary>Inspect the voice session <span>{mode === "story" ? "Recorded audio" : "Live protocol"}</span></summary><p>AssemblyAI streams audio from your approved text. Word timings can arrive late or be unavailable after cancellation. This view does not measure what another person actually heard.</p><ol>{log.map((item, i) => <li key={i}>{item}</li>)}</ol>{log.length === 0 && <p>No live protocol events yet.</p>}</details>
      </section>

      <section className="mechanism" id="mechanism"><span className="section-label">02 / THE PRINCIPLE</span><h2>Speaking is more than<br />pressing play.</h2><div className="mechanism-copy"><p>A conversation has pauses, corrections, and second thoughts. Your voice should leave room for all three.</p><p>Choose a phrase. Make it yours. Stop when you need to. SecondVoice puts those decisions within reach.</p><span className="prototype-note">Prototype scope: typed input, stock voices, streaming playback and interruption. No medical efficacy claims.</span></div></section>
      <footer><span className="brand">SecondVoice.</span><span>Made for the person speaking.</span><a href="https://www.assemblyai.com/docs/tts/getting-started/quickstart" target="_blank" rel="noreferrer">Powered by AssemblyAI <ArrowUpRight size={14} /></a></footer>
    </div>
  );
}
