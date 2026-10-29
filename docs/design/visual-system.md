# SecondVoice visual system

## Subject and job

SecondVoice is a speaker-owned voice agent for someone who can intentionally type or tap but cannot reliably speak. The page has one job: let the speaker compose, stream, interrupt, and revise a conversational turn while a judge can see what the agent and listener receive.

## Reference method

The system borrows the structural method behind Bill Zhang's winning voice-agent projects, not their branding:

- TalkTuahBank: person/context on the left, live conversation in the center, agent state and tools on the right.
- DispatchAI: deliberate density, calm operational hierarchy, visible human authority.
- PortfolioV5: the authored environment is the memorable artifact; interface chrome remains quiet.

## Palette

- Void — `#080a0e`: the working environment.
- Graphite — `#0d1117`: primary operating surfaces.
- Raised graphite — `#121820`: editable and inspectable regions.
- Signal blue — `#6aaffb`: voice transport, active agent stage, primary action.
- Warm amber — `#e8b44f`: heard audio, replay controls, important human-visible state.
- Cut red — `#f06a5c`: interruption and errors only.

## Type

- Instrument Sans Variable: interface, sentences, and hierarchy.
- JetBrains Mono Variable: protocol events, timings, and labels that are genuinely technical.

Both are self-hosted. Marketing-scale typography is intentionally absent from the operator surface.

## Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ SecondVoice          speaker + state          replay / live  │
├──────────────┬───────────────────────────┬───────────────────┤
│ speaker      │ live voice session        │ agent state       │
│ quick intent │ spectral voice terrain    │ listener view     │
│ voice config │ message + heard boundary  │ protocol events   │
│              │ speak / stop              │                   │
└──────────────┴───────────────────────────┴───────────────────┘
```

Mobile keeps the live session first, then horizontal quick intents, then agent/listener evidence.

## Signature

The live voice terrain is a perspective field of formant-like ridges driven by real PCM energy. Amber traces mark heard audio, blue traces show voice energy, and a vertical playhead advances with the word-boundary timeline. Interruption freezes the terrain and marks the exact cut. It communicates the product's real state without a generic avatar, orb, or decorative model.

## Anti-template check

The cockpit is dark because it is an operational voice system used during a conversation, not because it is an AI product. Its grid, panels, and mono type carry actual state. There is no marketing hero, feature-card strip, gradient copy, glossy 3D object, or ornamental glow. Every visible panel answers one question: what the speaker intends, what is being spoken, what the listener heard, or what the agent did.
