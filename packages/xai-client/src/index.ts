// xai-client — shared helpers for grok-lab experiments
// Goal: stabilize patterns here so individual apps stay small and forkable.

export type XAIKey = string;

export interface RealtimeSessionConfig {
  instructions?: string;
  voice?: 'eve' | 'ara' | 'rex' | 'sal' | 'leo' | string;
  tools?: Array<{ type: 'web_search' | 'x_search' | string }>;
  // Add more as the API evolves
}

export interface AudioChunk {
  pcm16: Int16Array; // 16kHz mono recommended
}

// Basic audio helpers (16kHz PCM16 <-> base64 for the WS)
export function float32ToPCM16(float32: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

export function pcm16ToBase64(pcm16: Int16Array): string {
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToPCM16(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

// Placeholder for the realtime WS client.
// See docs/REALTIME-INTEGRATION.md for the full event flow + LiveKit recommendation.
// A real implementation would manage:
// - WS connect to wss://api.x.ai/v1/realtime?model=grok-voice-latest
// - session.update, input_audio_buffer.append (base64 pcm), response.create
// - handling of deltas (text + audio), tool calls, playback queueing with AudioContext
// - barge-in, VAD config, multiple voices
export function createRealtimeClient(apiKey: XAIKey, config?: RealtimeSessionConfig) {
  // TODO: full implementation (or swap for LiveKit Agents + xAI plugin for prod)
  console.warn('[xai-client] Realtime client is a stub. Implement per REALTIME-INTEGRATION.md or use LiveKit.');
  return {
    connect: async () => { throw new Error('Not implemented — see docs/REALTIME-INTEGRATION.md'); },
    disconnect: () => {},
    sendAudio: (_chunk: AudioChunk) => {},
    // events...
  };
}

// Common prompt starters (keep in sync across apps or move to shared prompts later)
export const GROK_PERSONA = `You are Grok, built by xAI. Be maximally truthful, witty, and a little savage when it helps.`;

