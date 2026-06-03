# packages

Shared code for the grok-lab experiments.

Currently each app is intentionally self-contained (easier to fork just one).

When patterns stabilize (especially the realtime audio client and common UI components), we will extract them here.

## Planned

- `xai-client` — TypeScript helpers for chat + realtime voice (connection, audio utils, event types)
- `ui` — waveform, mic button, transcript, Grok-themed components, clip exporter

Contributions that factor common logic out are very welcome.
