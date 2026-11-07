# SecondVoice

**A pause. Still your turn.** An assistive communication prototype that lets the speaker compose a message, stream it as speech, stop playback, and revise their next turn.

[Try SecondVoice](https://secondvoice-green.vercel.app/) · [Watch the recorded walkthrough](https://secondvoice-green.vercel.app/demo/walkthrough.mp4)

## Try it

The public walkthrough plays real AssemblyAI recordings with saved word timings. Select its four moments to hear the original message, a mid-phrase stop, and the revision. It makes no API calls.

Choose **Live voice** to synthesize your own message. Judges receive an access code separately. Enter it when prompted, then press Speak message again. Press Stop or Escape to cancel; revise and speak again. Language selects synthesis language, not translation.

## Run locally

Requires Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev -- -p 4174
```

Set `ASSEMBLYAI_API_KEY` in the ignored local file. On Vercel, configure both that variable and `DEMO_ACCESS_CODE` as sensitive production environment variables. Never place the provider key in the frontend or repository.

## Architecture

```text
Approved text → browser TTS client → AssemblyAI WebSocket
                       ↑                    ↓
Server token route → temporary token     PCM audio + word timings
                                            ↓
                                   Web Audio playback → listener view
```

The server mints tokens with POST, a 30-second connection window, a 60-second session cap, and other AssemblyAI products disabled. Production live access is protected by a judge code and cross-origin token requests are refused. A shared code is a hackathon access control, not a full identity or global rate-limit system.

The client sends approved text in Generate/Flush frames, schedules PCM buffers, maps word ends to the playback clock, and clears buffers on Stop. Cancellation during connection setup invalidates the pending session. Late frames cannot resurrect a disposed session. The conversation record stays in memory and disappears on reload.

## Verification — November 7, 2026

```sh
npm run lint
npm test
npm run build
node --env-file=.env.local scripts/verify-provider.mjs
node --env-file=.env.local scripts/verify-cancel.mjs
```

- Real provider English synthesis: 4.16 seconds of 24 kHz PCM, word timings received, 91 ms to first frame in one direct test.
- Spanish synthesis: 5.20 seconds, word timings received, 159 ms to first frame in one direct test.
- Cancel acknowledged in 362 ms; a revised request succeeded on the same WebSocket with a new flush ID.
- Chrome: complete English playback, interrupted longer utterance, revised turn, and Spanish playback verified.
- Production Chrome: authorized live synthesis completed with a measured 103 ms first audio frame on that request.
- Production checks: public page/audio 200, unauthorized token request 401, authorized token request 200, cross-origin request 403.

These are individual observations, not latency guarantees or statistical benchmarks. First-frame timing excludes connection setup and is not time to audible sound. Word timing is best-effort and cannot establish what a human listener heard.

## Scope and attribution

Built solo by Tarang Goyal for the AssemblyAI TTS Hackathon. Next.js, React, TypeScript, Web Audio, and AssemblyAI TTS. The video uses actual deployed interface captures and real provider audio; it is a recorded walkthrough, not an uninterrupted live capture.

This prototype uses stock voices and user-approved text. It does not include voice cloning, an LLM planner, speech recognition, or a multi-agent system. No clinical effectiveness is claimed.

Design inspiration: [Continuity](https://github.com/aiden-guan/continuity), particularly its warm paper, typography, thin rules, and staged input/evidence presentation. Implementation and product copy are original; no Continuity code or assets were incorporated.
