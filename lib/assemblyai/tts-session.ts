export type SupportedLanguage = "english" | "spanish";

export type TimedWord = {
  word: string;
  start: number;
  end: number;
  confidence: number;
};

export type TTSClientEventType =
  | "Audio"
  | "Begin"
  | "Cancel"
  | "Cancelled"
  | "Error"
  | "FlushDone"
  | "Generate"
  | "Termination"
  | "WordBoundaries";

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
  onFrame?: (type: TTSClientEventType, detail: string) => void;
  onPlaybackComplete?: (flushId: number) => void;
  onEnergy?: (level: number) => void;
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
  private streamGeneration = 0;
  private disposed = false;
  private responseDelivered = false;

  constructor(private callbacks: SessionCallbacks = {}, private accessCode = "") {}

  async connect(voiceId: string, language: SupportedLanguage) {
    if (this.disposed) throw new Error("This voice session has ended.");
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.audioContext ??= new AudioContext({ sampleRate: 24000 });
    await this.audioContext.resume();
    this.callbacks.onStatus?.("connecting");
    const tokenResponse = await fetch("/api/tts/token", { method: "POST", headers: { "X-Demo-Access": this.accessCode }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    const tokenPayload = (await tokenResponse.json()) as { token?: string; error?: string; action?: string };

    if (!tokenResponse.ok || !tokenPayload.token) {
      throw new Error(tokenPayload.action ?? tokenPayload.error ?? "Could not create a temporary TTS token.");
    }

    if (this.disposed) throw new Error("Voice connection cancelled.");

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
      const timeout = setTimeout(() => {
        if (!handshakeSettled) { reject(new Error("Voice connection timed out. Please retry.")); socket.close(); }
      }, 12000);

      socket.onmessage = (event) => {
        if (this.disposed) return;
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
          clearTimeout(timeout);
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
          this.responseDelivered = true;
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
          clearTimeout(timeout);
          handshakeSettled = true;
          const message = `${frame.error_type}: ${frame.error}`;
          this.callbacks.onError?.(message);
          this.callbacks.onFrame?.("Error", message);
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
        clearTimeout(timeout);
        handshakeSettled = true;
        if (!this.disposed) this.callbacks.onError?.("Voice connection failed. Please retry.");
        reject(new Error("The AssemblyAI TTS connection could not be opened."));
      };
      socket.onclose = () => {
        clearTimeout(timeout);
        this.connected = false;
        if (!this.disposed && handshakeSettled && !this.responseDelivered) {
          this.callbacks.onError?.("Voice connection closed. Please retry.");
          this.clearPlayback();
        }
        this.callbacks.onStatus?.("closed");
        if (!handshakeSettled) {
          handshakeSettled = true;
          reject(new Error("The AssemblyAI TTS connection closed before the session was ready."));
        }
      };
    });
  }

  async speakStreamed(text: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("The voice session is not connected.");
    }

    const generation = this.streamGeneration + 1;
    this.streamGeneration = generation;
    this.requestStartedAt = performance.now();
    this.responseDelivered = false;
    if (!text.trim() || [...text].length > 1800) throw new Error("Enter a message between 1 and 1800 characters.");
    this.socket.send(JSON.stringify({ type: "Generate", text }));
    this.callbacks.onFrame?.("Generate", `approved message · ${text.length} characters`);

    if (generation !== this.streamGeneration) return;
    this.socket.send(JSON.stringify({ type: "Flush" }));
  }

  cancel() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.streamGeneration += 1;
    this.dropAudio = true;
    this.callbacks.onFrame?.("Cancel", "cancel sent · local queue cleared");
    this.socket.send(JSON.stringify({ type: "Cancel" }));
    this.clearPlayback();
  }

  close() {
    this.disposed = true;
    this.streamGeneration += 1;
    this.socket?.close();
    this.connected = false;
    this.clearPlayback();
    if (this.audioContext && this.audioContext.state !== "closed") void this.audioContext.close();
  }

  private scheduleAudio(frame: Extract<ServerFrame, { type: "Audio" }>) {
    if (!this.audioContext) return;

    const binary = atob(frame.audio);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);

    const wholeBytes = bytes.byteLength & ~1;
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, wholeBytes / 2);
    const floats = new Float32Array(samples.length);
    let energySum = 0;
    let energySamples = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index] / 32768;
      floats[index] = sample;
      if (index % 24 === 0) {
        energySum += sample * sample;
        energySamples += 1;
      }
    }
    const rms = energySamples > 0 ? Math.sqrt(energySum / energySamples) : 0;

    const buffer = this.audioContext.createBuffer(1, floats.length, this.sampleRate);
    buffer.copyToChannel(floats, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const startAt = Math.max(this.nextPlayAt, this.audioContext.currentTime + 0.035);
    if (!this.anchors.has(frame.flush_id)) this.anchors.set(frame.flush_id, startAt);
    source.start(startAt);
    this.atPlaybackTime(startAt, () => this.callbacks.onEnergy?.(Math.min(1, rms * 5.5)));
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
      const at = anchor + (word.end - frame.audio_start_ms) / 1000;
      this.atPlaybackTime(at, () => this.callbacks.onWord?.(word, index));
    });
  }

  private schedulePlaybackComplete(flushId: number) {
    if (!this.audioContext) return;
    this.atPlaybackTime(this.nextPlayAt, () => {
      if (!this.dropAudio && !this.disposed) this.callbacks.onPlaybackComplete?.(flushId);
    });
  }

  private atPlaybackTime(at: number, callback: () => void) {
    const tick = () => {
      if (this.disposed || this.dropAudio || !this.audioContext) return;
      const remaining = (at - this.audioContext.currentTime) * 1000;
      if (remaining <= 0 && this.audioContext.state === "running") { callback(); return; }
      const timer = setTimeout(() => { this.timers.delete(timer); tick(); }, Math.min(50, Math.max(10, remaining)));
      this.timers.add(timer);
    };
    tick();
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
