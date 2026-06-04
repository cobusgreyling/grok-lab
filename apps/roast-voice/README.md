# roast-voice — grok-lab

Brutally honest voice roasts powered by Grok.

**The viral hook**: People love posting clips of an AI destroying their startup idea / dating profile / life choices with zero filter.

## Run

```bash
npm install
npm run dev
```

Paste an xAI key (console.x.ai) and enable the realtime toggle for Grok to *generate and speak* the roast using the realtime voice model (low-latency, expressive).

Demo mode works instantly with browser speech APIs (no key needed).

See the root [grok-lab README](../../README.md) and the **[interactive showcase](https://cobusgreyling.github.io/grok-lab/)** (GitHub Pages) for the full story, screenshots, and the other experiments.

When the "realtime voice" toggle + key are used: the roast content + delivery both come from Grok's realtime voice API. Export still works (transcript + clip). The reference full-duplex client lives in `voice-lab`.
