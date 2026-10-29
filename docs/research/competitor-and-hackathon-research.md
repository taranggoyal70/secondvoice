# AssemblyAI Voice Hackathon: competitor and event research

Research date: 2026-10-29 (America/Los_Angeles)

## Executive synthesis

The strongest pattern in Bill Zhang's public winning work is not “add a voice agent” or “add 3D.” It is a repeatable product shape:

1. Start with a concrete, high-stakes user problem that is easy to explain in one sentence.
2. Make voice the only natural interface for the situation—not a decorative chatbot bolted onto a dashboard.
3. Put a visual “operator cockpit” beside the voice experience so judges can see live transcripts, state changes, tool calls, handoffs, confidence, maps, or other system evidence.
4. Give the demo one unmistakable transformation: call → triage → incident dossier; phone request → agent handoff → bank action; learner question → slides rebuilt in real time.
5. Make the sponsor technology central to that transformation and name it repeatedly in the pitch, architecture, and submission.
6. Build a reliable, replayable demo path and package it with a short video, live URL, architecture diagram, and skimmable story.

For this event, the best adaptation is a product where AssemblyAI TTS is visibly indispensable and where the demo exposes its differentiators: streaming from partial LLM output, a persistent WebSocket session, instant cancellation for barge-in, word-boundary timing, voice selection or consented cloning, and multilingual speech. Do not claim speed control, SSML, pronunciation dictionaries, or emotion tags: AssemblyAI's launch FAQ says those dedicated controls are not available yet.

## 1. Current hackathon facts and inconsistencies

### What the live official pages currently show

