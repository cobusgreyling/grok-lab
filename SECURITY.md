# Security Policy

## Supported Versions

This is a lab / experiments repository. Only the latest commit on `main` is supported.

## Reporting a Vulnerability

If you discover a security issue (especially anything involving API key handling, the realtime WebSocket client, or accidental credential leakage), please report it privately:

- Open a **private security advisory** via the GitHub repo (Security tab → Report a vulnerability), **or**
- DM @cobusgreyling on X with details.

Please **do not** open a public issue for security matters.

## API Keys & Client-Side Usage (Important)

These apps are intentionally designed for **easy local demos and forking**:

- API keys are stored in `localStorage` and sent directly from the browser in many flows (chat completions, realtime WS via query param).
- This is **by design for zero-config demos**.
- **Never** commit real keys.
- For any public deployment (Vercel, etc.):
  - Prefer setting `XAI_API_KEY` as a server environment variable.
  - Use the existing `/api/chat` (and `/api/realtime-token`) proxy routes.
  - For realtime in production, implement ephemeral token minting (see `docs/REALTIME-INTEGRATION.md` and the placeholder in `voice-lab/app/api/realtime-token`).

The code already degrades gracefully: if no server key is present, it tells the client to use the user-provided key.

## Realtime WebSocket Notes

- The browser client (`lib/xai-realtime.ts`) currently authenticates by appending `?api_key=...` for pure-client demos.
- This is acceptable for personal / localhost use.
- For hosted demos, mint short-lived tokens server-side and use the subprotocol mechanism (`xai-client-secret.<token>`). See xAI docs and the LiveKit path.

## Other

- The repo contains no backend services with persistent data or user accounts.
- Screenshots and exported clips in `docs/` and the apps are synthetic or user-generated in demo mode.
- Dependencies are kept reasonably up-to-date via Dependabot (per-app).

Thank you for helping keep grok-lab (and demos built on it) safe.
