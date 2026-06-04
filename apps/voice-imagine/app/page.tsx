"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Download, RefreshCw, Image as ImageIcon, MicOff } from 'lucide-react';
import { toast } from 'sonner';

const REFINE_PROMPTS = [
  "make it more dramatic",
  "add a tiny ridiculous hat",
  "darker, more cyberpunk",
  "cute but slightly menacing",
  "in the style of a 90s anime key visual",
  "photorealistic, golden hour"
];

export default function VoiceImagine() {
  const [apiKey, setApiKey] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState("A majestic dragon overlooking a neon city at night");
  const [images, setImages] = useState<Array<{ url: string; prompt: string }>>([
    { url: "https://picsum.photos/id/1015/800/600", prompt: "A majestic dragon overlooking a neon city at night" }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Load API key from localStorage (safe for SSR)
  useEffect(() => {
    const savedKey = localStorage.getItem('grok-lab-api-key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveKey = (k: string) => {
    setApiKey(k);
    localStorage.setItem('grok-lab-api-key', k);
  };

  const generateImage = async (prompt: string) => {
    setIsGenerating(true);

    let imageUrl: string | null = null;

    if (apiKey) {
      try {
        // Try server proxy first (recommended for public deploys)
        let res = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'grok-imagine-image', prompt, n: 1 }),
        });

        let data: any = null;
        if (res.ok) {
          data = await res.json();
          if (data.useClientKey) {
            // No server key — direct call from browser with user key (same as before)
            res = await fetch('https://api.x.ai/v1/images/generations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({ model: 'grok-imagine-image', prompt, n: 1 }),
            });
            if (!res.ok) {
              const err = await res.text().catch(() => '');
              throw new Error(`API ${res.status}: ${err}`);
            }
            data = await res.json();
          }
        }

        if (data) {
          imageUrl = data?.data?.[0]?.url || data?.url || data?.images?.[0]?.url || null;
        }
      } catch (err: any) {
        console.error('Real image gen failed', err);
        toast.error(`Real Imagine failed — using demo placeholder. ${err?.message || ''}`);
      }
    }

    if (!imageUrl) {
      // Demo fallback (no key or API failed)
      await new Promise(r => setTimeout(r, 650));
      imageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 50)}/800/600`;
    }

    const newImg = { url: imageUrl, prompt };
    setImages(prev => [newImg, ...prev].slice(0, 6));
    setCurrentPrompt(prompt);
    setIsGenerating(false);

    const isReal = !!apiKey && imageUrl && !imageUrl.includes('picsum');
    toast.success(isReal ? 'Image generated with Grok Imagine' : 'Image generated (demo placeholder)');
  };

  const stopVoiceRefine = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleVoiceRefine = () => {
    if (isRecording) {
      stopVoiceRefine();
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error('Speech recognition not supported — use a quick refine pill or type a new prompt instead.');
      // Fallback: pick one
      const refine = REFINE_PROMPTS[Math.floor(Math.random() * REFINE_PROMPTS.length)];
      generateImage(`${currentPrompt}, ${refine}`);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) {
        const newPrompt = `${currentPrompt}, ${transcript.trim()}`;
        generateImage(newPrompt);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('STT error', event);
      toast.error('Mic error — using a quick refine instead.');
      const refine = REFINE_PROMPTS[Math.floor(Math.random() * REFINE_PROMPTS.length)];
      generateImage(`${currentPrompt}, ${refine}`);
      stopVoiceRefine();
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      toast.info('Listening for creative direction...');
    } catch (e) {
      toast.error('Could not start microphone');
      setIsRecording(false);
    }
  };

  const exportCreation = () => {
    const latest = images[0];
    const text = `Prompt: ${latest.prompt}\n\nImage: ${latest.url}\n\nGenerated in grok-lab / voice-imagine with xAI`;
    navigator.clipboard.writeText(text);
    toast.success('Prompt + link copied. (Real export would download the actual image + metadata)');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-[#262626]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm tracking-[2px] text-[#f97316]">GROK-LAB</span>
            <span className="text-2xl font-semibold tracking-tighter">voice-imagine</span>
          </div>
          <a href="../" className="text-sm text-[#a1a1aa] hover:text-white">all experiments →</a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="uppercase text-xs tracking-[2px] text-[#f97316]">VOICE + IMAGINE LOOP</div>
          <h1 className="text-5xl font-semibold tracking-tighter mt-1">Talk. Generate. Iterate.<br />Out loud.</h1>
          <p className="text-[#a1a1aa] mt-2 max-w-md">The most delightful way to direct image and video generation. Grok listens, understands intent, and edits live.</p>
        </div>

        <div className="flex gap-4 mb-6">
          <input 
            value={apiKey} onChange={e => saveKey(e.target.value)} type="password" placeholder="xai-... (for real Imagine calls)"
            className="flex-1 bg-[#111] border border-[#262626] rounded-2xl px-5 py-3 font-mono text-sm" 
          />
          <button onClick={() => generateImage(currentPrompt)} disabled={isGenerating} className="px-8 rounded-2xl bg-white text-black font-medium flex items-center gap-2 disabled:opacity-60">
            <ImageIcon size={18} /> GENERATE
          </button>
        </div>

        {/* Big current image */}
        <div className="image-frame rounded-3xl overflow-hidden mb-6 aspect-video relative flex items-center justify-center">
          {images[0] && <img src={images[0].url} alt={images[0].prompt} className="object-cover w-full h-full" />}
          {isGenerating && <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-sm tracking-widest">GENERATING WITH GROK IMAGINE...</div>}
        </div>

        <div className="text-sm text-[#a1a1aa] mb-2 px-1">CURRENT DIRECTION</div>
        <div className="grok-card p-5 mb-6 text-lg font-light tracking-tight">{currentPrompt}</div>

        {/* Voice refine */}
        <div className="flex flex-col items-center mb-8">
          <button 
            onClick={handleVoiceRefine} 
            disabled={isGenerating}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-[#f97316] hover:bg-orange-400'}`}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          <div className="mt-3 text-xs tracking-[1.5px] text-[#a1a1aa]">{isRecording ? 'LISTENING — SPEAK YOUR REFINEMENT' : 'TAP MIC TO REFINE WITH YOUR VOICE (OR USE PILLS BELOW)'}</div>
        </div>

        {/* Quick refine pills */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-[#a1a1aa] mb-2">QUICK VOICE REFINES (click to simulate)</div>
          <div className="flex flex-wrap gap-2">
            {REFINE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => generateImage(`${currentPrompt}, ${p}`)} className="refine-pill text-sm px-5 py-2 rounded-2xl border border-[#262626] hover:border-[#f97316]">
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* History strip */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs uppercase tracking-widest text-[#a1a1aa]">ITERATION HISTORY</div>
            <button onClick={exportCreation} className="text-xs flex items-center gap-1.5 text-[#f97316]"><Download size={13} /> EXPORT LATEST + PROMPT</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map((img, idx) => (
              <div key={idx} onClick={() => { setCurrentPrompt(img.prompt); }} className="cursor-pointer group">
                <div className="aspect-video rounded-xl overflow-hidden border border-[#262626] group-hover:border-[#f97316]">
                  <img src={img.url} className="w-full h-full object-cover" />
                </div>
                <div className="text-[10px] text-[#52525b] mt-1.5 line-clamp-2">{img.prompt}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-[#52525b]">
          Paste an xAI key for real <span className="font-mono">grok-imagine-image</span> generations. Voice-driven iterative refinement + shareable outputs are the killer feature.
        </div>
      </div>
    </div>
  );
}
