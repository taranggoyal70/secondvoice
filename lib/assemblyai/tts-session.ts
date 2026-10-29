export type SupportedLanguage = "english" | "spanish";

export type TimedWord = {
  word: string;
  start: number;
  end: number;
  confidence: number;
};

type ServerFrame =
  | {
      type: "Begin";
      id: string;
      configuration: { sample_rate: number; word_boundaries: boolean; voice_id: string };
    }
  | { type: "Audio"; audio: string; flush_id: number }
  | { type: "FlushDone"; flush_id: number; audio_duration_ms: number }
  | { type: "WordBoundaries"; flush_id: number; audio_start_ms: number; words: TimedWord[] }
  | { type: "Cancelled"; audio_duration_seconds: number }
  | { type: "Termination" }
  | { type: "Error"; error: string; error_type: string; retryable: boolean };

type SessionCallbacks = {
  onStatus?: (status: "connecting" | "ready" | "speaking" | "cancelled" | "closed") => void;
  onSessionReady?: (sessionId: string, wordBoundaries: boolean) => void;
  onWord?: (word: TimedWord, index: number) => void;
  onFrame?: (type: string, detail: string) => void;
  onPlaybackComplete?: (flushId: number) => void;
  onError?: (message: string) => void;
  onLatency?: (milliseconds: number) => void;
};

export class AssemblyAITTSSession {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private sampleRate = 24000;
  private nextPlayAt = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private anchors = new Map<number, number>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private dropAudio = false;
  private requestStartedAt = 0;
  private connected = false;

  constructor(private callbacks: SessionCallbacks = {}) {}

