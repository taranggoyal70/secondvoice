import { test } from "node:test";
import assert from "node:assert/strict";
import { ListenSession } from "../lib/assemblyai/listen-session.ts";

test("cancelling while permission is pending releases late microphone tracks without connecting", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let resolve!: (stream: unknown) => void;
  let stopped = 0;
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: { getUserMedia: () => new Promise(done => { resolve = done; }) } } });
  try {
    const session = new ListenSession({ onReady: () => assert.fail("must not start"), onTranscript: () => assert.fail(), onQuestion: () => assert.fail(), onError: () => assert.fail("cancel is not an error") });
    const start = session.start();
    session.close(); session.close();
    resolve({ getTracks: () => [{ stop: () => stopped++ }] });
    await start;
    assert.equal(stopped, 1);
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
  }
});

test("permission denial reports a usable fallback instead of leaving listening active", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const errors: string[] = [];
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: { getUserMedia: async () => { throw new DOMException("denied", "NotAllowedError"); } } } });
  try {
    const session = new ListenSession({ onReady: () => assert.fail(), onTranscript: () => assert.fail(), onQuestion: () => assert.fail(), onError: message => errors.push(message) });
    await session.start();
    assert.equal(errors.length, 1);
    assert.match(errors[0], /type the question/);
    await session.start();
    assert.equal(errors.length, 1, "a closed session cannot reopen");
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
  }
});

test("the listening deadline includes stalled setup and releases an already-open microphone", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const navigatorBefore = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const audioBefore = globalThis.AudioContext;
  const fetchBefore = globalThis.fetch;
  let resume!: () => void;
  let stopped = 0;
  let contextsClosed = 0;
  const errors: string[] = [];
  class Audio {
    state = "running";
    resume() { return new Promise<void>(resolve => { resume = resolve; }); }
    async close() { this.state = "closed"; contextsClosed++; }
  }
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => stopped++ }] }) } } });
  Object.assign(globalThis, { AudioContext: Audio, fetch: async () => assert.fail("expired setup must never request a token") });
  try {
    const session = new ListenSession({ onReady: () => assert.fail(), onTranscript: () => assert.fail(), onQuestion: () => assert.fail(), onError: message => errors.push(message) });
    const pending = session.start();
    await new Promise(resolve => setImmediate(resolve));
    t.mock.timers.tick(29999);
    assert.equal(stopped, 0);
    t.mock.timers.tick(1);
    assert.equal(stopped, 1);
    assert.equal(contextsClosed, 1);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /30 seconds/);
    resume();
    await pending;
    session.close();
    assert.equal(stopped, 1);
  } finally {
    if (navigatorBefore) Object.defineProperty(globalThis, "navigator", navigatorBefore);
    Object.assign(globalThis, { AudioContext: audioBefore, fetch: fetchBefore });
  }
});

test("a permission result arriving after the deadline is immediately released", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const before = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let permission!: (value: unknown) => void;
  let stopped = 0;
  let errors = 0;
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: { getUserMedia: () => new Promise(resolve => { permission = resolve; }) } } });
  try {
    const session = new ListenSession({ onReady: () => assert.fail(), onTranscript: () => assert.fail(), onQuestion: () => assert.fail(), onError: () => errors++ });
    const pending = session.start();
    t.mock.timers.tick(30000);
    permission({ getTracks: () => [{ stop: () => stopped++ }] });
    await pending;
    assert.equal(stopped, 1);
    assert.equal(errors, 1);
  } finally {
    if (before) Object.defineProperty(globalThis, "navigator", before);
  }
});
