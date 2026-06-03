# xAI Realtime Voice Integration Guide

This document contains the battle-tested patterns used across the grok-lab apps.

## Connection

```ts
const url = `wss://api.x.ai/v1/realtime?model=grok-voice-latest`;
const ws = new WebSocket(url);

// Auth: some deployments accept the key in the URL as ?api_key=xxx
// or via Sec-WebSocket-Protocol or first message. Check current console docs.
// Most reliable for browser demos: append &api_key=${key} (be careful with logging).
```

## Session configuration (the important part)

```ts
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      instructions: "You are Grok, built by xAI. Be maximally truthful, witty, and a little savage when it helps. ...",
      voice: "eve",           // or ara, rex, sal, leo, etc.
      tools: [
        { type: "web_search" },
        { type: "x_search" }, // realtime X search — extremely powerful
        // function tools here too
      ],
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
    }
  }));
};
```

## Sending microphone audio

You must send 16kHz (or 24kHz) PCM16 mono, base64 encoded, in reasonably sized chunks (~100-300ms).

See `lib/audio.ts` and `lib/xai-realtime.ts` in the apps for a working AudioContext + ScriptProcessor / AudioWorklet example.

Basic pattern:

```ts
// Every ~200ms
const pcm16 = convertFloat32ToInt16(float32Buffer);
const b64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
ws.send(JSON.stringify({
  type: "input_audio_buffer.append",
  audio: b64
}));
```

## Handling server events

Key events you'll care about:

- `response.text.delta` — partial text for the transcript
- `response.audio.delta` — base64 PCM16 audio chunk to play
- `response.function_call` / `response.tool_calls` — when Grok decides to use web_search or x_search
- `response.done` — turn complete

For audio playback, collect deltas, convert back to AudioBuffer, and schedule them with low latency using a single AudioContext.

## Tool calling in voice

This is where xAI shines. Define tools in the session. When the model calls them you will receive events, execute the tool (e.g. fetch from x.com or your own functions), then send:

```ts
ws.send(JSON.stringify({
  type: "conversation.item.create",
  item: { type: "function_call_output", call_id: "...", output: JSON.stringify(result) }
}));
ws.send(JSON.stringify({ type: "response.create" }));
```

## Production recommendations

**For best quality (barge-in, VAD, multiple participants, phone numbers):**

Use **LiveKit Agents** (Python) or **Pipecat** with the official xAI plugin.

- LiveKit has a public Grok voice playground: https://grok.livekit.io/
- You get SIP phone support almost for free.
- Much easier to handle the audio pipeline correctly.

The browser WebSocket approach in these apps is great for quick viral demos and client-only deploys, but for anything serious, move the agent to a server (LiveKit worker or your own).

## Image / Imagine API

xAI exposes image generation (see grok-imagine-image model).

Typical flow in voice-imagine:

1. User speaks a creative direction.
2. Grok (in voice or text) refines the prompt.
3. You call the image endpoint (or let Grok call an `image_gen` tool if you expose it).
4. Stream the result back into the UI and let the user keep talking ("make it more menacing, add a tiny hat").

Current relevant models (check console.x.ai for latest):
- Chat: `grok-4.3`, `grok-3`
- Voice: `grok-voice-latest`
- Image: `grok-imagine-image`, `grok-imagine-image-quality`

## Common pitfalls

- Forgetting to commit the input buffer when not using server VAD.
- Wrong sample rate → garbled or silent audio.
- Not handling `error` events from the WS (rate limits, bad model names, auth).
- Playing audio deltas without queuing → choppy sound.
- Exposing long-lived keys in public demos without rate limiting.

## Resources

- xAI cookbook voice examples: https://github.com/xai-org/xai-cookbook/tree/main/voice-examples
- LiveKit xAI plugin docs
- Pipecat xAI transport

If you improve the client code significantly, open a PR — these patterns are intentionally shared across the lab.
