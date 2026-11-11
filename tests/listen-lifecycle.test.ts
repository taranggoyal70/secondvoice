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
