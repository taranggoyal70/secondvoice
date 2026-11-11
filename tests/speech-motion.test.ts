import { test } from "node:test";
import assert from "node:assert/strict";
import { changedWordIndexes, wordFlightIndexes } from "../lib/speech-motion.ts";
test("revision highlights inserted words and preserves repeated words in order", () => {
  assert.deepEqual(
    [...changedWordIndexes("I want tea please", "I want water please")],
    [2],
  );
  assert.deepEqual([...changedWordIndexes("I I want tea", "I want tea")], []);
  assert.deepEqual(
    [...changedWordIndexes("I want tea", "I really want tea now")],
    [1, 4],
  );
  assert.deepEqual([...changedWordIndexes("", "First thought")], []);
  assert.deepEqual([...changedWordIndexes("same words", "same words")], []);
});
test("word flight follows new timing only, clamps bursts and refuses backwards movement", () => {
  assert.deepEqual(wordFlightIndexes(0, 2, 10), [0, 1]);
  assert.deepEqual(wordFlightIndexes(0, 100, 12), [7, 8, 9, 10, 11]);
  assert.deepEqual(wordFlightIndexes(8, 3, 12), []);
  assert.deepEqual(wordFlightIndexes(0, 0, 12), []);
});
