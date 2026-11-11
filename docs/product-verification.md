# SecondVoice product verification — November 10, 2026

## Scope

A public landing page with the existing provider recordings, a separate `/speak` workspace, browser-local reusable phrases, a text-only listener view, independent next-draft editing, accessibility settings, and a visual README.

## Automated

`npm run lint`, `npm test` (10 passing checks), and `npm run build` passed. The production build emits `/`, `/speak`, the TTS token route, the icon, and the generated Open Graph image. `git diff --check` passed.

The original five playback/lifecycle tests remain intact. Three phrase tests cover malformed storage, duplicates, bounds and immutable saves. Two request-origin tests cover production exact-origin checks and development-only loopback aliases with matching protocol/port.

## Browser observations

- A real English message completed in the dev server and production build.
- A real Spanish message using Constanza completed.
- A longer utterance reached SPEAKING. A different next draft was entered, Stop/Escape was used, and STOPPED BY YOU appeared without replacing the next draft. This early stop preceded availability of word timings; the history explicitly says so.
- `ControlOrMeta+Enter` started the revised message, which completed with nine of nine displayed words. The browser tool's initial wait expired before completion; a subsequent direct observation confirmed completion.
- An explicitly saved phrase survived reload. The draft and conversation record cleared on reload. The saved phrase could be selected and removed.
- Clear exposed Undo; Undo restored the draft.
- Show message opened a native modal with the exact draft, focus on Back to writing, and no new speech request. Escape closed it and returned focus to Show message.
- Desktop UI and measured 390 CSS-pixel layout had no horizontal document overflow. Larger text and high contrast remained usable, including the listener dialog.
- The landing example played real recordings, stopped at its configured word boundary, and played the revised recording.
- A floating-point inline style mismatch in the initial waveform was reproduced and fixed by rounding static waveform heights. No further hydration error appeared in the subsequent production-build run; browser logs retained the earlier pre-fix dev entry.
- Development Next.js normalizes the incoming URL hostname to localhost. The first 127.0.0.1 test was rejected by the pre-existing strict-origin check. The fix only accepts loopback aliases in development with matching scheme and port. Production behavior remains exact-origin.

## Capture provenance

README images are captured from the actual production build with neutral example text. `workspace.png` follows real provider completion; `interrupted.png` follows actual cancellation. `stop-and-revise.gif` captures the labeled prerecorded landing example, not a live synthesis session. Original screenshots were not replaced with generated product mockups. The standalone redacted award image is an AI-assisted edit supplied separately and is not included in repository evidence.

## Limits

This is not a clinical usability study, screen-reader certification, or physical-device test. Reduced-motion CSS was reviewed but the OS preference was not emulated in this browser. Hardware speaker output and network interruption on actual phones require hands-on verification. Live voice still depends on AssemblyAI and the shared public allowance. The initial page load needs internet; no offline service worker was added.

## Published release check

Production deployment `dpl_BRsWranA1XUqiQcfBKotKqzZPC2e` reached READY at `https://secondvoice-green.vercel.app`, using feature commit `c54353f` and presentation commit `0b57b70`. The remote main README was read back and matched the visual version.

`node scripts/verify-deployment.mjs` confirmed public page 200, public short-lived token issuance 200, cross-origin request 403, and the real recording available as WAV. No token value was printed or saved in the verification report.

In the production browser, the landing phrase link opened `/speak?starter=more-time` with the expected editable phrase and no automatic speech. Clicking Speak completed real synthesis and displayed six of six words with a Completed record. The production tab's browser error/warning log was empty.

## Visual redesign — November 10, 2026

The product presentation now uses a bright violet-and-ink identity, a full-width dark recorded speech stage, feature illustrations built in code, and a separate communication workspace with larger controls. The speech ribbon starts and settles with recorded playback state; it is a visual indicator, not a measured audio spectrum. Scroll entrances run once and honor reduced-motion CSS. The live workspace retains its provider-derived energy bars.

Browser checks covered desktop, measured 390px and 320px CSS widths, larger text, high contrast, modal listener presentation, real synthesis completion, and Escape cancellation while preserving a separate next draft. The narrow navigation button was adjusted after inspection. Neither tested width had horizontal document overflow; overflowing waveform bars are clipped within their own visual container. The browser error/warning log was empty.

The README screenshots and silent stop/revise GIF were recaptured from the final production build. The social image kit was refreshed to match. Existing playback, phrase, and origin tests still pass (10), along with lint and the production build. Reduced-motion behavior remains source-reviewed rather than OS-emulated.

## Words-to-speech choreography — November 10, 2026

The recorded example now keeps a source document visible alongside its spoken rendering. DOM-measured word chips travel between the same tokens as playback timing arrives. Stop cancels every in-flight animation, collapses the ribbon, and marks the last timed word. Revision uses an exact-token longest-common-subsequence diff to highlight changed words while retaining the previous example text. The live workspace shares this renderer; if the next draft differs from the playing utterance, decorative words originate locally in the playback panel instead of incorrectly leaving the new draft.

A revision base is carried only from an interrupted or explicitly revised message. A normal new turn after completed speech has no revision badge. Browser checks confirmed actual provider playback, stopping after the first timed word, preserving a different next draft, and a subsequent revised message. The landing sequence survived rapid Speak → Revise → Interrupt changes and ended on the correct original phrase with zero remaining word-flight elements. Escape during an in-flight word also left zero elements. The stacked example was checked at a measured 390px width without horizontal overflow. The earlier viewport attempt affected the selected browser tab rather than the hidden test tab; it was reset, and the measured check was repeated on the selected preview.

Twelve automated tests pass, including new cases for word-diff preservation, repeated words, insertion, clamped timing bursts and backwards timing. Lint and the production build pass. The motion is decorative and does not delay or manufacture audio. The ribbon is a playback-state illustration, not a measured spectrum. Reduced motion is implemented in CSS and the animation guard; OS preference behavior is source-reviewed, not hardware-tested.
