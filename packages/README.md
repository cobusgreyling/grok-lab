# packages

Shared code for the grok-lab experiments.

Currently each app is intentionally self-contained (easier to fork just one). `xai-client` has started to collect audio + realtime primitives.

When patterns stabilize, we extract here.

## Current

- `xai-client` — audio utils + realtime client stub + types (see its README)

## Planned / desired

- More from `xai-client`: full WS client implementation (or LiveKit wrapper)
- `ui` — waveform, mic button, transcript, Grok-themed components, clip exporter

Contributions that factor common logic out (while keeping apps fork-friendly) are very welcome.
