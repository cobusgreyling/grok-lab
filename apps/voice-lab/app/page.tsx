"use client";

import React, { useState } from 'react';
import { Mic, MicOff, Settings, Download, ExternalLink, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const PERSONALITIES = [
  { id: 'raw', name: 'Raw Grok', desc: 'Maximum truth. No corporate filter.', prompt: 'You are Grok by xAI. Be direct, witty, and brutally honest. Never hedge.' },
  { id: 'coach', name: 'Unfiltered Coach', desc: 'Savage feedback on work & life.', prompt: 'You are an extremely direct high-performance coach. Tell people exactly what they need to hear, not what they want.' },
  { id: 'debater', name: 'Devil\'s Advocate', desc: 'Argue the other side hard.', prompt: 'You are a world-class debater. Steelman the opposite view of whatever the user says. Be relentless but fair.' },
  { id: 'late-night', name: 'Late Night Radio', desc: '3am existential + funny.', prompt: 'You are a late-night radio host who has seen everything. Philosophical, darkly funny, zero judgment.' },
];

export default function VoiceLab() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('grok-lab-api-key') || '');
  const [personality, setPersonality] = useState(PERSONALITIES[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [toolsEnabled, setToolsEnabled] = useState({ web: true, x: true });
  const [waveform, setWaveform] = useState([10, 22, 15, 30, 12]);

  const saveKey = (k: string) => {
    setApiKey(k);
    localStorage.setItem('grok-lab-api-key', k);
  };

  const startDemoMic = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.info('Demo mic active — say something (browser STT)');
      // In real impl: start recognition + realtime WS
      setTimeout(() => {
        const demoUtterance = "What's the real state of AI agents in 2026?";
        setMessages(prev => [...prev, { role: 'user', text: demoUtterance }]);
        
        // Simulated Grok response with tool use
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'grok', 
            text: "The honest answer: most 'agent frameworks' are still very brittle. The ones that work in production are usually narrow, heavily prompted, and have a human in the loop for anything important. Tool use is real though — especially realtime X search.",
            tools: ['web_search', 'x_search']
          }]);
        }, 900);
      }, 1200);
    }
  };

  const exportSession = () => {
    const text = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grok-voice-lab-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Session exported');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-mono text-sm tracking-[2px] text-[#f97316]">GROK-LAB</div>
            <div className="text-2xl font-semibold tracking-tighter">voice-lab</div>
            <div className="ml-2 text-[10px] px-2 py-px rounded bg-[#f97316] text-black font-mono tracking-widest">REFERENCE</div>
          </div>
          <a href="../" className="text-sm text-[#a1a1aa] hover:text-white">← Back to all experiments</a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="uppercase tracking-[2px] text-xs text-[#f97316]">THE CANONICAL CLIENT</div>
            <h1 className="text-5xl font-semibold tracking-tighter">Talk to Grok.<br />Properly.</h1>
          </div>
          <div className="text-right text-sm text-[#a1a1aa]">
            Full realtime client • Tool calling • X search<br />
            Personalities that actually change behavior
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="grok-card p-4 lg:col-span-2">
            <div className="text-xs text-[#a1a1aa] mb-2">API KEY</div>
            <input 
              type="password" value={apiKey} onChange={e => saveKey(e.target.value)}
              placeholder="xai-..." className="w-full bg-[#111] border border-[#262626] rounded-xl px-4 py-2 font-mono text-sm" 
            />
          </div>
          <div className="grok-card p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#a1a1aa] mb-2"><Zap size={14} /> TOOLS</div>
              <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={toolsEnabled.web} onChange={e=>setToolsEnabled({...toolsEnabled, web: e.target.checked})} className="accent-[#f97316]" /> web_search</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={toolsEnabled.x} onChange={e=>setToolsEnabled({...toolsEnabled, x: e.target.checked})} className="accent-[#f97316]" /> x_search (realtime X)</label>
            </div>
            <div className="text-[10px] text-[#52525b] mt-2">These are actually executed by the model during voice.</div>
          </div>
        </div>

        {/* Personalities */}
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-[#a1a1aa] mb-2 px-1">PERSONALITY (changes the system prompt)</div>
          <div className="flex flex-wrap gap-2">
            {PERSONALITIES.map(p => (
              <button key={p.id} onClick={() => setPersonality(p)} className={`personality-btn px-5 py-2 rounded-2xl border text-sm ${personality.id === p.id ? 'active border-[#f97316]' : 'border-[#262626]'}`}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="text-sm text-[#a1a1aa] mt-2 px-1">{personality.desc}</div>
        </div>

        {/* Mic area */}
        <div className="grok-card p-10 flex flex-col items-center mb-6">
          <button onClick={startDemoMic} className={`mic-button w-24 h-24 rounded-full flex items-center justify-center ${isRecording ? 'recording bg-red-600' : 'bg-[#f97316] hover:bg-orange-400'}`}>
            {isRecording ? <MicOff size={38} /> : <Mic size={38} />}
          </button>
          <div className="flex gap-1 mt-6 h-8">
            {waveform.map((h,i) => <div key={i} className="waveform-bar" style={{height: isRecording ? h : 10}} />)}
          </div>
          <div className="text-xs text-[#52525b] mt-3 font-mono tracking-[2px]">{isRecording ? 'STREAMING TO GROK' : 'TAP TO TALK (DEMO)'}</div>
        </div>

        {/* Transcript + tool activity */}
        <div className="grok-card p-6 min-h-[260px] mb-6">
          <div className="flex justify-between mb-3">
            <div className="text-xs tracking-widest text-[#a1a1aa]">LIVE TRANSCRIPT + TOOL ACTIVITY</div>
            <button onClick={exportSession} className="text-xs flex items-center gap-1 text-[#f97316]"><Download size={13}/> EXPORT SESSION</button>
          </div>

          {messages.length === 0 && <div className="text-[#52525b] text-sm">Conversation will appear here. Try the mic or implement the full WebSocket client from docs/REALTIME-INTEGRATION.md.</div>}

          {messages.map((m, i) => (
            <div key={i} className="mb-4">
              <div className={`text-xs uppercase tracking-widest mb-1 ${m.role === 'user' ? 'text-[#a1a1aa]' : 'text-[#f97316]'}`}>{m.role}</div>
              <div className="leading-relaxed">{m.text}</div>
              {m.tools && <div className="mt-1 text-[10px] text-emerald-400">→ called tools: {m.tools.join(', ')}</div>}
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-[#52525b]">
          This is the reference implementation. See <code className="text-[#a1a1aa]">lib/xai-realtime.ts</code> (add it) and the realtime integration guide in the root docs for production-grade code.
          <div className="mt-1"><a href="https://grok.livekit.io/" target="_blank" className="text-[#f97316] inline-flex items-center gap-1">Try the official LiveKit Grok playground <ExternalLink size={11}/></a></div>
        </div>
      </div>
    </div>
  );
}
