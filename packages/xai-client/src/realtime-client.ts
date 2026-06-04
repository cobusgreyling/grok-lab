"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * xAI Grok Realtime Voice Client (browser) - shared package version
 * (kept in sync with apps/*/lib for standalone fork-friendliness)
 *
 * See detailed docs in the voice-lab copy and in docs/REALTIME-INTEGRATION.md
 */

export type Voice = 'eve' | 'ara' | 'rex' | 'sal' | 'leo';

export interface RealtimeConfig {
  apiKey: string;
  instructions?: string;
  voice?: Voice;
  tools?: Array<{ type: 'web_search' | 'x_search' }>;
  onTranscript?: (role: 'user' | 'assistant', text: string, isFinal: boolean) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onToolCall?: (name: string, args: any) => Promise<any> | any;
  onError?: (err: Error) => void;
  onStatus?: (status: string) => void;
}

const DEFAULT_MODEL = 'grok-voice-latest';
const SAMPLE_RATE = 24000;
const CHUNK_MS = 200;

function float32ToPCM16Base64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  let binary = '';
  const bytes = new Uint8Array(pcm16.buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64PCM16ToFloat32(b64: string): Float32Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const pcm16 = new Int16Array(bytes.buffer);
  const f32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 32768.0;
  return f32;
}

export class GrokRealtimeClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  private playbackQueue: AudioBufferSourceNode[] = [];
  private isPlayingAudio = false;
  private currentSource: AudioBufferSourceNode | null = null;

  private config: RealtimeConfig;
  private connected = false;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  get isConnected() { return this.connected; }

  async connect() {
    if (this.ws) this.disconnect();

    const { apiKey } = this.config;
    if (!apiKey) throw new Error('API key required for realtime');

    const url = `wss://api.x.ai/v1/realtime?model=${DEFAULT_MODEL}&api_key=${encodeURIComponent(apiKey)}`;

    this.config.onStatus?.('connecting');

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connected = true;
      this.config.onStatus?.('connected');

      const session: any = {
        voice: this.config.voice || 'eve',
        instructions: this.config.instructions || 'You are Grok by xAI. Be direct, witty, maximally truthful.',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        audio: {
          input: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
          output: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
        },
      };
      if (this.config.tools && this.config.tools.length > 0) session.tools = this.config.tools;

      this.ws!.send(JSON.stringify({ type: 'session.update', session }));
      this.config.onStatus?.('session ready - speak now');
    };

    this.ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data);
        this.handleServerEvent(event);
      } catch (e) { /* ignore */ }
    };

    this.ws.onerror = () => { this.config.onError?.(new Error('WebSocket error')); this.config.onStatus?.('error'); };
    this.ws.onclose = () => {
      this.connected = false;
      this.stopAudioPlayback();
      this.config.onStatus?.('disconnected');
    };

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
  }

  private handleServerEvent(event: any) {
    const t = event.type;
    if (t === 'response.output_audio.delta' || t === 'response.audio.delta') {
      const b64 = event.delta || event.audio;
      if (b64 && this.audioContext) {
        const f32 = base64PCM16ToFloat32(b64);
        this.queueAndPlayAudio(f32);
      }
    }
    if (t === 'response.text.delta' || t === 'response.output_text.delta') {
      const text = event.delta || event.text || '';
      if (text) this.config.onTranscript?.('assistant', text, false);
    }
    if (t === 'response.done' || t === 'response.output_item.done') {
      if (event.response?.output?.[0]?.content?.[0]?.text) {
        this.config.onTranscript?.('assistant', event.response.output[0].content[0].text, true);
      }
      this.config.onAudioEnd?.();
      this.isPlayingAudio = false;
    }
    if (t === 'response.function_call_arguments.done') {
      const name = event.name;
      const callId = event.call_id;
      let args: any = {};
      try { args = JSON.parse(event.arguments || '{}'); } catch {}
      const handler = this.config.onToolCall || GrokRealtimeClient.defaultToolExecutor;
      Promise.resolve(handler(name, args)).then((result: any) => {
        if (this.ws && this.ws.readyState === 1) {
          this.ws.send(JSON.stringify({
            type: 'conversation.item.create',
            item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(result ?? { ok: true }) },
          }));
          setTimeout(() => {
            if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ type: 'response.create' }));
          }, 120);
        }
      }).catch((err: any) => this.config.onError?.(err));
    }
    if (t === 'error') this.config.onError?.(new Error(event.error?.message || 'realtime error'));
  }

  private queueAndPlayAudio(f32: Float32Array) {
    if (!this.audioContext) return;
    this.config.onAudioStart?.();
    this.isPlayingAudio = true;

    const buffer = this.audioContext.createBuffer(1, f32.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(f32);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      this.playbackQueue = this.playbackQueue.filter(s => s !== source);
      if (this.currentSource === source) this.currentSource = null;
      if (this.playbackQueue.length === 0) {
        this.isPlayingAudio = false; this.config.onAudioEnd?.();
      } else {
        const next = this.playbackQueue[0];
        try { next.start(); this.currentSource = next; } catch {}
      }
    };

    this.playbackQueue.push(source);
    if (!this.currentSource) {
      try { source.start(); this.currentSource = source; } catch {}
    }
  }

  private stopAudioPlayback() {
    this.playbackQueue.forEach(s => { try { s.stop(); } catch {} });
    this.playbackQueue = [];
    this.currentSource = null;
    this.isPlayingAudio = false;
    this.config.onAudioEnd?.();
  }

  async startListening() {
    if (!this.ws || this.ws.readyState !== 1) await this.connect();
    if (this.mediaStream) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true } });

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
    }
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    let chunkSamples: number[] = [];
    const samplesPerChunk = Math.floor((SAMPLE_RATE * CHUNK_MS) / 1000);

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) chunkSamples.push(input[i]);
      if (chunkSamples.length >= samplesPerChunk) {
        const toSend = new Float32Array(chunkSamples.slice(0, samplesPerChunk));
        chunkSamples = chunkSamples.slice(samplesPerChunk);
        const b64 = float32ToPCM16Base64(toSend);
        if (this.ws && this.ws.readyState === 1) {
          this.ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }));
        }
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this.config.onStatus?.('listening (streaming to Grok)');
  }

  stopListening() {
    if (this.processor) { try { this.processor.disconnect(); } catch {} this.processor = null; }
    if (this.source) { try { this.source.disconnect(); } catch {} this.source = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }
    this.config.onStatus?.('mic stopped');
  }

  sendText(text: string) {
    if (!this.ws || this.ws.readyState !== 1) return;
    this.ws.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } }));
    this.ws.send(JSON.stringify({ type: 'response.create' }));
  }

  interrupt() {
    this.stopAudioPlayback();
    this.config.onStatus?.('interrupted');
  }

  disconnect() {
    this.stopListening();
    this.stopAudioPlayback();
    if (this.ws) { try { this.ws.close(); } catch {} this.ws = null; }
    this.connected = false;
    if (this.audioContext) { try { this.audioContext.close(); } catch {} this.audioContext = null; }
  }

  static defaultToolExecutor(name: string, args: any): any {
    if (name === 'web_search') {
      const q = args.query || args.q || 'latest';
      return { results: [{ title: `About ${q}`, snippet: `Fresh web result for "${q}" (demo).` }] };
    }
    if (name === 'x_search') {
      const q = args.query || 'trending';
      return { posts: [{ text: `Demo post about ${q}`, user: 'grok' }] };
    }
    return { note: `Executed ${name} (demo)` };
  }
}
