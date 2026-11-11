import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin } from "../lib/request-origin.ts";
test("production accepts only exact same origins, with no dev alias exception", () => {
  assert.equal(
    isAllowedOrigin(
      "https://secondvoice-green.vercel.app",
      "https://secondvoice-green.vercel.app/api/tts/token",
    ),
    true,
  );
  assert.equal(
    isAllowedOrigin(
      "https://example.com",
      "https://secondvoice-green.vercel.app/api/tts/token",
    ),
    false,
  );
  assert.equal(
    isAllowedOrigin(
      "http://127.0.0.1:4176",
      "http://localhost:4176/api/tts/token",
    ),
    false,
  );
});
test("development handles Next's loopback hostname normalization without accepting outside origins", () => {
  const url = "http://localhost:4176/api/tts/token";
  assert.equal(isAllowedOrigin("http://127.0.0.1:4176", url, true), true);
  for (const origin of [
    "http://example.com:4176",
    "http://127.0.0.1:4177",
    "https://127.0.0.1:4176",
    "null",
    "bad",
    "http://127.0.0.1:4176/path",
  ])
    assert.equal(isAllowedOrigin(origin, url, true), false);
});