  async connect(voiceId: string, language: SupportedLanguage) {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.callbacks.onStatus?.("connecting");
    const tokenResponse = await fetch("/api/tts/token", { cache: "no-store" });
    const tokenPayload = (await tokenResponse.json()) as { token?: string; error?: string; action?: string };

    if (!tokenResponse.ok || !tokenPayload.token) {
      throw new Error(tokenPayload.action ?? tokenPayload.error ?? "Could not create a temporary TTS token.");
    }

    this.audioContext ??= new AudioContext({ sampleRate: 24000 });
    await this.audioContext.resume();

    const params = new URLSearchParams({
      voice_id: voiceId,
      language,
      sample_rate: "24000",
      encoding: "pcm_s16le",
      word_boundaries: "true",
      token: tokenPayload.token,
    });

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(`wss://tts.us.assemblyai.com/v1/ws?${params}`);
      this.socket = socket;
      let handshakeSettled = false;

      socket.onmessage = (event) => {
        let frame: ServerFrame;
        try {
          frame = JSON.parse(event.data as string) as ServerFrame;
        } catch {
          this.callbacks.onError?.("AssemblyAI returned a frame the app could not read.");
          return;
        }

        if (frame.type === "Begin") {
          this.sampleRate = frame.configuration.sample_rate;
          this.connected = true;
          handshakeSettled = true;
          this.callbacks.onStatus?.("ready");
          this.callbacks.onSessionReady?.(frame.id, frame.configuration.word_boundaries);
          this.callbacks.onFrame?.("Begin", `session ${frame.id.slice(0, 8)} · ${this.sampleRate / 1000} kHz`);
          resolve();
          return;
        }

        if (frame.type === "Audio") {
          if (this.dropAudio) return;
          this.callbacks.onStatus?.("speaking");
          if (this.requestStartedAt > 0) {
            const latency = Math.round(performance.now() - this.requestStartedAt);
            this.callbacks.onLatency?.(latency);
            this.callbacks.onFrame?.("Audio", `first byte · ${latency} ms`);
            this.requestStartedAt = 0;
          }
          this.scheduleAudio(frame);
          return;
        }

        if (frame.type === "WordBoundaries") {
          this.callbacks.onFrame?.("WordBoundaries", `${frame.words.length} timed words · request ${frame.flush_id}`);
          this.scheduleWords(frame);
          return;
        }

        if (frame.type === "FlushDone") {
          this.callbacks.onFrame?.("FlushDone", `${frame.audio_duration_ms} ms audio · request ${frame.flush_id}`);
          this.schedulePlaybackComplete(frame.flush_id);
          return;
        }

        if (frame.type === "Cancelled") {
          this.dropAudio = false;
          this.callbacks.onStatus?.("cancelled");
          this.callbacks.onFrame?.("Cancelled", `${Math.round(frame.audio_duration_seconds * 1000)} ms delivered before cut`);
          return;
        }

        if (frame.type === "Error") {
          const message = `${frame.error_type}: ${frame.error}`;
          this.callbacks.onError?.(message);
          this.callbacks.onFrame?.("Error", message);
          handshakeSettled = true;
          reject(new Error(message));
          return;
        }

        if (frame.type === "Termination") {
          this.connected = false;
          this.callbacks.onFrame?.("Termination", "session closed cleanly");
          this.callbacks.onStatus?.("closed");
        }
      };

      socket.onerror = () => {
        handshakeSettled = true;
        reject(new Error("The AssemblyAI TTS connection could not be opened."));
      };
      socket.onclose = () => {
        this.connected = false;
        this.callbacks.onStatus?.("closed");
        if (!handshakeSettled) {
          handshakeSettled = true;
          reject(new Error("The AssemblyAI TTS connection closed before the session was ready."));
        }
      };
    });
  }

  speak(text: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("The voice session is not connected.");
    }

    this.requestStartedAt = performance.now();
    this.callbacks.onFrame?.("Generate", "request queued · awaiting audio");
    this.socket.send(JSON.stringify({ type: "Generate", text }));
    this.socket.send(JSON.stringify({ type: "Flush" }));
  }

  cancel() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.dropAudio = true;
    this.callbacks.onFrame?.("Cancel", "cancel sent · local queue cleared");
    this.socket.send(JSON.stringify({ type: "Cancel" }));
    this.clearPlayback();
  }

  close() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "Terminate" }));
    }
    this.connected = false;
    this.clearPlayback();
  }

  private scheduleAudio(frame: Extract<ServerFrame, { type: "Audio" }>) {
    if (!this.audioContext) return;

    const binary = atob(frame.audio);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);

    const wholeBytes = bytes.byteLength & ~1;
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, wholeBytes / 2);
    const floats = new Float32Array(samples.length);
    for (let index = 0; index < samples.length; index += 1) floats[index] = samples[index] / 32768;

    const buffer = this.audioContext.createBuffer(1, floats.length, this.sampleRate);
    buffer.copyToChannel(floats, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const startAt = Math.max(this.nextPlayAt, this.audioContext.currentTime + 0.035);
    if (!this.anchors.has(frame.flush_id)) this.anchors.set(frame.flush_id, startAt);
    source.start(startAt);
    this.nextPlayAt = startAt + buffer.duration;
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  private scheduleWords(frame: Extract<ServerFrame, { type: "WordBoundaries" }>) {
    if (!this.audioContext) return;
    const anchor = this.anchors.get(frame.flush_id);
    if (anchor === undefined) return;

    frame.words.forEach((word, index) => {
      if (word.start === word.end) return;
      const at = anchor + (word.start - frame.audio_start_ms) / 1000;
      const delay = Math.max(0, (at - this.audioContext!.currentTime) * 1000);
      const timer = setTimeout(() => {
        this.callbacks.onWord?.(word, index);
        this.timers.delete(timer);
      }, delay);
      this.timers.add(timer);
    });
  }

  private schedulePlaybackComplete(flushId: number) {
    if (!this.audioContext) return;
    const delay = Math.max(0, (this.nextPlayAt - this.audioContext.currentTime) * 1000);
    const timer = setTimeout(() => {
      if (!this.dropAudio && this.connected) this.callbacks.onPlaybackComplete?.(flushId);
      this.timers.delete(timer);
    }, delay + 24);
    this.timers.add(timer);
  }

  private clearPlayback() {
    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // A source that already ended needs no cleanup.
      }
    });
    this.sources.clear();
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.anchors.clear();
    this.nextPlayAt = this.audioContext?.currentTime ?? 0;
  }
}
