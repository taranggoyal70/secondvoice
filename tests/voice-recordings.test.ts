import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_ENGLISH_VOICE, VOICES } from "../lib/voices.ts";
import { PRIMARY_SENTENCE, REVISED_SENTENCE } from "../lib/demo.ts";

function verifyRecording(path: string, voice: string, text?: string) {
  const audio = readFileSync(new URL(`../public${path}`, import.meta.url));
  const metadata = JSON.parse(readFileSync(new URL(`../public${path.replace(/\.wav$/, ".json")}`, import.meta.url), "utf8"));
  assert.equal(audio.toString("ascii", 0, 4), "RIFF");
  assert.equal(audio.readUInt16LE(20), 1, "uncompressed PCM");
  assert.equal(audio.readUInt16LE(22), 1, "mono");
  assert.equal(audio.readUInt32LE(24), 24000, "native sample rate");
  assert.equal(audio.readUInt16LE(34), 16, "16-bit samples");
  assert.equal(audio.length - 44, metadata.audioBytes);
  assert.equal(metadata.durationMs, metadata.audioBytes / 48);
  assert.equal(metadata.voice, voice);
  if (text) assert.equal(metadata.text, text);
  const words: { word: string; start: number; end: number }[] = metadata.frames
    .filter((frame: { type: string }) => frame.type === "WordBoundaries")
    .flatMap((frame: { words: unknown[] }) => frame.words);
  assert.equal(words.map(word => word.word).join(" "), metadata.text);
  let start = 0;
  for (const word of words) {
    assert.ok(word.start >= start && word.end >= word.start && word.end <= metadata.durationMs);
    start = word.start;
  }
  return words;
}

test("every catalog voice has a matching native-rate recorded preview and timings", () => {
  for (const voice of Object.values(VOICES).flat()) verifyRecording(voice.preview, voice.id);
});

test("both demos use the default Peter voice and match the words shown, including interruption", () => {
  const words = verifyRecording("/demo/original.wav", DEFAULT_ENGLISH_VOICE, PRIMARY_SENTENCE);
  verifyRecording("/demo/revised.wav", DEFAULT_ENGLISH_VOICE, REVISED_SENTENCE);
  assert.equal(words.slice(0, 6).map(word => word.word).join(" "), "I need a little more time,");
  assert.ok(words[5].end < words[6].start, "interruption falls in a phrase pause");
});
