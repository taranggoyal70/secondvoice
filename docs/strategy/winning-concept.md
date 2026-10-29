# Winning concept: SecondVoice

## One-line pitch

**A real-time, consent-first voice prosthesis that helps people losing speech communicate in a voice that still feels like theirs.**

SecondVoice turns a short typed or selected intent into immediate, interruptible speech. The speaker can stop a sentence mid-stream, revise it, and continue without waiting for a whole audio file to render. A shared visual timeline shows exactly what the listener has heard.

This is the strongest strategic direction from the [competitor and hackathon research](../research/competitor-and-hackathon-research.md): the problem has human stakes, voice is indispensable, the AssemblyAI capabilities are visible, and the complete transformation fits inside a short demo.

## Why it can win

- Removing TTS destroys the product rather than merely removing a feature.
- The sponsor technology is used deeply: partial-text streaming, persistent sessions, cancellation, word boundaries, voice selection or consented cloning, and multilingual output.
- The demo has an emotional outcome and a technical “how did it do that?” moment.
- The UI can be visually authored without burying the product in dashboard cards.
- It is narrow enough to make reliable before the deadline.
- It follows the repeatable pattern in strong voice-AI winners without copying their product domains: specific constraint, necessary voice, visible system state, real-time transformation, replayable demo.

## The 90-second judge demo

1. Introduce Maya, a fictional speaker who can type or tap but cannot reliably speak. State clearly that this is a communication prototype, not a medical device.
2. Show a consented voice profile. For the public demo, use the builder's own cloned voice or an AssemblyAI catalog voice.
3. Tap two predictive phrase chips: **“Tell them”** and **“I need more time.”** Add a few typed words.
4. The sentence planner begins streaming text before the full reply is complete. AssemblyAI starts speaking almost immediately.
5. Word-boundary events illuminate each spoken word on a shared “heard” timeline. Unsounded words remain dim.
6. Interrupt mid-sentence. The audio stops, the local playback queue clears, and the UI preserves the exact heard/unheard boundary.
7. Change the intent to **“I want to answer for myself.”** Resume in the same voice.
8. Switch the text and TTS language to Spanish and speak one short line.
9. Close on the promise: communication that is fast enough for a real turn in conversation and personal enough to preserve identity.

## Signature interface: the voice instrument

Avoid a medical dashboard and generic AI gradients. The main surface should feel like an instrument the speaker controls.

- A large sentence timeline is the visual star.
- Spoken words become solid and bright; generated-but-unheard words remain translucent.
- Predictive phrase petals orbit the composition area and can be selected with one tap or keyboard shortcut.
- A subtle React Three Fiber identity form reacts to real audio energy and speaking state. It should communicate idle, composing, speaking, interrupted, and listening—not exist as a decorative orb.
- A thin engineering rail exposes live latency, selected voice, language, WebSocket state, and the last cancel event for judges.
- Palette: warm paper, deep graphite, electric vermilion, and one cool signal color. Typography should be editorial and highly legible.
- Provide reduced-motion and high-contrast modes from the start.

## Architecture

```text
phrase chips / keyboard / optional STT
                 |
                 v
       intent + sentence planner
          partial text stream
                 |
                 v
   AssemblyAI-TTS-1 WebSocket session
      |          |             |
      |          |             +--> WordBoundaries
      |          +----------------> audio chunks
      +---------------------------> cancel / flush
                 |
                 v
        browser audio worklet
      + sentence timeline reducer
      + purposeful spectral voice terrain
```

Recommended stack:

- Next.js, React, and TypeScript.
- React Three Fiber and Drei for the small identity form.
- Zustand or a typed reducer for the event state machine.
- Web Audio API plus an AudioWorklet for streamed PCM playback and immediate queue flushing.
- AssemblyAI-TTS-1 over one persistent WebSocket session.
- AssemblyAI word boundaries for exact spoken-word state.
- AssemblyAI voice catalog first; consented cloning only when the consent story is demonstrably clean.
- A small structured-output LLM adapter for predictive phrase expansion, with a local deterministic planner fallback.
- Vercel for the web app and token-minting route.

## Hackathon scope

### Build

- One speaker profile.
- One stock voice plus an optional consented clone.
- Phrase chips, keyboard composition, and a streaming sentence planner.
- English and Spanish output.
- Live streamed audio, exact heard/unheard timeline, cancel, edit, and resume.
- Five deterministic demo intents.
- Live and Replay modes using the same event contract.
- One polished landing page, architecture view, demo video, and source repo.

### Do not build

- Medical diagnosis, treatment recommendations, or clinical claims.
- Eye tracking, hardware switches, or custom assistive devices.
- A general-purpose AAC vocabulary system.
- Accounts, payments, collaboration, or persistent health records.
- Emotion controls, SSML, speech-speed controls, or pronunciation dictionaries that the current API does not support.
- More than two languages before the primary demo is flawless.
- A large 3D world.

## First technical checkpoint

Prove this before building the visual design:

1. Mint a temporary browser token without exposing the permanent API key.
2. Open one persistent TTS WebSocket session.
3. Stream partial sentence text, flush on a sentence boundary, and play PCM in the browser.
4. Render word boundaries against the sentence timeline.
5. Cancel while audio is playing and clear already-buffered client audio.
6. Send a replacement sentence over the same session.

If any part is unreliable, keep one language and a catalog voice until the full loop is stable.

## Demo reliability

- Keep the real AssemblyAI path intact and clearly labeled Live.
- Record one successful run as event JSON plus audio chunks and replay it through the same reducers, captions, and animation states.
- Make Replay mode explicit; never present captured output as live.
- Warm the voice session before the judge begins.
- Keep demo sentences short and rehearse the exact interrupt point.
- Show a friendly failure state instead of crashing when synthesis or token minting fails.

## Ethics and claims

- Clone only the builder's voice or another adult's voice with explicit, documented consent.
- Make deleting or replacing a cloned voice visible in the prototype story.
- Call this an accessibility communication prototype, not a medical device.
- Do not suggest it restores speech or replaces a speech-language professional.
- Use fictional user data in screenshots and the demo.

## Submission story

**Problem:** losing natural speech can also mean losing conversational speed and vocal identity.

**Product:** SecondVoice turns a few intentional inputs into speech that starts quickly, can be interrupted, and preserves a consented vocal identity.

**Technical magic:** AssemblyAI streams the partial sentence, returns word timing, cancels mid-utterance, and resumes in another language over a persistent session.

**Vision:** an assistive voice should feel owned and controlled by the speaker, not like a slow text box that talks.

## Before coding

- **Deadline confirmed by the user with the organizers: November 7, 2026 at 11:00 AM PST.** Ignore the stale dates still visible in the Luma body and submission form.
- **Team: one solo builder.** Scope and sequencing must preserve a complete, recordable demo at every checkpoint.
- Ask organizers for the judging rubric; it is not visible on the official public pages.
- Confirm team size and available build hours.
- Claim the credits and create the AssemblyAI API key. Store it locally as `ASSEMBLYAI_API_KEY`; never paste it into chat or commit it.
- Use AssemblyAI's dashboard agent for at least the initial API spike if that is the organizer's bonus criterion, and preserve honest evidence of that use for the submission.

