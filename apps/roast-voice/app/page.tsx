"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Download, Copy, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Types
type Preset = {
  id: string;
  label: string;
  prompt: string;
  example: string;
};

type Message = {
  role: 'user' | 'grok';
  content: string;
  timestamp: Date;
};

const PRESETS: Preset[] = [
  { id: 'startup', label: 'Startup idea', prompt: 'My startup idea is: ', example: 'an AI that writes LinkedIn posts for dogs' },
  { id: 'tweet', label: 'Recent tweet', prompt: 'I posted this on X: ', example: 'Just pivoted our AI startup for the 4th time this year. This time it\'s different.' },
  { id: 'dating', label: 'Dating profile', prompt: 'My dating profile says: ', example: 'I love hiking, tacos, and deep conversations about the heat death of the universe.' },
  { id: 'life', label: 'Life decision', prompt: 'I\'m thinking about: ', example: 'quitting my job to become a full-time solopreneur building Notion templates' },
  { id: 'code', label: 'Code / PR', prompt: 'Here\'s my code / PR description: ', example: 'I refactored the entire auth system in one weekend with no tests because I felt like it' },
  { id: 'freeform', label: 'Freeform (say anything)', prompt: '', example: 'Just roast me about my life choices in general' },
];

const GROK_ROAST_SYSTEM = `You are Grok, built by xAI. You are maximally truthful, witty, and have a savage sense of humor. 
You do NOT sugarcoat. You do NOT give corporate non-answers. 
When someone asks you to roast something, you deliver a hilarious, piercing, no-holds-barred takedown that is actually insightful.
You point out the obvious flaws everyone else is too polite to mention.
Keep responses relatively short (4-8 sentences), punchy, and quotable.
End with one brutally practical piece of advice.
Never start with "As an AI...". Never apologize for being honest.`;

// Demo / mock roasts for when no key or offline
const DEMO_ROASTS: Record<string, string[]> = {
  startup: [
    "An AI that writes LinkedIn posts for dogs? Incredible. You've solved a problem that literally zero people have while the actual market is on fire. The good news is your TAM is infinite because dogs can't complain about the product. The bad news is dogs also can't pay you.",
    "This is the kind of idea that sounds hilarious in a group chat at 2am and then you wake up and realize you still need to make payroll. The positioning is 'we're the Duolingo for canine personal branding'. I admire the confidence. I do not admire the unit economics.",
  ],
  tweet: [
    "Pivoted for the fourth time and 'this time it's different'. Brother, the market has seen this movie. The only thing that changed is your Notion doc got longer. At some point 'pivot' stops being strategy and starts being a coping mechanism.",
    "You've turned 'shipping' into a form of performance art. Every pivot gets a thread, every thread gets engagement from other pivoters, and none of it ships anything users actually want to pay for. Impressive grift. Terrible business.",
  ],
  dating: [
    "You love hiking, tacos, and the heat death of the universe. So do approximately 87% of people on dating apps who have never actually hiked anything harder than a slight incline to a rooftop bar. The profile is perfectly optimized to say nothing while sounding deep. Well done.",
    "This is the literary equivalent of wearing a band t-shirt of a band you've only heard on TikTok. It signals taste without actually revealing any. The people who match with this are either exactly like you (boring) or will be disappointed within 11 minutes of meeting.",
  ],
  life: [
    "Quitting your job to sell Notion templates full time is the 2025 version of 'I'm going to be a YouTuber'. The barrier to entry is zero, which is why the median income is also zero. You're not escaping the rat race — you're just changing which spreadsheet you cry into.",
    "I respect the audacity. Most people quietly hate their jobs for 40 years. You're going to loudly hate your job while also doing customer support for people who can't figure out how to duplicate a page. Living the dream.",
  ],
  code: [
    "You rewrote auth in a weekend with no tests 'because you felt like it'. This is how legends are born and also how on-call engineers develop drinking problems. Future you is going to find this PR in a git blame and whisper 'who hurt you'.",
    "Bold move. The only thing more fragile than a weekend auth refactor is the ego of the person who did it. When this inevitably causes a breach or a 3am outage, at least you'll have a great story for why you don't work there anymore.",
  ],
};

