# Contributing to grok-lab

Thanks for your interest! This repo is meant to be a living collection of high-signal Grok experiments.

## Philosophy

- **Opinionated > generic**. Each app should have a sharp point of view (e.g. "brutal honesty" for roast-voice).
- **Demo mode first**. If someone clones and runs `npm run dev`, it should feel impressive immediately.
- **Real integration included**. Don't just link the docs — ship working (or very close to working) xAI Realtime + Chat code.
- **Shareability is a feature**. Every app should make it trivial to export something cool (clip, thread, image + prompt).

## How to contribute

1. Pick an app or propose a new one in an issue.
2. Keep the "demo mode works without a key" contract.
3. If you improve the realtime client in one app, consider whether it should be extracted to `packages/xai-client`.
4. Update the root README when behavior or structure changes significantly.
5. Record a short demo video if your change is visual/audible — it helps reviewers and future users.

## Adding a new experiment

If you have an idea for #5, open an issue first with:
- One-sentence hook
- Why it would spread on X / get stars
- Rough tech (voice? text? tools?)

We're biased toward things that:
- Leverage realtime voice + tools + X search
- Produce highly shareable artifacts (audio clips, threads, images)
- Show off Grok's personality instead of hiding it

## Code style

- TypeScript strict (already enabled in the tsconfigs)
- Prefer small, focused components
- Keep system prompts in one place (usually `lib/prompts.ts` or at the top of the main page)
- Comment the tricky audio/WS parts heavily

## Monorepo & forking philosophy

Each app must remain runnable/deployable after copying just its folder out of the repo. This means:

- We tolerate some duplication (especially the realtime client and small UI bits).
- When you improve something reusable, also update `packages/` (and optionally note a copy step for other apps).
- See `packages/README.md` for the current extraction approach.

## Running locally

See the root README.

PRs that add a working "Export as viral clip" flow, a new personality that gets real laughs/truth, or that clean up the realtime client + actually wire better voice output into `roast-voice` will be merged very quickly.

Also see root [SECURITY.md](../SECURITY.md) and [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md).
