import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReplyInput, parseReplies } from "../lib/replies.ts";

test("questions have bounded length and explicit supported language", () => {
  assert.deepEqual(parseReplyInput({ question: " Tea or water? ", language: "english" }), { question: "Tea or water?", language: "english" });
  for (const input of [null, {}, { question: "", language: "english" }, { question: "x".repeat(701), language: "english" }, { question: "Hello?", language: "unknown" }]) assert.throws(() => parseReplyInput(input));
});
test("provider output must contain exactly three distinct plain-text choices", () => {
  assert.deepEqual(parseReplies('```json\n{"replies":["Water, please.","Tea, please.","What else is there?"]}\n```'), ["Water, please.", "Tea, please.", "What else is there?"]);
  for (const input of [null, "invalid json", '{"replies":["yes"]}', '{"replies":["Yes","yes","No"]}', '{"replies":["<script>hello</script>","No","Maybe"]}', JSON.stringify({replies:["x".repeat(181),"No","Maybe"]})]) assert.throws(() => parseReplies(input));
  assert.throws(() => parseReplies(JSON.stringify({replies:["I am an AI assistant.","No","Maybe"]})));
});
