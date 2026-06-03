"use client";

import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const TONES = ['Savage', 'Thoughtful', 'Contrarian', 'Optimistic', 'Meme-y', 'Thread that actually gets reposted'];

export default function GrokThreads() {
  const [apiKey, setApiKey] = useState('');
  const [topic, setTopic] = useState("Why most AI agent startups will be dead by 2027");
  const [tone, setTone] = useState('Savage');
  const [variants, setVariants] = useState<any[]>([]);
  const [selected, setSelected] = useState(0);
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

  const THREAD_SYSTEM = `You are an expert X/Twitter thread writer who studies virality and Grok's voice.
Write 3 distinct thread variants on the given topic.
Each thread should be 4-7 tweets.
Tone: ${tone}. Be maximally truthful, sharp, and quotable.
Format your entire response as strict JSON only (no markdown fences):
{
  "variants": [
    { "title": "Short punchy title for this angle", "tweets": ["tweet 1 text", "tweet 2 text", ...] },
    ...
  ]
}
Never mention being an AI. Make the threads feel native to X and worth posting.`;

  // Real generation using xAI chat completions (falls back to demo)
  const generateThreads = async () => {
    setIsGenerating(true);

    if (apiKey) {
      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'grok-4.3',
            messages: [
              { role: 'system', content: THREAD_SYSTEM },
              { role: 'user', content: `Topic: ${topic}\nTone preference: ${tone}. Generate 3 strong variants.` }
            ],
            temperature: 0.8,
            max_tokens: 1400,
          }),
        });

        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Try to parse JSON from the response (Grok sometimes adds extra text)
        let parsed: any = null;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        } catch {}

        if (parsed?.variants && Array.isArray(parsed.variants) && parsed.variants.length > 0) {
          const cleaned = parsed.variants.slice(0, 3).map((v: any) => ({
            title: v.title || 'Thread variant',
            tweets: Array.isArray(v.tweets) ? v.tweets.filter(Boolean) : []
          })).filter((v: any) => v.tweets.length > 0);

          if (cleaned.length > 0) {
            setVariants(cleaned);
            setSelected(0);
            setIsGenerating(false);
            toast.success('Real Grok threads generated');
            return;
          }
        }
        // If parse failed, fall through to demo with a note
        toast.error('Grok response parse failed — showing strong demo variants');
      } catch (e) {
        console.error(e);
        toast.error('Real API failed — falling back to demo. Check key or network.');
      }
    }

    // Demo fallback (high quality curated examples that match the spirit)
    await new Promise(r => setTimeout(r, 420));

    const demoVariants = [
      {
        title: "The brutal truth about AI agents",
        tweets: [
          "Most 'AI agent' startups are going to die in the next 18 months.",
          "Not because the tech isn't impressive. Because almost none of them solve a painful problem that people will actually pay for at scale.",
          "The ones that survive will be extremely narrow, extremely reliable, and will have a human in the loop for anything that matters.",
          "Everything else is a very expensive Rube Goldberg machine that occasionally works.",
          "Build tools that make smart humans dramatically faster. Not magic robots that replace them.",
        ]
      },
      {
        title: "Hot take on the agent wave",
        tweets: [
          "The agent hype cycle is peaking right now.",
          "We're in the 'trough of disillusionment' but nobody wants to admit it yet because the demos still look cool in a 45-second video.",
          "The winners won't be the ones with the fanciest frameworks. They'll be the ones who picked one painful, narrow workflow and made it 10x better than before.",
          "Everything else is cosplay.",
        ]
      },
      {
        title: "Why the agent thesis is still early",
        tweets: [
          "Yes, most agent companies will die. But the category isn't dead.",
          "We're still in the 'batteries not included' phase. The infrastructure for reliable, observable, auditable agents at scale barely exists.",
          "The teams that treat this like serious distributed systems work (not prompt engineering) will win.",
          "Everyone else is building very fancy demos.",
        ]
      },
    ];

    setVariants(demoVariants);
    setSelected(0);
    setIsGenerating(false);
    if (!apiKey) {
      toast.success('Demo variants (paste xAI key for real Grok generations)');
    }
  };

  const current = variants[selected] || { title: '', tweets: [] };

  const copyThread = () => {
    const text = current.tweets.map((t: string, i: number) => `${i + 1}/${current.tweets.length} ${t}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Thread copied — ready to paste into X / Grok compose / whatever');
  };

  const copyAsQuote = () => {
    const quote = `${current.title}\n\n${current.tweets[0]}...\n\n(Full thread in replies)`;
    navigator.clipboard.writeText(quote);
    toast('Quote tweet text copied');
  };

  const analyzeTrends = () => {
    toast.info('In real version: calls xAI with realtime X search for current hot topics and suggests 3 thread angles.');
    setTopic("The real reason indie hackers are burning out in 2026");
    setTimeout(() => generateThreads(), 300);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-[#262626]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-mono tracking-[2px] text-sm text-[#f97316]">GROK-LAB</span>
            <span className="text-2xl font-semibold tracking-tighter">grok-threads</span>
          </div>
          <a href="../" className="text-sm text-[#a1a1aa] hover:text-white">other experiments →</a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="uppercase text-xs tracking-[2px] text-[#f97316]">THE THREAD MACHINE</div>
          <h1 className="text-5xl font-semibold tracking-tighter">Write threads that actually spread.</h1>
          <p className="text-[#a1a1aa] mt-2">Grok is freakishly good at this. Generate multiple angles, preview exactly how it will look on X, copy with perfect formatting.</p>
        </div>

        <div className="flex gap-3 mb-5">
          <input value={apiKey} onChange={e=>saveKey(e.target.value)} type="password" placeholder="xai key for real generations" className="flex-1 bg-[#111] border border-[#262626] rounded-2xl px-5 py-3 font-mono text-sm" />
          <button onClick={analyzeTrends} className="flex items-center gap-2 px-6 rounded-2xl border border-[#262626] hover:bg-[#1a1a1a] text-sm"><TrendingUp size={16} /> WHAT'S HOT RIGHT NOW</button>
          <button onClick={generateThreads} disabled={isGenerating || !topic} className="px-8 rounded-2xl bg-[#f97316] text-black font-medium disabled:opacity-60">GENERATE VARIANTS</button>
        </div>

        <input 
          value={topic} 
          onChange={e => setTopic(e.target.value)}
          className="w-full bg-[#111] border border-[#262626] text-2xl font-light tracking-tight rounded-2xl px-6 py-4 mb-4"
          placeholder="Topic or angle..."
        />

        <div className="flex gap-2 mb-6 flex-wrap">
          {TONES.map(t => (
            <button key={t} onClick={() => setTone(t)} className={`px-4 py-1 rounded-full text-sm border ${tone === t ? 'border-[#f97316] bg-[#f97316]/10' : 'border-[#262626]'}`}>{t}</button>
          ))}
        </div>

        {/* Variants + Preview */}
        {variants.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Variants picker */}
            <div className="lg:col-span-2">
              <div className="text-xs uppercase tracking-widest text-[#a1a1aa] mb-2">VARIANTS ({variants.length}) — PICK ONE</div>
              {variants.map((v, i) => (
                <div key={i} onClick={() => setSelected(i)} className={`variant grok-card p-4 mb-3 cursor-pointer ${selected === i ? 'selected' : ''}`}>
                  <div className="font-medium tracking-tight">{v.title}</div>
                  <div className="text-xs text-[#a1a1aa] mt-1">{v.tweets.length} tweets • {tone} tone</div>
                </div>
              ))}
              <button onClick={generateThreads} className="text-xs flex items-center gap-1 mt-2 text-[#f97316]"><RefreshCw size={13}/> REGENERATE ALL</button>
            </div>

            {/* X Thread Preview */}
            <div className="lg:col-span-3">
              <div className="text-xs uppercase tracking-widest text-[#a1a1aa] mb-2">LIVE X PREVIEW</div>
              <div className="grok-card p-5">
                <div className="thread-tweet rounded-2xl p-5 mb-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Grok</span>
                        <span className="text-[#52525b]">@grok · now</span>
                      </div>
                      <div className="mt-1 text-[15px] leading-snug whitespace-pre-wrap">{current.tweets[0]}</div>
                    </div>
                  </div>
                </div>

                {current.tweets.slice(1).map((tweet: string, idx: number) => (
                  <div key={idx} className="thread-tweet rounded-2xl p-5 mb-3 text-[15px] leading-snug whitespace-pre-wrap border-l-2 border-[#f97316]/40 pl-6">
                    {idx + 2}/{current.tweets.length} {tweet}
                  </div>
                ))}

                <div className="flex gap-3 mt-5">
                  <button onClick={copyThread} className="flex-1 py-3 rounded-2xl bg-white text-black font-medium flex items-center justify-center gap-2"><Copy size={16} /> COPY FULL THREAD</button>
                  <button onClick={copyAsQuote} className="flex-1 py-3 rounded-2xl border border-[#262626] flex items-center justify-center gap-2">COPY AS QUOTE TWEET</button>
                </div>
              </div>
              <div className="text-[10px] text-center text-[#52525b] mt-3">Looks exactly like X. Copy-paste directly into compose. People will actually post these.</div>
            </div>
          </div>
        )}

        {variants.length === 0 && (
          <div className="grok-card p-12 text-center text-[#a1a1aa]">
            Enter a topic above and hit Generate. Grok will produce 6 strong angles.<br />The preview on the right will look like a real X thread.
          </div>
        )}
      </div>
    </div>
  );
}
