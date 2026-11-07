import { test } from "node:test";
import assert from "node:assert/strict";
import { AssemblyAITTSSession } from "../lib/assemblyai/tts-session.ts";

async function fixture() {
  const saved = { fetch: globalThis.fetch, WebSocket: globalThis.WebSocket, AudioContext: globalThis.AudioContext };
  const clocks: Audio[] = [], sockets: Socket[] = [];
  let stopped = 0, scheduled = 0;
  class Audio {
    currentTime = 0; state = "running"; destination = {};
    constructor() { clocks.push(this); }
    async resume() {} async close() { this.state = "closed"; }
    createBuffer(_channels: number, length: number, rate: number) { return { duration: length / rate, copyToChannel() {} }; }
    createBufferSource() { return { buffer: null, connect() {}, start() { scheduled++; }, stop() { stopped++; }, onended: null }; }
  }
  class Socket {
    static OPEN = 1; readyState = 1; sent: string[] = [];
    onmessage: ((event: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    constructor() { sockets.push(this); }
    send(text: string) { this.sent.push(text); }
    close() { this.readyState = 3; this.onclose?.(); }
    frame(value: object) { this.onmessage?.({ data: JSON.stringify(value) }); }
  }
  Object.assign(globalThis, { AudioContext: Audio, WebSocket: Socket, fetch: async () => Response.json({ token: "test" }) });
  const heard: string[] = [], completed: number[] = [];
  const session = new AssemblyAITTSSession({ onWord: word => heard.push(word.word), onPlaybackComplete: id => completed.push(id) });
  const connected = session.connect("aai-audrey", "english");
  await new Promise(resolve => setImmediate(resolve));
  const socket = sockets[0], clock = clocks[0];
  socket.frame({ type: "Begin", id: "test", configuration: { sample_rate: 24000, word_boundaries: true, voice_id: "aai-audrey" } });
  await connected;
  return { session, socket, clock, heard, completed, stats: () => ({ stopped, scheduled }), cleanup: () => { session.close(); Object.assign(globalThis, saved); } };
}
const audio = { type: "Audio", audio: Buffer.alloc(4800).toString("base64"), flush_id: 0 };
const words = { type: "WordBoundaries", flush_id: 0, audio_start_ms: 0, words: [{ word: "Hello", start: 0, end: 100, confidence: 0.9 }] };

test("network FlushDone cannot finish playback while the audio clock is suspended", async () => {
  const f = await fixture();
  try {
    f.socket.frame(audio); f.socket.frame(words); f.socket.frame({ type: "FlushDone", flush_id: 0, audio_duration_ms: 100 });
    f.clock.state = "suspended"; f.clock.currentTime = 1;
    await new Promise(resolve => setTimeout(resolve, 70));
    assert.deepEqual(f.heard, []); assert.deepEqual(f.completed, []);
    f.clock.state = "running";
    await new Promise(resolve => setTimeout(resolve, 70));
    assert.deepEqual(f.heard, ["Hello"]); assert.deepEqual(f.completed, [0]);
  } finally { f.cleanup(); }
});

test("Cancel stops buffers and drops in-flight audio and timed callbacks", async () => {
  const f = await fixture();
  try {
    f.socket.frame(audio); f.socket.frame(words); f.socket.frame({ type: "FlushDone", flush_id: 0, audio_duration_ms: 100 });
    f.session.cancel();
    assert.ok(f.socket.sent.some(value => JSON.parse(value).type === "Cancel"));
    f.socket.frame(audio);
    f.clock.currentTime = 1;
    await new Promise(resolve => setTimeout(resolve, 70));
    assert.deepEqual(f.stats(), { stopped: 1, scheduled: 1 });
    assert.deepEqual(f.heard, []); assert.deepEqual(f.completed, []);
  } finally { f.cleanup(); }
});

test("sends the approved message once, without artificial per-token delay", async () => {
  const f = await fixture();
  try {
    await f.session.speakStreamed("I want to answer for myself.");
    assert.deepEqual(f.socket.sent.map(value => JSON.parse(value)), [{ type: "Generate", text: "I want to answer for myself." }, { type: "Flush" }]);
    await assert.rejects(f.session.speakStreamed(" "), /between 1 and 1800/);
  } finally { f.cleanup(); }
});
