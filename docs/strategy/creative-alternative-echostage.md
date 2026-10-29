# Creative alternative: EchoStage

## One-line pitch

**Direct a live 3D story with your voice, hear a cast of distinct AI actors perform it, and interrupt the scene at any moment to change what happens next.**

EchoStage is the higher-spectacle, lower-stakes alternative to SecondVoice. It is not a chatbot wearing a 3D skin. It is a small, voice-directed performance engine built around AssemblyAI-TTS-1's strongest product qualities: streaming speech, low-latency conversational delivery, distinct voices, multilingual output, cancellation, and word timing.

## Why this is the right hack

- The new TTS model is the product, not a replaceable add-on. Without fast, natural, multi-voice speech, there is no experience.
- The demo is understood in one sentence and produces a memorable transformation on screen.
- It combines the user's preferred direction—an authored living 3D world, visible input-to-artifact transformation, and voice—with the repeated pattern behind strong voice-AI hackathon projects: voice is the interface, the system takes visible action, and the result is easy to retell.
- It avoids copying another winner's emergency, banking, or tutoring concept while borrowing the more durable playbook behind those wins.
- The project can be honest and impressive with a narrow scene, three characters, and one polished interruption path.

## The three-minute demo

1. Open on a dark miniature theater containing three silent characters and an empty story timeline.
2. Say: **“A research crew on Europa discovers that their ship's AI has been hiding a signal.”**
3. The stage assembles around the prompt: icy window, warning lights, captain, scientist, and ship AI. The timeline shows the generated beats.
4. Three characters begin performing with clearly different AssemblyAI voices. Their faces and captions animate from the live audio and word-boundary stream.
5. Interrupt mid-line: **“Freeze. The scientist already knows who sent it. Continue in Spanish.”**
6. Current audio cancels immediately. The scene visibly rewrites one beat, the scientist's state changes, and the cast continues in Spanish.
7. End on a generated share card: scene premise, cast, transcript, languages, and a replay link.

The judge should experience three unmistakable moments: speech becomes a world, multiple voices make it feel alive, and a spoken interruption changes both the story and the stage.

## Build only this

### In scope

- One authored 3D environment with a few stateful variants, not procedural world generation.
- Three stylized characters with idle, speaking, listening, surprised, and thinking states.
- Voice input for the initial premise and one live direction.
- A structured scene planner that returns 3–5 beats and assigns lines to characters.
- One persistent AssemblyAI TTS WebSocket session per character.
- Streaming PCM playback, per-character audio visualization, captions, and mouth movement.
- Cancel/flush behavior when the director interrupts.
- English and Spanish scene output.
- A deterministic replay mode using a captured successful run through the same UI.
- A polished landing page, architecture view, and two-minute demo video.

### Not building

- Free-roaming multiplayer worlds.
- User-generated 3D assets or text-to-3D.
- Photorealistic avatars or lip-sync phoneme models.
- More than one environment.
- Accounts, payments, social feeds, or a general-purpose editor.
- A fully autonomous multi-agent society.
- More than one live demo scenario before the primary scenario is flawless.

## Architecture

```text
Browser microphone
      |
      v
AssemblyAI Streaming STT  ---> director transcript
      |                              |
      |                              v
      |                        scene planner LLM
      |                              |
      |                  structured beats + stage cues
      |                              |
      |             +----------------+----------------+
      |             |                |                |
      |             v                v                v
      |        Captain TTS      Scientist TTS       AI TTS
      |        WebSocket        WebSocket           WebSocket
      |             |                |                |
      +------ interruption ----------+----------------+
                    |
                    v
           Web Audio + React Three Fiber
        audio, captions, faces, lights, timeline
```

Recommended stack:

- Next.js + TypeScript for the app and server routes.
- React Three Fiber, Drei, and postprocessing for the stage.
- Zustand for the scene state machine.
- Web Audio API with AudioWorklets for streamed PCM playback and immediate buffer flush.
- AssemblyAI Streaming STT for spoken direction.
- AssemblyAI-TTS-1 WebSocket API for the cast.
- A small structured-output LLM call for scene beats; keep this behind one adapter so the demo can replay a captured result.
- Vercel for the frontend and lightweight server routes; use a separate small WebSocket service only if the hosting constraints require it.

## Visual direction

**“A theatrical control room carved out of Europa ice.”** Avoid generic purple AI gradients and dashboard cards.

- A cinematic 16:9 stage dominates the page; controls live in a narrow director's rail.
- Obsidian, ice blue, signal amber, and emergency red form the palette.
- Large editorial type for scene titles; compact mono labels for live system state.
- Speech appears as physical energy: a waveform ribbon travels from the active character into the timeline.
- Word timing drives captions and subtle mouth movement.
- Interruptions are visible: the waveform snaps, lights freeze, the current line strikes through, and a new beat grows into the timeline.
- The architecture screen should reuse the same visual language and animate the actual event flow.

## Reliability plan

- Open and warm all three TTS sessions before the demo begins.
- Use the built-in AssemblyAI voices first; add a consented cloned voice only after the primary flow is stable.
- Keep the live scenario to short sentences and flush at sentence boundaries.
- Maintain a client-side audio queue per character that can be dropped immediately on interruption.
- Capture one successful real run as replayable event JSON plus audio. The replay mode must drive the same reducers, animation states, transcript UI, and timeline as the live path.
- Put a visible Live / Replay indicator in the UI. Never imply replayed output is live.
- Preload every 3D asset and avoid runtime model generation.

## What to prove to judges

- **Product depth:** TTS is doing streaming, multiple character voices, multilingual speech, cancellation, and timing—not just reading a paragraph.
- **Technical depth:** audio generation, buffering, interruption, and the 3D state machine stay synchronized.
- **Design:** the audio changes the world in real time, and every system state is visible.
- **Usefulness:** this is a prototype for game dialogue, previsualization, language learning, tabletop storytelling, and accessible content creation.
- **Sponsor fit:** the project showcases exactly why conversational TTS needs to stream and be interruptible.

## First build checkpoint

Before building the full interface, prove the riskiest slice in isolation:

1. Open two AssemblyAI TTS sessions with different voices.
2. Stream one short line from each into the browser.
3. Show live captions tied to the correct speaker.
4. Cancel one line while it is playing and flush its local audio buffer.
5. Immediately play the replacement line.

If this slice is not reliable, stop and simplify to two actors before touching the 3D stage.

## Information still needed

- **Deadline confirmed by the user with the organizers: November 7, 2026 at 11:00 AM PST.**
- Paste or screenshot the submission form's judging criteria; the form currently requires a Google sign-in.
- Confirm team size, available hours, and whether the final judging is live, video-only, or both.
- Claim the credits and create the AssemblyAI API key in the dashboard. Store it locally as `ASSEMBLYAI_API_KEY`; never paste the key into chat or commit it.