- The live Luma event header shows **Tuesday, October 27, 2026 at 7:00 PM PDT through November 7 at 11:00 AM PST**. The same page's body still contains the stale text “October 15–23, 2026.” The user's pasted organizer announcement is consistent with the live header and explicitly says the event reopened October 27. **The user confirmed with the organizers that November 7, 2026 at 11:00 AM PST is the valid deadline.** [Official Luma event](https://luma.com/msrwwjby)
- The Luma page says the event is online, teams may have **1–4 people**, and there is **$2,000 across 20 winners**, paid as Visa gift cards. [Official Luma event](https://luma.com/msrwwjby)
- The currently open official Google Form still says “Oct 17 to Oct 24,” another stale date. It is nevertheless live and branded as an AssemblyAI form. [Official submission form](https://docs.google.com/forms/d/e/1FAIpQLSdHs9Dff1lxchZ-xJ6uRhAT9cvNXJgatI8vqGom6okLIvVQMQ/viewform)

### Submission requirements visible in the official form

For a project submission, the form asks for:

- team/submitter name and up to four total team members;
- project name and one-line tagline;
- a description covering what it does, the problem, and **how it uses the AssemblyAI TTS flow**;
- tech stack;
- a short working-demo video (YouTube, Loom, or Drive), required for project submissions;
- a source repository, required for project submissions;
- an optional live app and optional screenshot/recording upload.

The same form also accepts API feedback, security reports, and bug reports. No detailed public scoring rubric is visible on the Luma page or submission form. Ask the organizer/Discord for the judging criteria before freezing the idea. [Official submission form](https://docs.google.com/forms/d/e/1FAIpQLSdHs9Dff1lxchZ-xJ6uRhAT9cvNXJgatI8vqGom6okLIvVQMQ/viewform)

## 2. What is verified about `IdkwhatImD0ing`

- His current GitHub profile self-reports **36 wins from 59 hackathons entered**. His own Hackathon Playbook also describes 36+ wins across 50+ events and $100K+ in prizes. These are author claims, not independently audited totals. [GitHub profile README](https://github.com/IdkwhatImD0ing/IdkwhatImD0ing), [Hackathon Playbook repository](https://github.com/IdkwhatImD0ing/hackathonstarterkit)
- His current Devpost profile lists **52 projects, 71 hackathons, and 10 achievements**. The Devpost total and the GitHub “59 entered” figure use different definitions or snapshots, so do not merge them into one statistic. [Devpost profile](https://devpost.com/IdkwhatImD0ing)
- Public first-party project pages verify a dense sequence of voice-related wins:
  - **Dispatch AI**: UC Berkeley AI Hackathon grand prize, AI for Good, and Best Use of Intel AI. [Devpost](https://devpost.com/software/dispatch-ai), [GitHub](https://github.com/DispatcherAI/DispatcherAI)
  - **TalkTuahBank**: HackUTD overall/general winner and Goldman Sachs track winner. [Devpost](https://devpost.com/software/talktuahbank), [GitHub](https://github.com/aurelisajuan/TalkTuahBank)
  - **AdaptEd**: LA Hacks Google Company Challenge winner. [Devpost](https://devpost.com/software/teachme-3p7bw1)
  - **Doggo AI**: HackDavis 2024 Best Use of Intel Developer Cloud. [Devpost](https://devpost.com/software/doggo-ai)
  - **Linguify**: VTHacks Best Startup Hack. [Devpost](https://devpost.com/software/linguify-katunw)
  - **Vocalyze**: HackMerced winner for Letta AI and Business/Finance. [Devpost](https://devpost.com/software/weeee-i-love-reading-documentation)
  - **SentinelAI**: HackDavis 2025 Best AI/ML Hack. [Devpost](https://devpost.com/software/sentinelai-dec0jp)

## 3. Repeated winning patterns

### A. A one-line problem judges immediately understand

The projects lead with a specific human constraint, not a technology inventory:

- TalkTuahBank: banking through any ordinary phone for people without internet, a smartphone, or digital literacy. [README](https://github.com/aurelisajuan/TalkTuahBank#the-problem)
- Dispatch AI: understaffed 911 centers; the product listens, structures the incident, and keeps a human dispatcher as final authority. [README](https://github.com/DispatcherAI/DispatcherAI#-what-it-does)
- Doggo AI: an interactive companion for children staying in hospitals, embodied in a plush rather than another screen. [Devpost](https://devpost.com/software/doggo-ai)
- AdaptEd: a conversational tutor that rebuilds slides around the learner. [Devpost](https://devpost.com/software/teachme-3p7bw1)

The author's own ideation method is to combine a newly capable technology with an industry/problem space, then swap one element until the demo is novel but buildable. He uses Dispatch AI as the worked example: LLM + phone calls + public safety. [Ideation playbook](https://thehackathonplaybook.dev/playbook/ideation)

### B. Voice is structural, not ornamental

Across the strongest examples, voice is required by the context:

- emergencies arrive by phone;
- unbanked users may have only a basic phone;
- children interact with a physical plush;
- learners practice spoken language or interrupt a live tutor.

This matters for the AssemblyAI event: a generic web app with a “read aloud” button will look shallow. A winning concept should become meaningfully worse or impossible if TTS is removed.

### C. The system is made visible in an operator cockpit

Voice is invisible during judging unless the UI exposes it. These projects repeatedly show:

- live transcript;
- agent state or handoffs;
- emotion or severity;
- maps and location;
- structured summaries or dossiers;
- the action/tool result;
- a human override.

Dispatch AI's cockpit includes a severity-coded queue, live transcript, caller emotion, synced map pins, and Street View. [Dispatch AI architecture and stack](https://github.com/DispatcherAI/DispatcherAI#-architecture)

TalkTuahBank's project page includes a guided multi-agent walkthrough, the operator console, an architecture view, and a build/timeline view. The default guided mode replays realistic scenarios client-side so it works without API keys or backend infrastructure. [TalkTuahBank README](https://github.com/aurelisajuan/TalkTuahBank#the-deployed-project-page)

### D. The core experience is narrow; the presentation is rich

TalkTuahBank's hackathon backend used an in-memory ledger and four narrowly scoped agents. Dispatch AI explicitly says it was a credible assistive prototype rather than a procurement-ready product. Both projects invested in a polished, inspectable project page after or around the build. [TalkTuahBank tradeoffs](https://github.com/aurelisajuan/TalkTuahBank#tech-stack), [Dispatch AI tradeoffs](https://github.com/DispatcherAI/DispatcherAI#-build-context--tradeoffs)

The author's execution playbook formalizes the same strategy: working end-to-end flow by hour four, no new features after hour sixteen in a 24-hour event, polish only screens judges will see, then reserve time for demo and rehearsal. [Execution playbook](https://thehackathonplaybook.dev/playbook/execution)

### E. The demo is the pitch

His pitching guide says the live demo occupied 28% of the Dispatch AI pitch and 42% of the TalkTuahBank pitch. The recommended structure is: big shift → stakes → live demo → brief technical “magic” → vision. [Pitching playbook](https://thehackathonplaybook.dev/playbook/pitching)

The submission guide treats the Devpost, README, and video as judging artifacts, not paperwork. It recommends concrete first lines, an architecture diagram, explicit sponsor technology, a short working demo, and 1–2 hours reserved before the deadline. [Submission playbook](https://thehackathonplaybook.dev/playbook/submission)

## 4. Exact recurring stack

### Voice and backend

The repeated architecture is:

```text
phone/browser audio
  → voice transport / STT / TTS
  → FastAPI WebSocket orchestrator
  → LLM or specialist agents + tools/state
  → event stream
  → Next.js operator cockpit
```

Examples:

- TalkTuahBank: Retell telephony/STT/TTS, FastAPI WebSocket bridge, OpenAI Swarm handoffs, OpenAI chat, in-memory ledger, LaTeX PDF generation, Pinata/IPFS. [Architecture](https://github.com/aurelisajuan/TalkTuahBank#architecture-at-a-glance)
- Dispatch AI: Twilio + Retell, FastAPI, Hume emotion telemetry, a Mistral-7B LoRA, Prisma/PostgreSQL, maps/geocoding, and a human-in-the-loop Next.js cockpit. [Architecture](https://github.com/DispatcherAI/DispatcherAI#-architecture)
- PortfolioV3: Retell WebRTC, FastAPI WebSocket, OpenAI Agents SDK, Pinecone semantic search, and tool events that navigate the Next.js UI. [PortfolioV3 README](https://github.com/IdkwhatImD0ing/PortfolioV3#-architecture)

For this hackathon, AssemblyAI TTS should replace the TTS stage rather than sitting behind a vendor that hides it. A browser implementation should mint a temporary token server-side and open the TTS WebSocket directly from the client, or keep the TTS socket on the server and stream PCM to the browser.

### UI stack

The stable front-end choices across his newer repositories are:

- Next.js App Router + React + TypeScript;
- Tailwind CSS + shadcn/Radix primitives;
- Motion/Framer Motion for transitions and micro-interactions;
- Zustand or event contracts for demo state;
- Mermaid for architecture;
- Vercel for the frontend;
- a domain-specific visual surface: dispatcher cockpit, bank console, tutor slides, map, or project case study.

Sources: [TalkTuahBank package manifest](https://github.com/aurelisajuan/TalkTuahBank/blob/main/client/package.json), [Dispatch AI package manifest](https://github.com/DispatcherAI/DispatcherAI/blob/main/client/package.json), [PortfolioV3 package manifest](https://github.com/IdkwhatImD0ing/PortfolioV3/blob/main/client/package.json).

### 3D: what he actually used, and what not to infer

- SentinelAI explicitly says its central command dashboard was built with **Next.js and Three.js** and visualized zones, door locks, and alerts. The public repo does not expose the full frontend implementation, so the exact Three.js wrapper and scene pipeline cannot be verified. [SentinelAI Devpost](https://devpost.com/software/sentinelai-dec0jp), [public repo](https://github.com/Christopher-Chhim/SentinelAI)
- PortfolioV3's manifest includes `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, and `meshline`, but the current `main` source does not import them. Treat those as installed/legacy dependencies, not proof that the current portfolio's visible UI uses 3D. [PortfolioV3 manifest](https://github.com/IdkwhatImD0ing/PortfolioV3/blob/main/client/package.json)
- The interactive 3D object in the current GitHub profile is much simpler technically: the repository generates an `.stl` file, embeds it in the profile, and relies on GitHub's native STL viewer. Most of the striking profile is custom Python-generated SVG artwork with desktop/mobile, light/dark, and reduced-motion variants—not a conventional React website. [profile README](https://github.com/IdkwhatImD0ing/IdkwhatImD0ing), [STL generator](https://github.com/IdkwhatImD0ing/IdkwhatImD0ing/blob/main/scripts/generate_token_stl.py), [SVG map generator](https://github.com/IdkwhatImD0ing/IdkwhatImD0ing/blob/main/scripts/art_map.py)

The takeaway is not “use 3D everywhere.” Use 3D only when it makes system state spatial and immediately understandable. SentinelAI's building zones justify 3D; a generic floating orb does not.

## 5. Visual-design method worth copying

His public profile's design instructions reveal more than the library list:

- one visual star per screen;
- a clear reading order;
- a few large shapes instead of many equal-weight cards;
- detail concentrated where the eye should go;
- responsive variants rather than a desktop composition merely shrunk down;
- explicit light/dark and reduced-motion assets;
- a visual metaphor tied to the product/domain rather than generic “AI glassmorphism.”

The artifact is implemented through custom SVG generation, local font glyphs, theme variants, and deliberately constrained compositions. [Profile design specification](https://github.com/IdkwhatImD0ing/IdkwhatImD0ing/blob/main/CLAUDE.md), [SVG drawing utilities](https://github.com/IdkwhatImD0ing/IdkwhatImD0ing/blob/main/scripts/ink.py)

For our build, copy the method, not the Chinese ink aesthetic. Choose one product-native metaphor and one hero interaction. A voice-accessibility product might use a “voice instrument” or phrase timeline; an emergency drill product might use a spatial building twin; an interactive story product might use a stage with characters and word-timed lighting.

## 6. AssemblyAI TTS capabilities that can carry the demo

Verified capabilities in the current official docs:

- buffered or streamed HTTP synthesis and a persistent WebSocket session; [quickstart](https://www.assemblyai.com/docs/tts/getting-started/quickstart)
- streaming partial LLM text with `generate()`, sentence/request boundaries with `flush()`, and `cancel()` for immediate barge-in; [quickstart](https://www.assemblyai.com/docs/tts/getting-started/quickstart#stream-text-in-as-an-llm-writes-it)
- word-level start/end timestamps and confidence through `WordBoundaries`; [word boundaries](https://www.assemblyai.com/docs/tts/word-boundaries)
- thousands of catalog voices and six languages: English, Spanish, German, Italian, Portuguese, and French; [voices](https://www.assemblyai.com/docs/tts/voices)
- instant private voice cloning from roughly 10–30 seconds of consented speech; clone consent lasts 60 days unless renewed; [voice cloning](https://www.assemblyai.com/docs/tts/cloned-voices)
- temporary browser tokens so the permanent API key is not shipped to the client; [temporary token docs](https://www.assemblyai.com/docs/tts/authenticate-with-a-temporary-token)
- US and EU processing endpoints. [quickstart](https://www.assemblyai.com/docs/tts/getting-started/quickstart)

Current limitations to design around:

- no dedicated speed parameter;
- no SSML;
- no custom pronunciation dictionary yet;
- no emotion-tag control yet;
- language is not auto-detected for TTS; the app must set it.

Punctuation and textual cues can still shape delivery, but do not present that as formal prosody control. [AssemblyAI launch FAQ](https://www.assemblyai.com/blog/text-to-speech-api#faq)

## 7. Recommended “winning build” shape

This is a strategic inference from the verified patterns above, not an organizer rubric.

### Product thesis

Build a **two-surface voice product**:

1. a live, interruptible voice experience where AssemblyAI TTS is the product;
2. a cinematic but functional cockpit that makes every voice event and user outcome visible.

The strongest concept should satisfy all five tests:

- **Necessary voice:** remove TTS and the core user outcome disappears.
- **One-sentence stakes:** a judge understands the problem before the demo starts.
- **One visible transformation:** a spoken request changes the product state in under ten seconds.
- **Sponsor depth:** streaming, cancel/barge-in, word boundaries, voices/cloning, and at least one language choice are used for product reasons.
- **Replayable:** the same wow moment works live and in a deterministic guided mode.

### Front-runner direction: `SecondVoice`

**One line:** A consented, real-time voice prosthesis that helps people losing speech communicate in a voice that still feels like theirs.

**Judge demo:** the user selects a predicted phrase or types a few words; the LLM streams the sentence into AssemblyAI TTS; the listener hears it immediately in a consented cloned voice; words illuminate on the shared transcript from `WordBoundaries`; the speaker interrupts mid-sentence, `cancel()` stops playback instantly, edits the intent, and resumes in another supported language.

**Cockpit:** a calm “voice instrument,” not a dashboard grid: phrase palette, live sentence timeline, exact heard/not-heard boundary, voice/language state, latency trace, and a subtle Three.js identity form that reacts to real audio energy. The 3D element is secondary and communicates speaking state; it is not decoration.

**Why it matches the observed win pattern:** important human constraint, voice is indispensable, a visible technical transformation, ethically relevant consent, and a short demo with a strong emotional payoff.

**Risk:** do not imply a medical treatment, and never clone anyone without explicit consent. Use the builder's own voice or a stock voice for the public demo if consent handling cannot be demonstrated cleanly.

### Safer creative alternative: `StoryStage Live`

An interruptible, multi-character live story where each character has a distinct AssemblyAI voice; the listener can interrupt and redirect the scene, while word timestamps drive captions, character lighting, and scene motion. It offers higher visual freedom and lower domain risk, but the problem stakes are weaker than `SecondVoice`.

## 8. Practical build and presentation recommendations

1. **Use November 7, 2026 at 11:00 AM PST as the confirmed deadline, and ask for the judging criteria in Discord.** The rubric is still not public.
2. **Build AssemblyAI's streaming TTS spike first:** connect → generate partial text → flush → play PCM → cancel → reconnect. Measure first audible audio and surface the metric in the demo.
3. **Write the 60–90 second demo before the app.** One scenario, one voice transformation, one interruption, one outcome.
4. **Make a guided mode** using the same event contract and realistic transcript/state data, so a failed network does not kill the recorded or live presentation.
5. **Use a bold, domain-native visual direction.** Avoid a generic dark dashboard with twelve gradient cards. One hero surface, one secondary detail rail, one signature motion.
6. **Use 3D only after the voice loop is stable.** A purposeful React Three Fiber element can be added late; it must explain state or identity.
7. **Show sponsor depth on screen:** voice ID/language, streaming state, word timing, cancellation, and heard/unheard boundary.
8. **Package for deliberation:** live link, short video, source repo, architecture diagram, explicit AssemblyAI flow, honest limitations, and no unsupported capability claims.

## Primary-source index

- [AssemblyAI official event](https://luma.com/msrwwjby)
- [AssemblyAI official submission form](https://docs.google.com/forms/d/e/1FAIpQLSdHs9Dff1lxchZ-xJ6uRhAT9cvNXJgatI8vqGom6okLIvVQMQ/viewform)
- [AssemblyAI TTS quickstart](https://www.assemblyai.com/docs/tts/getting-started/quickstart)
- [AssemblyAI voices](https://www.assemblyai.com/docs/tts/voices)
- [AssemblyAI voice cloning](https://www.assemblyai.com/docs/tts/cloned-voices)
- [AssemblyAI word boundaries](https://www.assemblyai.com/docs/tts/word-boundaries)
- [AssemblyAI TTS launch FAQ](https://www.assemblyai.com/blog/text-to-speech-api#faq)
- [Bill Zhang GitHub profile](https://github.com/IdkwhatImD0ing)
- [Bill Zhang Devpost profile](https://devpost.com/IdkwhatImD0ing)
- [Hackathon Playbook](https://thehackathonplaybook.dev/playbook)
- [Dispatch AI repo](https://github.com/DispatcherAI/DispatcherAI)
- [TalkTuahBank repo](https://github.com/aurelisajuan/TalkTuahBank)
- [PortfolioV3 repo](https://github.com/IdkwhatImD0ing/PortfolioV3)
