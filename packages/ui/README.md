# @grok-lab/ui (extracted components)

Reusable, Grok-styled React components extracted from the experiments so you don't have to copy-paste UI code when forking or building new demos.

Current:
- `ApiKeyInput` — consistent key field + link to console.x.ai
- `Waveform` — animated bars used for mic/speaking visual

Usage in an app (copy the .tsx into your components/ if you want the app 100% standalone, or import from the package in a monorepo):

```tsx
import ApiKeyInput from '@grok-lab/ui/ApiKeyInput';
import Waveform from '@grok-lab/ui/Waveform';
```

These are intentionally small and dependency-free (except lucide-react which most apps already have).

See the voice-lab (has local copies in components/) and roast-voice (now wired) for examples of wiring.

To keep "one folder" forks working, we copy the component sources into each consuming app's components/ or lib/.
