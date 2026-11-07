import { test } from "node:test";
import assert from "node:assert/strict";
import { AssemblyAITTSSession } from "../lib/assemblyai/tts-session.ts";

test("closing during token mint prevents a late WebSocket connection", async () => {
  const oldFetch = globalThis.fetch;
  const oldAudio = globalThis.AudioContext;
  const oldSocket = globalThis.WebSocket;
  let finish!: (response: Response) => void;
  let opened = 0;
  class Audio { state = "running"; currentTime = 0; async resume() {} async close() { this.state = "closed"; } }
  class Socket { static OPEN = 1; constructor() { opened += 1; } }
  Object.assign(globalThis, { AudioContext: Audio, WebSocket: Socket, fetch: () => new Promise<Response>(resolve => { finish = resolve; }) });
  try {
    const session = new AssemblyAITTSSession();
    const connecting = session.connect("aai-audrey", "english");
    await new Promise(resolve => setImmediate(resolve));
    session.close();
    finish(Response.json({ token: "test-only" }));
    await assert.rejects(connecting, /cancelled/);
    assert.equal(opened, 0);
  } finally { Object.assign(globalThis, { fetch: oldFetch, AudioContext: oldAudio, WebSocket: oldSocket }); }
});

test("closed sessions ignore queued Audio and cannot reconnect", async () => {
  const oldFetch = globalThis.fetch;
  const oldAudio = globalThis.AudioContext;
  const oldSocket = globalThis.WebSocket;
  const sockets: Socket[] = [];
  let audioCallbacks = 0;
  class Audio { state = "running"; currentTime = 0; async resume() {} async close() { this.state = "closed"; } }
  class Socket {
    static OPEN = 1; readyState = 1;
    onmessage: ((event: {data: string}) => void) | null = null;
    onclose: (() => void) | null = null;
    constructor() { sockets.push(this); }
    close() { this.readyState = 3; this.onclose?.(); }
    send() {}
  }
  Object.assign(globalThis, { AudioContext: Audio, WebSocket: Socket, fetch: async () => Response.json({ token: "test-only" }) });
  try {
    const session = new AssemblyAITTSSession({ onStatus: status => { if (status === "speaking") audioCallbacks += 1; } });
    const connecting = session.connect("aai-audrey", "english");
    await new Promise(resolve => setImmediate(resolve));
    sockets[0].onmessage?.({ data: JSON.stringify({ type: "Begin", id: "test", configuration: { sample_rate: 24000, word_boundaries: true, voice_id: "aai-audrey" } }) });
    await connecting;
    session.close();
    sockets[0].onmessage?.({ data: JSON.stringify({ type: "Audio", flush_id: 0, audio: "AAA=" }) });
    assert.equal(audioCallbacks, 0);
    await assert.rejects(session.connect("aai-audrey", "english"), /ended/);
  } finally { Object.assign(globalThis, { fetch: oldFetch, AudioContext: oldAudio, WebSocket: oldSocket }); }
});
