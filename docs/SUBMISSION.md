# AssemblyAI submission draft

## Name
SecondVoice

## Tagline
A pause. Still your turn. Compose, speak, stop, and revise on your terms.

## Builder
Tarang Goyal — solo

## What it does
SecondVoice is an assistive communication prototype for people who need more time to speak. A person chooses a starting phrase or types their own message, approves its exact wording, and hears it through AssemblyAI TTS. They can stop playback immediately, revise the message, and take another turn. A separate listener view follows playback using best-effort word timings, while a conversation record preserves completed and interrupted turns.

## AssemblyAI integration
The Next.js server mints a short-lived temporary token; the browser opens AssemblyAI's TTS WebSocket and sends Generate/Flush requests. Incoming 24 kHz PCM is scheduled through Web Audio. Stop sends Cancel and clears local audio buffers. WordBoundaries are anchored to the request's playback clock, rather than frame arrival time. Stock voices and English/Spanish synthesis are available. The public walkthrough uses captured AssemblyAI recordings and timing data, clearly distinguished from live synthesis.

## Why I built it
Speech interfaces should make room for pauses and corrections. The person composing a message should retain authority over its wording and timing. The demo focuses on that single conversational loop, with a readable interface and a dependable recorded path for judges.

## Technical challenges
Handling cancellation while a token is being minted; preventing late audio from restarting a stopped turn; distinguishing synthesis completion from playback completion; timing words against Web Audio; and protecting server credentials while allowing browser synthesis.

## Stack
Next.js 16, React 19, TypeScript, Web Audio API, AssemblyAI TTS WebSocket API, self-hosted Instrument Sans and JetBrains Mono, Vercel. HyperFrames packages actual interface captures and provider audio into the submission walkthrough.

## Evidence and limits
Live English and Spanish synthesis, interruption, revision, and the production access flow were tested. Observed first audio frames included 103 ms on one production browser request. This is a single test, not a benchmark or guarantee. The prototype has no clinical validation, voice cloning, LLM-generated text, or autonomous agent claims. The developer used Codex; do not claim use of AssemblyAI's dashboard builder agent.

## Links
- App: https://secondvoice-green.vercel.app/
- Source: https://github.com/taranggoyal70/secondvoice
- Video: https://secondvoice-green.vercel.app/demo/walkthrough.mp4

## Judge instructions
Use the public Walkthrough first: Begin speaking, Change your mind, Keep your turn. It plays recorded AssemblyAI audio. For an actual API call, select Live voice and use the separately supplied judge code. Type a sentence, press Speak message, stop during playback, edit, and speak again. The judge code is deliberately not in this public source file.

## Submission form
https://forms.gle/XCW2RdZGbarVLnKEA

Ready for manual submission once the repository, deployment, and video links are verified. This file is a draft, not a submission receipt.
