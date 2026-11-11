"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  Contrast,
  CornerDownLeft,
  Eye,
  MessageSquare,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  Type,
  Volume2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { SpeechScene } from "@/components/speech-scene";
import { Brand } from "@/components/brand";
import { ConversationAssist, type ConversationHandle } from "@/components/conversation-assist";
import { DEFAULT_ENGLISH_VOICE, VOICES } from "@/lib/voices";
import {
  AssemblyAITTSSession,
  type SupportedLanguage,
} from "@/lib/assemblyai/tts-session";
import {
  addPhrase,
  MAX_MESSAGE,
  PHRASES_KEY,
  readPhrases,
  STARTER_PHRASES,
} from "@/lib/phrases";

type Status =
  "ready" | "connecting" | "speaking" | "stopped" | "complete" | "error";
type Entry = {
  id: number;
  text: string;
  played: string;
  kind: "stopped" | "complete";
};
const STARTERS = STARTER_PHRASES.map((phrase) => phrase.text);
const subscribePhrases = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("secondvoice:phrases", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("secondvoice:phrases", callback);
  };
};
const getPhrases = () => {
  try {
    return localStorage.getItem(PHRASES_KEY);
  } catch {
    return null;
  }
};
const subscribeNetwork = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

export function SecondVoiceStudio({
  initialMessage = "",
}: {
  initialMessage?: string;
}) {
  const [text, setText] = useState(initialMessage);
  const [utterance, setUtterance] = useState("");
  const [previousMessage, setPreviousMessage] = useState("");
  const [speechRun, setSpeechRun] = useState(0);
  const [heard, setHeard] = useState("");
  const [status, setStatus] = useState<Status>("ready");
  const [voice, setVoice] = useState(DEFAULT_ENGLISH_VOICE);
  const [language, setLanguage] = useState<SupportedLanguage>("english");
  const [notice, setNotice] = useState(
    "Write a thought, or choose a phrase to make your own.",
  );
  const [history, setHistory] = useState<Entry[]>([]);
  const [contrast, setContrast] = useState(false);
  const [largeType, setLargeType] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [displayText, setDisplayText] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const previewAudio = useRef<HTMLAudioElement>(null);
  const previewGeneration = useRef(0);

  const [phraseNotice, setPhraseNotice] = useState("");
  const [clearedDraft, setClearedDraft] = useState<string | null>(null);
  const session = useRef<AssemblyAITTSSession | null>(null);
  const conversation = useRef<ConversationHandle>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const lastPlayed = useRef("");
  const currentMessage = useRef("");
  const revisionBase = useRef("");
  const entryId = useRef(0);
  const editor = useRef<HTMLTextAreaElement>(null);
  const listener = useRef<HTMLDialogElement>(null);
  const phraseValue = useSyncExternalStore(
    subscribePhrases,
    getPhrases,
    () => null,
  );
  const saved = useMemo(() => readPhrases(phraseValue), [phraseValue]);
  const online = useSyncExternalStore(
    subscribeNetwork,
    () => navigator.onLine,
    () => true,
  );
  const active = status === "connecting" || status === "speaking";
  const selectedVoice = VOICES[language].find((item) => item.id === voice)!;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hasText = Boolean(text.trim());
  const isSaved = saved.some(
    (phrase) => phrase.toLowerCase() === text.trim().toLowerCase(),
  );

  const dispose = useCallback(() => {
    generation.current++;
    session.current?.close();
    session.current = null;
    busy.current = false;
  }, []);
  useEffect(() => () => dispose(), [dispose]);

  const disposePreview = useCallback(() => {
    previewGeneration.current++;
    const player = previewAudio.current;
    if (!player) return;
    player.pause();
    player.onended = null;
    player.onerror = null;
  }, []);
  useEffect(() => {
    const player = previewAudio.current;
    const previewVersion = previewGeneration;
    return () => {
      previewVersion.current++;
      if (player) {
        player.pause();
        player.onended = null;
        player.onerror = null;
      }
    };
  }, []);
  const stopPreview = useCallback(() => {
    disposePreview();
    setPreviewing(false);
    setPreviewError("");
  }, [disposePreview]);
  async function previewVoice() {
    if (active) return;
    conversation.current?.cancel();
    if (previewing) { stopPreview(); return; }
    stopPreview();
    const player = previewAudio.current;
    if (!player) return;
    const id = previewGeneration.current;
    const failed = () => {
      if (previewGeneration.current !== id) return;
      disposePreview();
      setPreviewing(false);
      setPreviewError("Sample couldn’t load. Try preview again.");
    };
    player.src = selectedVoice.preview;
    player.currentTime = 0;
    player.onended = () => {
      if (previewGeneration.current === id) stopPreview();
    };
    player.onerror = failed;
    setPreviewing(true);
    try { await player.play(); } catch { failed(); }
  }

  const stop = useCallback(() => {
    conversation.current?.cancel();
    stopPreview();
    if (!busy.current) return;
    const played = lastPlayed.current;
    const message = currentMessage.current;
    revisionBase.current = message;
    session.current?.cancel();
    dispose();
    setStatus("stopped");

    if (message)
      setHistory((items) => [
        ...items.slice(-19),
        { id: ++entryId.current, text: message, played, kind: "stopped" },
      ]);
    setNotice(
      "Stopped. Your draft is still here. Edit it and speak when you’re ready.",
    );
  }, [dispose, stopPreview]);

  const speak = useCallback(async (reply?: string) => {
    const approved = (reply ?? text).trim();
    if (busy.current || !approved || approved.length > MAX_MESSAGE) return;
    conversation.current?.cancel();
    if (reply !== undefined) setText(approved);
    stopPreview();
    if (!navigator.onLine) {
      setNotice("You’re offline. You can still show your message on screen.");
      setStatus("error");
      return;
    }
    dispose();
    busy.current = true;
    const id = generation.current;
    const current = () => generation.current === id;
    setPreviousMessage(revisionBase.current);
    revisionBase.current = "";
    setSpeechRun((value) => value + 1);
    currentMessage.current = approved;
    lastPlayed.current = "";
    setUtterance(approved);
    setHeard("");
    setLatency(null);
    setEvents([]);

    setStatus("connecting");
    setNotice("Getting your voice ready. You can stop at any time.");
    const next = new AssemblyAITTSSession({
      onStatus: (state) => {
        if (current() && state === "speaking") {
          setStatus("speaking");
          setNotice(
            "Your message is playing. You can already write your next thought.",
          );
        }
      },
      onWord: (word, index) => {
        if (!current()) return;
        const portion = approved
          .split(/\s+/)
          .slice(0, index + 1)
          .join(" ");
        lastPlayed.current = portion;
        setHeard(portion);
      },

      onLatency: (value) => {
        if (current()) setLatency(value);
      },
      onFrame: (type, detail) => {
        if (current())
          setEvents((items) => [...items.slice(-11), `${type}: ${detail}`]);
      },
      onPlaybackComplete: () => {
        if (!current()) return;
        setHeard(approved);
        lastPlayed.current = approved;
        setHistory((items) => [
          ...items.slice(-19),
          {
            id: ++entryId.current,
            text: approved,
            played: approved,
            kind: "complete",
          },
        ]);
        setStatus("complete");

        setNotice("Message finished. Take your time with the next one.");
        dispose();
      },
      onError: (message) => {
        if (current()) {
          setStatus("error");

          setNotice(message);
          dispose();
        }
      },
    });
    session.current = next;
    try {
      await next.connect(voice, language);
      if (current()) await next.speakStreamed(approved);
    } catch (error) {
      if (current()) {
        setStatus("error");

        setNotice(
          error instanceof Error
            ? error.message
            : "Voice couldn’t start. Please try again, or show your message on screen.",
        );
        dispose();
      }
    }
  }, [dispose, language, text, voice, stopPreview]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stop();
        return;
      }
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "Enter" &&
        !listener.current?.open
      ) {
        event.preventDefault();
        void speak();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [speak, stop]);
  useEffect(() => {
    const leaving = () => stop();
    window.addEventListener("pagehide", leaving);
    return () => window.removeEventListener("pagehide", leaving);
  }, [stop]);

  function selectPhrase(phrase: string, revising = false) {
    revisionBase.current = revising ? phrase : "";
    setText(phrase);
    setClearedDraft(null);
    if (!active) {
      setStatus("ready");
      setNotice("Make it yours. Nothing is spoken until you press Speak.");
    }
    editor.current?.focus();
  }
  function persistPhrases(phrases: string[], message: string) {
    try {
      if (phrases.length)
        localStorage.setItem(PHRASES_KEY, JSON.stringify(phrases));
      else localStorage.removeItem(PHRASES_KEY);
      window.dispatchEvent(new Event("secondvoice:phrases"));
      setPhraseNotice(message);
    } catch {
      setPhraseNotice(
        "This browser couldn’t save phrases. Your draft is still available.",
      );
    }
  }
  function savePhrase() {
    const result = addPhrase(saved, text);
    if (result.phrases === saved) {
      setPhraseNotice(result.message);
      return;
    }
    persistPhrases(result.phrases, result.message);
  }
  function showMessage() {
    if (!hasText) return;
    stop();
    setDisplayText(text.trim());
    listener.current?.showModal();
  }
  const progressWords = heard.trim() ? heard.trim().split(/\s+/).length : 0;

  return (
    <main
      className={`studio-shell ${contrast ? "high-contrast" : ""} ${largeType ? "large-type" : ""}`}
    >
      <audio ref={previewAudio} preload="none" />
      <a href="#message" className="skip-link">
        Skip to your message
      </a>
      <header className="studio-nav">
        <Brand />
        <span className="workspace-label">YOUR SPEAKING SPACE</span>
        <div className="studio-preferences">
          <button
            className="icon-button"
            aria-label="Larger text"
            aria-pressed={largeType}
            onClick={() => setLargeType(!largeType)}
          >
            <Type size={19} />
            <span>Text size</span>
          </button>
          <button
            className="icon-button"
            aria-label="High contrast"
            aria-pressed={contrast}
            onClick={() => setContrast(!contrast)}
          >
            <Contrast size={19} />
            <span>Contrast</span>
          </button>
          <Link href="/" className="quiet-link back-link">
            <ArrowLeft size={15} /> About SecondVoice
          </Link>
        </div>
      </header>
      <div className="studio-content">
        <div className="workspace-intro">
          <div>
            <span className="eyebrow">YOUR SPEAKING SPACE</span>
            <h1>What would you like to say?</h1>
          </div>
          <p>
            Write. Speak. Take your time.
            <br />
            You’re in control.
          </p>
        </div>
        {!online && (
          <div className="offline-note" role="status">
            You’re offline. Keep writing, or use Show message. Live voice will
            return when you reconnect.
          </div>
        )}
        <ConversationAssist
          key={language}
          ref={conversation}
          language={language}
          disabled={active}
          onStart={stop}
          onStop={stop}
          onSpeak={(reply) => void speak(reply)}
          onEdit={(reply) => selectPhrase(reply)}
        />
        <div className="workspace-grid">
          <section className="compose-panel" aria-labelledby="compose-title">
            <div className="panel-heading">
              <span className="panel-index">01</span>
              <h2 id="compose-title">Write your message</h2>
              <span>{active ? "Your next draft" : "A place to begin"}</span>
            </div>
            <div className="editor-card">
              <div className="editor-top">
                <span>
                  <i className="status-dot" />{" "}
                  {active ? "NEXT THOUGHT" : "YOUR DRAFT"}
                </span>
                <span>Only speaks when you choose</span>
              </div>
              <label className="sr-only" htmlFor="message">
                Your message
              </label>
              <textarea
                ref={editor}
                id="message"
                placeholder="What would you like to say?"
                value={text}
                maxLength={MAX_MESSAGE}
                aria-describedby="draft-help"
                onChange={(event) => {
                  setText(event.target.value);
                  setClearedDraft(null);
                }}
              />
              <div className="editor-meta">
                <span id="draft-help">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                  <span className="char-count">
                    {" "}
                    · {text.length.toLocaleString()} / 1,800
                  </span>
                </span>
                <div>
                  <button
                    className="text-button"
                    onClick={savePhrase}
                    disabled={!hasText || isSaved}
                  >
                    {isSaved ? <Check size={14} /> : <Bookmark size={14} />}
                    {isSaved ? "Saved" : "Save phrase"}
                  </button>
                  <button
                    className="text-button"
                    disabled={!text}
                    onClick={() => {
                      setClearedDraft(text);
                      setText("");
                      editor.current?.focus();
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            {clearedDraft !== null && (
              <div className="undo-note">
                Draft cleared.
                <button
                  className="text-button"
                  onClick={() => {
                    setText(clearedDraft);
                    setClearedDraft(null);
                    editor.current?.focus();
                  }}
                >
                  <RotateCcw size={13} />
                  Undo
                </button>
              </div>
            )}
            <div className="voice-settings">
              <label>
                Voice
                <select
                  value={voice}
                  disabled={active}
                  onChange={(event) => {
                    stopPreview();
                    setVoice(event.target.value);
                  }}
                >
                  {VOICES[language].map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Language
                <select
                  value={language}
                  disabled={active}
                  onChange={(event) => {
                    stopPreview();
                    const selected = event.target.value as SupportedLanguage;
                    setLanguage(selected);
                    setVoice(VOICES[selected][0].id);
                  }}
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                </select>
              </label>
              <span>
                Synthesis language,
                <br />
                not translation.
              </span>
            </div>
            <div className="voice-audition">
              <div>
                <strong>{selectedVoice.description}</strong>
                <p role="status">{previewError || "Recorded sample · your message stays unchanged"}</p>
              </div>
              <button
                className="button"
                disabled={active}
                aria-pressed={previewing}
                onClick={() => void previewVoice()}
              >
                {previewing ? <Square size={14} fill="currentColor" /> : <Volume2 size={16} />}
                {previewing ? "Stop preview" : "Preview voice"}
              </button>
            </div>
            <div className="action-bar">
              <button
                className="button primary speak-button"
                disabled={active || !hasText || !online}
                onClick={() => void speak()}
              >
                <Volume2 size={19} />
                {status === "error" ? "Try voice again" : "Speak message"}
                <kbd>⌘ / Ctrl ↵</kbd>
              </button>
              <button
                className="button stop-button"
                disabled={!active}
                onClick={stop}
              >
                <Square size={14} fill="currentColor" />
                Stop<kbd>esc</kbd>
              </button>
              <button
                className="button show-button"
                disabled={!hasText}
                onClick={showMessage}
              >
                <Eye size={18} />
                <span>Show message</span>
              </button>
            </div>
            <p className="data-note">
              Only text you choose to speak goes to AssemblyAI. Your draft stays
              in this tab.
            </p>
            <div className="phrase-section">
              <div className="phrase-heading">
                <h3>A place to start</h3>
                <span>Tap to edit, then speak.</span>
              </div>
              <div className="starter-grid">
                {STARTERS.map((phrase) => (
                  <button key={phrase} onClick={() => selectPhrase(phrase)}>
                    {phrase}
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            </div>
            <div className="phrase-section saved-section">
              <div className="phrase-heading">
                <h3>
                  <Bookmark size={15} />
                  My phrases <span className="count-badge">{saved.length}</span>
                </h3>
                <span>Saved only on this browser.</span>
              </div>
              {saved.length ? (
                <ul className="saved-phrases">
                  {saved.map((phrase, index) => (
                    <li key={phrase}>
                      <button
                        className="saved-phrase"
                        onClick={() => selectPhrase(phrase)}
                      >
                        {phrase}
                        <CornerDownLeft size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Remove saved phrase ${index + 1}: ${phrase}`}
                        onClick={() =>
                          persistPhrases(
                            saved.filter((item) => item !== phrase),
                            "Phrase removed from this browser.",
                          )
                        }
                      >
                        <X size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="saved-empty">
                  <Plus size={17} />
                  <p>
                    Words you come back to.
                    <br />
                    <span>
                      Write a message and choose Save phrase to keep it here.
                    </span>
                  </p>
                </div>
              )}
              <p className="phrase-notice" role="status">
                {phraseNotice}
              </p>
            </div>
          </section>
          <section className="playback-panel" aria-labelledby="playback-title">
            <div className="panel-heading">
              <span className="panel-index coral">02</span>
              <h2 id="playback-title">Playback</h2>
              <span>At your pace</span>
            </div>
            <div className={`output-card is-${status}`}>
              <SpeechScene
                text={utterance}
                previousText={previousMessage}
                heard={progressWords}
                phase={status}
                run={speechRun}
                compact
                sourceElement={text.trim() === utterance ? editor : undefined}
              />
              {status === "stopped" && (
                <button
                  className="text-button revise-button"
                  onClick={() => selectPhrase(utterance, true)}
                >
                  <RotateCcw size={15} />
                  Revise this message
                </button>
              )}
            </div>
            <p
              className={`session-notice ${status === "error" ? "error" : ""}`}
              role="status"
            >
              {notice}
            </p>
            {status === "error" && (
              <div className="error-actions">
                <button
                  className="text-button"
                  disabled={!hasText}
                  onClick={showMessage}
                >
                  <Eye size={15} />
                  Show text instead
                </button>
                <Link href="/#experience">Try the recorded example</Link>
              </div>
            )}
            <div className="history-section">
              <div className="phrase-heading">
                <h3>
                  In this conversation{" "}
                  <span className="count-badge">{history.length}</span>
                </h3>
                {history.length > 0 && (
                  <button
                    className="text-button"
                    onClick={() => setHistory([])}
                  >
                    <Trash2 size={13} />
                    Clear record
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="history-empty">
                  <MessageSquare size={21} />
                  <p>
                    Your conversation will appear here.
                    <span>
                      It disappears when you reload or leave this page.
                    </span>
                  </p>
                </div>
              ) : (
                <ol>
                  {[...history].reverse().map((entry) => (
                    <li key={entry.id}>
                      <div>
                        <span className={`history-status ${entry.kind}`}>
                          {entry.kind === "stopped" ? (
                            <Square size={10} />
                          ) : (
                            <Check size={12} />
                          )}
                          {entry.kind === "stopped" ? "Stopped" : "Completed"}
                        </span>
                        <button
                          className="text-button"
                          aria-label={`Use message: ${entry.text}`}
                          onClick={() => selectPhrase(entry.text)}
                        >
                          Use again <CornerDownLeft size={13} />
                        </button>
                      </div>
                      <p>{entry.text}</p>
                      {entry.kind === "stopped" && (
                        <small>
                          {entry.played
                            ? `Timed playback before stopping: “${entry.played}”`
                            : "Stopped before word timing was available."}
                        </small>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <details className="session-details">
              <summary>
                Connection details <ArrowUpRight size={14} />
              </summary>
              <p>
                Live synthesis by AssemblyAI. Word highlights are best-effort
                timing, not proof of what someone heard.
              </p>
              <p>
                First audio frame:{" "}
                {latency === null
                  ? "not measured"
                  : `${latency} ms (excludes connection setup)`}
                . Shared public voice allowance applies.
              </p>
              <ol>
                {events.map((event, i) => (
                  <li key={i}>{event}</li>
                ))}
              </ol>
            </details>
          </section>
        </div>
      </div>
      {active && (
        <div className="mobile-playback">
          <span>
            <i className="status-dot" />
            {status === "connecting"
              ? "Connecting…"
              : "Your message is playing"}
          </span>
          <button className="button stop-button" onClick={stop}>
            <Square size={14} fill="currentColor" />
            Stop playback
          </button>
        </div>
      )}
      <footer className="workspace-footer">
        <span>A pause. Still your turn.</span>
        <Link href="/">
          About SecondVoice <ArrowUpRight size={13} />
        </Link>
      </footer>
      <dialog
        className="listener-dialog"
        ref={listener}
        aria-labelledby="listener-heading"
        onCancel={stop}
      >
        <header>
          <span className="eyebrow" id="listener-heading">
            A MESSAGE FOR YOU
          </span>
          <button
            className="button"
            autoFocus
            onClick={() => listener.current?.close()}
          >
            <X size={18} />
            Back to writing
          </button>
        </header>
        <div className="listener-message">{displayText}</div>
        <footer>
          <span>SecondVoice.</span>
          <span>Text only · no audio is playing</span>
        </footer>
      </dialog>
    </main>
  );
}
