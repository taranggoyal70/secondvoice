type ListenEvents = {
  onReady: () => void;
  onTranscript: (text: string) => void;
  onQuestion: (text: string) => void;
  onError: (message: string) => void;
};

// One explicitly started question per session. Closing always releases the microphone.
export class ListenSession {
  private closed = false;
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private socket: WebSocket | null = null;
  private source: AudioNode | null = null;
  private recorder: AudioWorkletNode | null = null;
  private sample: AudioBufferSourceNode | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private clock: ReturnType<typeof setInterval> | null = null;
  private abort = new AbortController();
  private rejectConnection: ((reason: Error) => void) | null = null;
  constructor(private events: ListenEvents) {}

  async start(recordedQuestion = false) {
    try {
      if (this.closed) return;
      this.timeout = setTimeout(() => this.fail("Listening has stopped after 30 seconds. Try again or type the question."), 30000);
      if (!recordedQuestion) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
        if (this.closed) { stream.getTracks().forEach(track => track.stop()); return; }
        this.stream = stream;
      }
      const context = new AudioContext({ sampleRate: 16000 });
      this.context = context;
      await context.resume();
      if (this.closed) return;
      let recording: AudioBuffer | null = null;
      if (recordedQuestion) {
        const response = await fetch("/voices/question.wav", { signal: this.abort.signal });
        if (!response.ok) throw new Error("Sample unavailable");
        recording = await context.decodeAudioData(await response.arrayBuffer());
      } else {
        await context.audioWorklet.addModule("/audio/pcm-worklet.js");
      }
      if (this.closed) return;
      const response = await fetch("/api/listen/token", { method: "POST", signal: this.abort.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Listening couldn’t connect.");
      if (this.closed) return;
      const query = new URLSearchParams({ token: data.token, sample_rate: String(context.sampleRate), encoding: "pcm_s16le", speech_model: "universal-streaming-multilingual" });
      const socket = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?${query}`);
      this.socket = socket;
      await new Promise<void>((resolve, reject) => {
        this.rejectConnection = reject;
        socket.onmessage = event => {
          if (this.closed) return;
          try {
            const message = JSON.parse(event.data);
            if (message.type === "Begin") { this.rejectConnection = null; resolve(); }
            if (message.type === "Error" || message.error) this.fail("Transcription couldn’t continue. Please try again.");
            if (message.type === "Turn" && typeof message.transcript === "string") {
              const text = message.transcript.trim();
              if (text.length > 700) { this.fail("That question is too long. Please ask a shorter question or type it."); return; }
              this.events.onTranscript(text);
              if (message.end_of_turn && text) {
                this.close();
                this.events.onQuestion(text);
              }
            }
          } catch { this.fail("The transcription connection returned an unreadable response."); }
        };
        socket.onerror = () => this.fail("Listening lost its connection. Please try again.");
        socket.onclose = () => { if (!this.closed) this.fail("Listening disconnected. Please try again."); };
      });
      if (this.closed) return;
      this.events.onReady();
      if (recording) {
        const player = context.createBufferSource();
        player.buffer = recording;
        player.connect(context.destination);
        this.sample = player;
        const values = recording.getChannelData(0);
        let offset = 0;
        const size = Math.round(context.sampleRate / 10);
        this.clock = setInterval(() => {
          if (this.closed || socket.readyState !== WebSocket.OPEN) return;
          const chunk = new Int16Array(size);
          for (let i = 0; i < size; i++) {
            const value = Math.max(-1, Math.min(1, values[offset++] || 0));
            chunk[i] = Math.round(value * (value < 0 ? 32768 : 32767));
          }
          socket.send(chunk.buffer);
          if (offset > values.length + context.sampleRate) {
            clearInterval(this.clock!); this.clock = null;
            socket.send(JSON.stringify({ type: "ForceEndpoint" }));
          }
        }, 100);
        player.start();
      } else {
        const source = context.createMediaStreamSource(this.stream!);
        const recorder = new AudioWorkletNode(context, "pcm-recorder");
        this.source = source; this.recorder = recorder;
        recorder.port.onmessage = event => {
          if (!this.closed && socket.readyState === WebSocket.OPEN) socket.send(event.data);
        };
        source.connect(recorder);
        recorder.connect(context.destination);
      }
    } catch (error) {
      if (!this.closed) this.fail(error instanceof Error && error.name === "NotAllowedError"
        ? "Microphone access was declined. You can type the question or try the recorded example."
        : error instanceof Error ? error.message : "Listening couldn’t start. Please try again.");
    }
  }

  private fail(message: string) {
    if (this.closed) return;
    this.close();
    this.events.onError(message);
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.abort.abort();
    this.rejectConnection?.(new Error("Listening cancelled"));
    this.rejectConnection = null;
    if (this.timeout) clearTimeout(this.timeout);
    if (this.clock) clearInterval(this.clock);
    if (this.sample) { try { this.sample.stop(); } catch {} this.sample.disconnect(); }
    this.source?.disconnect();
    if (this.recorder) { this.recorder.port.onmessage = null; this.recorder.disconnect(); }
    this.stream?.getTracks().forEach(track => track.stop());
    if (this.context && this.context.state !== "closed") void this.context.close();
    if (this.socket) {
      this.socket.onmessage = null; this.socket.onerror = null; this.socket.onclose = null;
      if (this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: "Terminate" }));
      this.socket.close();
    }
  }
}
