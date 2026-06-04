# @grok-lab/xai-client

Shared TypeScript helpers for the grok-lab experiments.

**Current exports** (start here when building new voice experiences):
- Audio conversion: `float32ToPCM16`, `pcm16ToBase64`, `base64ToPCM16` (for 16 kHz mono chunks)
- `createRealtimeClient` stub + types matching the xAI Realtime WS
- Common persona strings

See `docs/REALTIME-INTEGRATION.md` for the wire protocol, session.update, tool calling in voice, and the strong recommendation to use **LiveKit Agents** (with official xAI plugin) for any production / multi-user / phone use.

## Usage in an app

```ts
import { float32ToPCM16, pcm16ToBase64 } from '@grok-lab/xai-client';
// then feed into your WS or AudioWorklet pipeline
```

Each app is still self-contained by design for easy forking. When a pattern (waveform component, key hook, realtime client) is solid, factor it here and update the apps.

> Note: This package is not yet published to npm — import via relative path or workspace when you factor code out of an app.
