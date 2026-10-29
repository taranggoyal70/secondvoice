# SecondVoice

A consent-first, real-time voice prosthesis that helps people losing speech communicate in a voice that still feels like theirs.

SecondVoice is a solo build for the AssemblyAI TTS Hackathon. The demo makes streaming speech visible: generated words begin translucent, become solid when heard, and remain visibly unplayed when the speaker interrupts.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Replay mode works without credentials.

For Live mode, rotate any key that has been exposed and set the replacement only in `.env.local`:

```bash
ASSEMBLYAI_API_KEY=your_rotated_key
```

Never commit `.env.local` or place the permanent key in browser code. The app mints a 60-second TTS token through `/api/tts/token` and opens the browser WebSocket with that temporary credential.

## Current demo slice

- authored responsive voice-instrument UI;
- guided compose → speak → interrupt → revise replay;
- real temporary-token route;
- live AssemblyAI TTS WebSocket transport with partial-text `Generate` frames;
- streamed PCM playback;
- `Cancel` handling that drops queued browser audio;
- best-effort `WordBoundaries` scheduling;
- real audio-energy input to the 3D voice sculpture;
- English and Spanish session configuration;
- live listener/event evidence console;
- reduced-motion, high-contrast, keyboard shortcuts, and keyboard-visible focus.

## Project notes

- [Winning concept](docs/strategy/winning-concept.md)
- [Visual system](docs/design/visual-system.md)
- [Competitor and hackathon research](docs/research/competitor-and-hackathon-research.md)
- [Creative alternative](docs/strategy/creative-alternative-echostage.md)

## Safety position

This is an accessibility communication prototype, not a medical device. Public demos must use an AssemblyAI catalog voice or an adult's voice cloned with explicit consent.