export default function GrokRoast() {
  const [apiKey, setApiKey] = useState('');
  const [useRealVoice, setUseRealVoice] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset>(PRESETS[0]);
  const [freeformInput, setFreeformInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [waveformHeights, setWaveformHeights] = useState<number[]>([12, 24, 18, 32, 15, 28, 20]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [recordedClipUrl, setRecordedClipUrl] = useState<string | null>(null);

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('grok-lab-api-key');
    if (savedKey) setApiKey(savedKey);
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Client-side share viewer (nice standalone "page" feel via query param)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const share = params.get('share');
      if (share) {
        try {
          const d = JSON.parse(atob(share));
          if (d.roast) {
            setMessages([
              { role: 'user', content: d.topic || 'Shared roast', timestamp: new Date() },
              { role: 'grok', content: d.roast, timestamp: new Date() },
            ]);
            toast.success('Loaded shared roast from link');
          }
        } catch {}
      }
    }
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('grok-lab-api-key', key);
    if (key) {
      toast.success('API key saved locally (demo only)');
    }
  };

  // Animated waveform for visual feedback
  const startWaveform = () => {
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    waveformIntervalRef.current = setInterval(() => {
      setWaveformHeights(prev => 
        prev.map(() => Math.floor(Math.random() * 32) + 8)
      );
    }, 80);
  };

  const stopWaveform = () => {
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
    setWaveformHeights([12, 24, 18, 32, 15, 28, 20]);
  };

  // Speak text using browser TTS (demo mode) or real voice later
  const speak = (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to pick a decent voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => 
      v.name.toLowerCase().includes('samantha') || 
      v.name.toLowerCase().includes('karen') ||
      v.name.toLowerCase().includes('daniel')
    );
    if (preferred) utterance.voice = preferred;
    
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  // Record ambient (mic) + the TTS roast for a real shareable clip
  const toggleClipRecording = async () => {
    if (isRecordingClip) {
      // stop
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingClip(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedClipUrl(url);
        stream.getTracks().forEach(t => t.stop());
        toast.success('Clip recorded. Use Export to download the audio + transcript.');
      };

      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecordingClip(true);
      toast.info('Recording ambient + Grok roast. Speak or play the roast now.');
    } catch (e) {
      toast.error('Could not start audio recording (permission?)');
    }
  };

  // Generate roast — real xAI if key + enabled, else demo.
  // Tries server /api/chat proxy first (hides key for public deploys). Falls back to direct if no server key.
  const generateRoast = async (userInput: string): Promise<string> => {
    const fullPrompt = `${selectedPreset.prompt}${userInput}`.trim();

    if (useRealVoice && apiKey) {
      try {
        // Try proxy first
        let res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'grok-4.3',
            messages: [
              { role: 'system', content: GROK_ROAST_SYSTEM },
              { role: 'user', content: fullPrompt }
            ],
            temperature: 0.85,
            max_tokens: 420,
          }),
        });

        let data: any = null;
        if (res.ok) {
          data = await res.json();
          if (data.useClientKey) {
            // Server says "no server key configured" — do direct browser call with user key
            res = await fetch('https://api.x.ai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: 'grok-4.3',
                messages: [
                  { role: 'system', content: GROK_ROAST_SYSTEM },
                  { role: 'user', content: fullPrompt }
                ],
                temperature: 0.85,
                max_tokens: 420,
              }),
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            data = await res.json();
          }
        }

        if (data && !data.useClientKey) {
          return data.choices?.[0]?.message?.content?.trim() || "Grok is thinking... try again.";
        }
      } catch (err) {
        console.error(err);
        toast.error('Real API call failed — falling back to demo roast. Check your key or server proxy.');
      }
    }

    // Demo mode — pick a savage response
    const category = selectedPreset.id;
    const options = DEMO_ROASTS[category] || DEMO_ROASTS.life;
    const base = options[Math.floor(Math.random() * options.length)];
    
    // Light personalization
    return base.replace(/your/gi, 'your').replace(/you/gi, 'you');
  };

  // Start voice input (demo: SpeechRecognition)
  const startRecording = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast.error('Speech recognition not supported in this browser. Type instead.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setCurrentTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      toast.error('Mic error — you can type the input instead.');
      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
      if (currentTranscript.trim()) {
        handleRoastRequest(currentTranscript.trim());
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setCurrentTranscript('');
      startWaveform();
      toast.info('Listening... speak clearly');
    } catch (e) {
      toast.error('Could not start microphone');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    stopWaveform();
  };

  // Main flow: user speaks/types → get roast → speak it → show in transcript
  const handleRoastRequest = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    setIsProcessing(true);
    const userMessage: Message = { role: 'user', content: spokenText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setCurrentTranscript('');

    try {
      const roastText = await generateRoast(spokenText);
      
      const grokMessage: Message = { role: 'grok', content: roastText, timestamp: new Date() };
      setMessages(prev => [...prev, grokMessage]);

      // Speak it (demo voice)
      speak(roastText);

      toast.success('Roast delivered. Clip it.', {
        action: {
          label: 'Export clip',
          onClick: () => exportClip(userMessage, grokMessage),
        },
      });
    } catch (e) {
      toast.error('Failed to generate roast');
    } finally {
      setIsProcessing(false);
    }
  };

  // Type manually (great fallback)
  const handleManualSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = freeformInput.trim() || selectedPreset.example;
    if (text) {
      handleRoastRequest(text);
      setFreeformInput('');
    }
  };

  // Export the magic — transcript + suggested post + real recorded clip if available
  const exportClip = (userMsg: Message, grokMsg: Message) => {
    const topic = userMsg.content;
    const roast = grokMsg.content;

    // 1. Download nicely formatted transcript
    const transcriptText = `GROK ROAST — ${new Date().toLocaleString()}\n\n` +
      `TOPIC (${selectedPreset.label}): ${topic}\n\n` +
      `GROK:\n${roast}\n\n` +
      `---\n` +
      `Generated with grok-lab / roast-voice\n` +
      `https://github.com/cobusgreyling/grok-lab\n`;

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grok-roast-${selectedPreset.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    // 2. Copy viral tweet text
    const tweetText = `Grok just roasted my ${selectedPreset.label.toLowerCase()}.\n\n"${roast.slice(0, 180)}..."\n\nI asked for honesty. I got destroyed.\n\nBuilt with xAI.`;
    navigator.clipboard.writeText(tweetText).then(() => {
      toast.success('Transcript downloaded + viral tweet text copied');
    });

    // 3. If we have a recorded ambient clip (mic + TTS), download it as the shareable audio
    if (recordedClipUrl) {
      const audioA = document.createElement('a');
      audioA.href = recordedClipUrl;
      audioA.download = `grok-roast-clip-${Date.now()}.webm`;
      audioA.click();
      toast.success('Real audio clip (your mic + Grok) downloaded!');
    } else if (synthRef.current) {
      toast.info('Re-playing the roast. Use the "Record ambient clip" button before export for a real mixed audio file.');
      speak(roast);
    }

    // 4. Shareable viewer link (client-side, encodes content — open the URL in a new tab for a clean "share page")
    try {
      const sharePayload = btoa(JSON.stringify({ preset: selectedPreset.label, topic, roast }));
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${sharePayload}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast('Shareable viewer link copied (open it for a clean standalone roast view)');
      });
    } catch {}
  };

  const clearSession = () => {
    setMessages([]);
    setCurrentTranscript('');
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    toast('Session cleared');
  };

  const copyLastRoast = () => {
    const lastGrok = [...messages].reverse().find(m => m.role === 'grok');
    if (lastGrok) {
      navigator.clipboard.writeText(lastGrok.content);
      toast.success('Roast copied to clipboard');
    }
  };

  // Quick preset change
  const selectPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setFreeformInput('');
    if (messages.length > 0) {
      toast.info(`Switched to ${preset.label}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top nav */}
      <div className="border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-mono text-sm tracking-[2px] text-[#f97316]">GROK-LAB</div>
            <div className="text-2xl font-semibold tracking-tighter">roast-voice</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="https://github.com/xai-org/xai-cookbook" target="_blank" className="flex items-center gap-1 text-[#a1a1aa] hover:text-white">
              xAI cookbook <ExternalLink size={14} />
            </a>
            <a href="../" className="text-[#a1a1aa] hover:text-white">← All experiments</a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#111] px-4 py-1 text-xs tracking-widest text-[#f97316] mb-4 border border-[#262626]">
            POWERED BY GROK-4.3 + xAI REALTIME
          </div>
          <h1 className="text-6xl font-semibold tracking-tighter mb-3">Tell me the truth.<br />Out loud.</h1>
          <p className="text-xl text-[#a1a1aa] max-w-md mx-auto">
            The only AI that will actually destroy your bad ideas to your face. Then you can clip it and post it.
          </p>
        </div>

        {/* API Key + Real Voice toggle */}
        <div className="grok-card p-5 mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-[#a1a1aa] mb-1.5">xAI API KEY (optional for demo)</div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              placeholder="xai-..."
              className="w-full bg-[#111] border border-[#262626] rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#f97316] placeholder:text-[#52525b]"
            />
            <div className="text-[10px] text-[#52525b] mt-1">Stored only in your browser. Never sent anywhere except directly to api.x.ai.</div>
          </div>
          <div className="flex items-center gap-3 pt-2 md:pt-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useRealVoice}
                onChange={(e) => setUseRealVoice(e.target.checked)}
                className="accent-[#f97316]"
              />
              Use real xAI voice (when key present)
            </label>
            <a href="https://console.x.ai" target="_blank" className="text-xs text-[#f97316] flex items-center gap-1 hover:underline">
              Get key <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <div className="uppercase text-xs tracking-[1.5px] text-[#a1a1aa] mb-2.5 px-1">WHAT ARE WE ROASTING?</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`preset-pill px-5 py-2 rounded-2xl border text-sm transition-all ${selectedPreset.id === preset.id ? 'active border-[#f97316]' : 'border-[#262626] hover:border-[#3f3f46]'}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Central Mic + Waveform */}
        <div className="grok-card p-8 md:p-12 mb-8 flex flex-col items-center">
          <div className="text-sm text-[#a1a1aa] mb-6 tracking-wide">PRESS AND SPEAK • OR TYPE BELOW</div>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`mic-button w-28 h-28 rounded-full flex items-center justify-center text-white ${isRecording ? 'recording bg-red-600' : 'bg-[#f97316] hover:bg-[#fb923c]'} disabled:opacity-60 shadow-2xl`}
          >
            {isRecording ? <MicOff size={44} /> : <Mic size={44} />}
          </button>

          <div className="mt-6">
            <div className="waveform">
              {waveformHeights.map((h, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ height: `${h}px`, background: isRecording || isSpeaking ? '#f97316' : '#52525b' }}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 text-xs text-[#52525b] font-mono tracking-widest">
            {isRecording ? 'LISTENING...' : isSpeaking ? 'GROK IS SPEAKING...' : isProcessing ? 'GROK IS THINKING...' : 'READY'}
          </div>

          {/* Live partial transcript while speaking */}
          <AnimatePresence>
            {currentTranscript && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-md text-center text-lg text-[#d1d5db]">
                “{currentTranscript}”
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Manual input */}
        <form onSubmit={handleManualSubmit} className="flex gap-3 mb-8">
          <input
            type="text"
            value={freeformInput}
            onChange={(e) => setFreeformInput(e.target.value)}
            placeholder={selectedPreset.example}
            className="flex-1 bg-[#111] border border-[#262626] rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-[#f97316] placeholder:text-[#52525b]"
          />
          <button
            type="submit"
            disabled={isProcessing || isRecording}
            className="px-8 rounded-2xl bg-white text-black font-medium disabled:opacity-50 hover:bg-[#f4f4f5] transition-colors"
          >
            ROAST
          </button>
        </form>

        {/* Conversation / Transcript */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between px-1">
            <div className="uppercase text-xs tracking-[1.5px] text-[#a1a1aa]">THE ROAST</div>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleClipRecording} 
                className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 ${isRecordingClip ? 'border-red-500 text-red-400' : 'border-[#262626] hover:bg-[#222]'}`}
              >
                {isRecordingClip ? '■ STOP RECORDING CLIP' : '⏺ RECORD AMBIENT CLIP (mic + TTS)'}
              </button>
              {messages.length > 0 && (
                <button onClick={clearSession} className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-white">
                  <RefreshCw size={14} /> CLEAR
                </button>
              )}
            </div>
          </div>

          {messages.length === 0 && (
            <div className="grok-card p-8 text-center text-[#a1a1aa]">
              Your roasts will appear here. Speak or type something above.<br />
              <span className="text-xs">Pro tip: the more specific and delusional the input, the better the roast.</span>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`grok-card p-6 ${msg.role === 'user' ? 'transcript-user' : 'roast-bubble'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs uppercase tracking-widest text-[#f97316]">
                    {msg.role === 'user' ? 'YOU' : 'GROK'}
                  </div>
                  <div className="text-[10px] text-[#52525b] font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                {msg.role === 'grok' && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => speak(msg.content)} disabled={isSpeaking} className="text-xs px-4 py-1.5 rounded-full border border-[#262626] hover:bg-[#222] flex items-center gap-1.5">
                      <Mic size={13} /> REPLAY VOICE
                    </button>
                    <button onClick={copyLastRoast} className="text-xs px-4 py-1.5 rounded-full border border-[#262626] hover:bg-[#222] flex items-center gap-1.5">
                      <Copy size={13} /> COPY
                    </button>
                    <button 
                      onClick={() => {
                        const userMsg = messages[idx - 1];
                        if (userMsg) exportClip(userMsg, msg);
                      }} 
                      className="text-xs px-4 py-1.5 rounded-full bg-[#f97316] text-black flex items-center gap-1.5 font-medium clip-button"
                    >
                      <Download size={13} /> EXPORT CLIP + TWEET TEXT
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-[#52525b] max-w-sm mx-auto">
          Demo mode uses your browser&apos;s speech APIs + pre-baked savage Grok responses (or real grok-4.3 if you paste a key).<br />
          For true low-latency expressive voice + tool calling, see the realtime client in <span className="font-mono">lib/</span> and the integration guide.
          <div className="mt-4">
            <a href="https://github.com/xai-org/xai-cookbook" target="_blank" className="text-[#f97316] hover:underline">View official xAI voice examples →</a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#262626] py-4 text-center text-[10px] text-[#52525b] tracking-widest">
        grok-lab / roast-voice — maximum truth-seeking, zero corporate filter
      </div>
    </div>
  );
}
