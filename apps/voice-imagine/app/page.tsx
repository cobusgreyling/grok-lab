"use client";

import React, { useState, useEffect } from 'react';
import { Mic, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
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
    
    // Demo: use picsum with seed for "different" images. 
    // Real: call xAI Imagine API here (grok-imagine-image or your endpoint)
    await new Promise(r => setTimeout(r, 850));
    
    const newImg = {
      url: `https://picsum.photos/id/${Math.floor(Math.random()*50)}/800/600`,
      prompt
    };
    setImages(prev => [newImg, ...prev].slice(0, 6));
    setCurrentPrompt(prompt);
    setIsGenerating(false);
    toast.success('Image generated (demo picsum — wire real xAI Imagine in /api)');
  };

  const handleVoiceRefine = () => {
    setIsRecording(true);
    toast.info('Listening for creative direction...');
    
    // Demo: pick a random refine after "listening"
    setTimeout(() => {
      setIsRecording(false);
      const refine = REFINE_PROMPTS[Math.floor(Math.random() * REFINE_PROMPTS.length)];
      const newPrompt = `${currentPrompt}, ${refine}`;
      generateImage(newPrompt);
    }, 1600);
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
            disabled={isRecording || isGenerating}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-[#f97316] hover:bg-orange-400'}`}
          >
            <Mic size={32} />
          </button>
          <div className="mt-3 text-xs tracking-[1.5px] text-[#a1a1aa]">{isRecording ? 'SAY HOW TO CHANGE IT' : 'TAP TO REFINE WITH YOUR VOICE'}</div>
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
          Wire the real xAI image generation endpoint (grok-imagine-image) in a server route for production. Voice loop + iterative prompting is the killer feature here.
        </div>
      </div>
    </div>
  );
}
