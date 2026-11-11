import { test } from "node:test";
import assert from "node:assert/strict";
import { addPhrase, readPhrases } from "../lib/phrases.ts";

test("stored phrases tolerate corrupt or unexpected browser data", () => {
  for (const value of [null, "{", "null", "true", '{"text":"hello"}'])
    assert.deepEqual(readPhrases(value), []);
  assert.deepEqual(
    readPhrases(
      JSON.stringify([
        " Hello ",
        null,
        7,
        "hello",
        "",
        "Goodbye",
        "x".repeat(1801),
      ]),
    ),
    ["Hello", "Goodbye"],
  );
});
test("phrase slots and message length are bounded, with no silent eviction", () => {
  const full = Array.from({ length: 12 }, (_, i) => `Phrase ${i}`);
  assert.equal(readPhrases(JSON.stringify([...full, "extra"])).length, 12);
  assert.equal(addPhrase(full, "extra").phrases, full);
  assert.equal(addPhrase(full, "x".repeat(1801)).phrases, full);
});
test("saving trims, deduplicates, and never mutates the existing phrase list", () => {
  const original = ["Please wait."];
  assert.equal(addPhrase(original, " please wait. ").phrases, original);
  assert.deepEqual(addPhrase(original, " Thanks. ").phrases, [
    "Please wait.",
    "Thanks.",
  ]);
  assert.deepEqual(original, ["Please wait."]);
});
