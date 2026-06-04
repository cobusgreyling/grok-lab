# grok-lab

[![grok-lab](docs/images/grok-lab-header.png)](https://cobusgreyling.github.io/grok-lab/)

[![CI](https://github.com/cobusgreyling/grok-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/cobusgreyling/grok-lab/actions/workflows/ci.yml)
[![GitHub Pages](https://img.shields.io/badge/showcase-live-brightgreen)](https://cobusgreyling.github.io/grok-lab/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

### 🚀 Showcase (GitHub Pages)

A beautiful, self-contained landing page lives in `docs/index.html` (with screenshots, run commands, and status).

**Live showcase**: https://cobusgreyling.github.io/grok-lab/

#### How to enable (one-time)
1. Push this repo (or the latest commit).
2. Go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to **GitHub Actions**.
4. Save. The included workflow (`.github/workflows/deploy-pages.yml`) will automatically deploy `docs/` on every push to `main`.

It usually takes 1–2 minutes for the site to become live after enabling. The badge above will turn green when it's ready.

(We also added `docs/.nojekyll` to prevent Jekyll processing.)

**The goal**: Build things that showcase what makes Grok special (brutal honesty, real-time knowledge, wit, powerful tool use) in delightful, shareable ways — and make them easy for others to run, fork, and remix.

Each app is independently deployable (Vercel one-click friendly) and designed to be the kind of project that gets stars, clips, and forks.

## The Four Experiments

> **Current status:** All apps have polished, key-optional demos that run instantly with zero config. 
> - `roast-voice` + `grok-threads`: real `grok-4.3` chat completions when key provided.
> - `voice-imagine`: real `grok-imagine-image` generations + real browser voice refine when key provided.
> - Full low-latency realtime voice (WS + audio pipeline + tool calling) remains the big missing piece — detailed guide + recommended LiveKit path in `docs/REALTIME-INTEGRATION.md`.

| # | App | Core Idea | Purpose | Stack |
|---|-----|-----------|---------|-------|
| 1 | **[roast-voice](./apps/roast-voice)** | Brutally honest voice roasts | Showcase Grok's signature no-filter honesty with voice roasts + effortless clip export for viral sharing | Next.js + Web Audio + xAI Realtime |
| 2 | **[voice-lab](./apps/voice-lab)** | The clean reference Grok voice client | The canonical open-source reference implementation for voice + tools + personalities when talking to Grok | Next.js + full realtime client |
| 3 | **[voice-imagine](./apps/voice-imagine)** | Voice-directed image generation | Natural voice-driven creative loops for image gen + live iterative refinement ("more menacing, tiny hat") | Next.js + Web Speech + xAI Imagine API |
| 4 | **[grok-threads](./apps/grok-threads)** | Best-in-class X thread generator + previewer | Produce ready-to-post, high-engagement X threads with multiple angles and pixel-perfect live preview | Next.js + Chat Completions + thread UI |

## Why These?

- **Grok's personality is the product**. The "maximum truth-seeking" + humor angle is unique and extremely clip-worthy in voice.
- **xAI's realtime voice is legitimately good and cheap** (~$3/hr). Sub-second, tool calling (web + X search), multiple voices, expressive.
- **airi already owns the waifu companion niche** (40k+ stars). These apps deliberately avoid that lane.
- Each one has a clear "one weird trick" that makes people want to record and share.

## Quick Start (any app)

```bash
cd grok-lab/apps/roast-voice   # or voice-lab, voice-imagine, grok-threads
npm install
npm run dev
```

Open http://localhost:3000

**Get an xAI API key**: https://console.x.ai → create a key (free tier available for testing).

Copy the `.env.example` into an app if desired (keys are primarily read from localStorage in these demos for instant "paste and go" UX).

Most apps work in **demo mode** (browser SpeechRecognition + speechSynthesis) with zero config so you can see the UX immediately. Paste your key and enable real mode for actual `grok-4.3` / `grok-imagine-image` calls.

## Architecture Notes (Important for forks)

- Voice apps are structured for a **client-side xAI Realtime WebSocket client** (see `docs/REALTIME-INTEGRATION.md`). A reference `lib/xai-realtime.ts` + audio pipeline is the highest-leverage missing implementation.
- Audio: 16kHz PCM16 chunks via AudioContext + base64. Received deltas are queued and played with Web Audio.
- **Demo mode** is always available and delightful (great for screenshots and quick testing).
- For production / hiding keys / better barge-in: Put a thin proxy in `/api/realtime` or (recommended) use **LiveKit Agents + official xAI plugin**. The code is structured so swapping is straightforward.
- Text fallbacks use `https://api.x.ai/v1/chat/completions` directly from the browser for demos (key is client-side — fine for personal / demo use, add a server route for real apps).
- Image generation uses the xAI Imagine API (`grok-imagine-image`) — wired in `voice-imagine` (client fetch, demo fallback).

See `docs/REALTIME-INTEGRATION.md` for deep details + LiveKit migration path.

## Development

Each app is a standalone Next.js 15 + TypeScript + Tailwind project.

Common patterns you'll see:
- Dark, minimal, high-contrast UI (Grok aesthetic)
- Prominent API key modal + localStorage
- Live animated waveform component
- Export/share buttons (audio clips, thread text, image + prompt)
- Strong, opinionated system prompts that lean into Grok's voice

To run all at once (for local testing the whole lab):

```bash
# from root (you can add turbo or just use multiple terminals)
cd apps/roast-voice && npm run dev   # :3000
# new terminal
cd apps/voice-lab && npm run dev     # :3001 (update port in each if needed)
```

## Deploy

All four apps deploy beautifully to Vercel (or any platform).

### One-click deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcobusgreyling%2Fgrok-lab)

On Vercel, select the specific app directory as the project root (e.g. `apps/roast-voice`). Set the `XAI_API_KEY` environment variable for real Grok calls (highly recommended for any public demo so keys aren't baked into the client bundle).

### Manual / other hosts
1. `cd apps/<name>` (roast-voice, voice-lab, voice-imagine or grok-threads)
2. `vercel --prod` (or `npm run build` + upload `out` / `.next`)
3. Add `XAI_API_KEY` env (server routes or client direct both supported; server proxy preferred for prod).

See the **[live showcase](https://cobusgreyling.github.io/grok-lab/)** for screenshots, status, and per-app run commands. Each app is 100% standalone.

## Contributing

This repo exists to be forked and remixed.

Ideas that would be huge:
- Better clip export (mix mic + Grok audio, auto-generate funny titles, upload to a temporary host)
- LiveKit / Pipecat versions of the voice apps (production VAD, phone support, multi-user rooms)
- A "Grok on a phone call" demo using LiveKit's SIP
- More personalities / system prompt packs
- Real X posting integration (with user consent) for the threads app
- Beautiful exported share pages (like `/clip/abc123`)

Open an issue or PR. If you're building something that gets real usage, I'd love to link it here.

## License

MIT — use the code however you want. Credit is nice but not required.

## Related

- Official xAI docs & cookbook: https://github.com/xai-org/xai-cookbook
- Realtime voice playground (LiveKit): https://grok.livekit.io/
- The big waifu one: https://github.com/moeru-ai/airi (respect the lane)

---

**Star the repo if these ideas are useful.** The fastest way to make Grok voice go mainstream is a bunch of high-quality, opinionated open source experiments.

Built with ❤️ for maximum truth-seeking AIs that you can actually talk to.
