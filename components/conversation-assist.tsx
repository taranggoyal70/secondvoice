"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { ArrowRight, Check, Ear, Mic, Pencil, Play, Square, Volume2 } from "lucide-react";
import { ListenSession } from "@/lib/assemblyai/listen-session";

export type ConversationHandle = { cancel: () => void };
type Props = {
  ref?: Ref<ConversationHandle>;
  language: "english" | "spanish";
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
  onSpeak: (text: string) => void;
  onEdit: (text: string) => void;
};

export function ConversationAssist({ ref, language, disabled, onStart, onStop, onSpeak, onEdit }: Props) {
  const [consent, setConsent] = useState(false);
  const [question, setQuestion] = useState("");
  const [replies, setReplies] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "connecting" | "listening" | "thinking" | "ready" | "error">("idle");
  const [notice, setNotice] = useState("A question comes in. You choose what comes next.");
  const [sample, setSample] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const session = useRef<ListenSession | null>(null);
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  const busy = phase === "connecting" || phase === "listening" || phase === "thinking";
  const cleanup = useCallback(() => {
    version.current++;
    session.current?.close(); session.current = null;
    request.current?.abort(); request.current = null;
  }, []);
  const cancel = useCallback(() => {
    cleanup();
    setPhase("idle");
    setNotice("Listening is off. Your words stay in your control.");
  }, [cleanup]);
  useImperativeHandle(ref, () => ({ cancel }), [cancel]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    const hidden = () => { if (document.hidden) cancel(); };
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", cancel);
    return () => {
      cleanup();
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", cancel);
    };
  }, [cancel, cleanup]);

  async function suggest(text: string, id: number) {
    if (id !== version.current || !text.trim()) return;
    setQuestion(text);
    setPhase("thinking");
    setNotice("Listening is off. Preparing a few possible replies…");
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch("/api/replies", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, language }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (id !== version.current) return;
      if (!response.ok) throw new Error(data.error || "Suggestions couldn’t load.");
      setReplies(data.replies);
      setPhase("ready");
      setNotice("Possible replies, not assumptions. Tap Speak only if it’s what you mean.");
    } catch (error) {
      if (id !== version.current) return;
      setPhase("error");
      setNotice(error instanceof Error ? error.message : "Suggestions couldn’t load. You can still write your own reply.");
    }
  }
  function start(recorded = false) {
    if (disabled || (!recorded && !consent)) return;
    onStart();
    cleanup();
    const id = version.current;
    setReplies([]); setChosen(null); setQuestion(""); setSample(recorded);
    setPhase("connecting");
    setNotice(recorded ? "Opening a recorded question. Your microphone stays off." : "Allow microphone access to hear one question.");
    const next = new ListenSession({
      onReady: () => { if (id === version.current) { setPhase("listening"); setNotice(recorded ? "Transcribing the recorded question live…" : "Listening for one question. Stops automatically after the speaker pauses."); } },
      onTranscript: text => { if (id === version.current) setQuestion(text); },
      onQuestion: text => { if (id === version.current) void suggest(text, id); },
      onError: error => { if (id === version.current) { setPhase("error"); setNotice(error); } },
    });
    session.current = next;
    void next.start(recorded);
  }

  return (
    <section className={`conversation-assist conversation-${phase}`} aria-labelledby="conversation-heading">
      <div className="conversation-heading">
        <div><span className="eyebrow">LESS TYPING. MORE YOU.</span><h2 id="conversation-heading">Stay in the conversation.</h2></div>
        <span className="listen-state"><i />{phase === "listening" ? sample ? "Recorded question" : "Microphone on" : phase === "connecting" && !sample ? "Opening microphone" : "Microphone off"}</span>
      </div>
      <div className="conversation-start">
        <label className="listening-consent"><input type="checkbox" checked={consent} disabled={disabled || busy} onChange={event => setConsent(event.target.checked)} />Everyone here knows and agrees to listening.</label>
        <div className="conversation-controls">
          {disabled && <button className="button stop-button" onClick={onStop}><Square size={15} fill="currentColor" />Stop speech</button>}
          {busy ? <button className="button listen-button" onClick={cancel}><Square size={15} />Cancel listening & suggestions</button> : <button className="button primary listen-button" disabled={!consent || disabled} onClick={() => start()}><Mic size={17} />Listen to a question</button>}
          <button className="text-button" disabled={busy || disabled} onClick={() => start(true)}><Play size={14} />Try a recorded question</button>
        </div>
        <p className="listening-privacy">Audio goes to AssemblyAI for transcription; the question goes to its AI gateway for reply suggestions. Listening ends after one turn. Nothing is spoken until you choose.</p>
      </div>
      <div className="conversation-flow">
        <div className="question-panel">
          <span className="conversation-label"><Ear size={16} />{sample ? "RECORDED EXAMPLE · LIVE TRANSCRIPTION" : "THE QUESTION"}</span>
          <p className="heard-question">{question || (phase === "listening" ? "Listening…" : "What would you like to say back?")}</p>
          {(phase === "listening" || phase === "thinking") && <div className="listening-bars" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ animationDelay: `${i * 0.07}s` }} />)}</div>}
          <details className="question-editor"><summary>Type or correct the question</summary><label>Question<textarea maxLength={700} value={question} disabled={busy || disabled} onChange={event => { cleanup(); setSample(false); setQuestion(event.target.value); setReplies([]); setChosen(null); setPhase("idle"); }} /></label><button className="button" disabled={!question.trim() || busy || disabled} onClick={() => { onStart(); cleanup(); setReplies([]); setChosen(null); void suggest(question, version.current); }}>Suggest replies<ArrowRight size={15} /></button></details>
        </div>
        <div className="reply-panel" aria-busy={phase === "thinking"}>
          <span className="conversation-label">YOUR POSSIBLE REPLIES</span>
          {replies.length ? <div className="reply-options">{replies.map((reply, index) => <div className={`reply-option ${chosen === reply ? "reply-chosen" : ""}`} key={reply} style={{ animationDelay: `${index * 0.09}s` }}>
            <p>{reply}</p><div><button className="reply-speak" aria-label={`Speak: ${reply}`} disabled={disabled || busy} onClick={() => { cleanup(); setChosen(reply); setPhase("ready"); onSpeak(reply); }}>{chosen === reply ? <Check size={17} /> : <Volume2 size={17} />}Speak</button><button className="reply-edit" aria-label={`Edit: ${reply}`} disabled={disabled || busy} onClick={() => { cancel(); onEdit(reply); }}><Pencil size={14} />Edit</button></div>
          </div>)}</div> : <div className="replies-empty"><span>{phase === "thinking" ? "Finding the words…" : "A few ways to answer."}</span><p>{phase === "thinking" ? "You’ll choose what sounds like you." : "Listen to a question, or try the recorded example. You can always write your own."}</p></div>}
        </div>
      </div>
      <p className="conversation-notice" role="status">{disabled && chosen ? `Speaking your choice: “${chosen}”` : notice}</p>
    </section>
  );
}
