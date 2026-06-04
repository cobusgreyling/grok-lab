# packages

Shared code for the grok-lab experiments.

**Each app is intentionally self-contained** (the primary goal is "clone one folder and run / deploy / remix instantly").

## Current

- `xai-client` — audio conversion helpers + a canonical-ish `realtime-client.ts` + types. Kept in sync (by hand or copy) with the working versions in `apps/*/lib/xai-realtime.ts`.
- `ui` — small reusable components (`Waveform`, `ApiKeyInput`) — not yet wired into the apps.

See `voice-lab` for the most complete usage of the realtime client today.

## How extraction works here

When a pattern (waveform, key modal, audio pipeline, clip exporter) feels solid:

1. Land it in one app first.
2. Move the reusable bits to `packages/`.
3. Either:
   - Copy the files into other apps' `lib/` or `components/` (preserves "download one app" experience), **or**
   - Add a tiny sync script / note for monorepo consumers.

A `scripts/sync-from-packages.sh` would be a nice contribution.

## Why the duplication today?

Vercel "import this subfolder" and "one-app GitHub fork" both work best when everything the app needs is inside `apps/<name>/`. Pure monorepo imports break the "easiest possible remix" promise.

Contributions that factor common logic out **while keeping apps fork-friendly** are very welcome.
