# Phase 4 — Gemini Backend (AI Roasts)

> **Read `00-overview-and-plan.md` first.** Phase 4 of 7. Build the tiny Railway backend whose ONLY job is to turn anonymized aggregates into extra witty roast text via Gemini, keeping `GEMINI_KEY` secret. The app must stay fully functional with the backend off. Stop at the checkpoint.

## Non-negotiable privacy rule
The backend receives **only** the anonymized aggregate payload from `toAggregatePayload()` (Phase 2): totals, counts, currency, top-city *name*, time patterns, and the deterministic comparison tiers. It must **never** receive or log raw trips, addresses, or coordinates. Validate the payload shape on arrival and reject anything containing address/coordinate-like fields.

## Backend tasks (`Code/server/`)

### 1. Endpoint
- `POST /api/insights`
  - Body: the aggregate payload (validate with a schema, e.g. zod).
  - Reads `GEMINI_KEY` from `process.env`.
  - Calls the Gemini API (use the official `@google/generative-ai` SDK or REST; a fast model like `gemini-1.5-flash` is ideal for short, cheap, witty text).
  - Returns `{ roasts: [{ headline, sub }], status: "ok" }` — 3–5 short, punchy, original roast lines in the Uber-Wrapped voice.

### 2. Prompt design (server-side)
- System instruction: "You are the voice of 'Uber Wrapped.' Given anonymized stats about someone's Uber spending, write short, witty, screenshot-worthy roasts. Playful and clever, never cruel, never about financial hardship. Tease the habit, not the person. No emojis unless they really land. Each line ≤ 120 chars."
- Feed the aggregates as compact JSON. Ask for strict JSON output (array of `{headline, sub}`); parse defensively and fall back if the model returns prose.
- Encourage variety vs. the deterministic roasts the frontend already shows (pass those in as "already used, do something different").

### 3. Hardening
- **CORS:** allow only the production frontend origin (and `localhost` in dev).
- **Rate limiting:** basic per-IP limit to protect the key/quota.
- **Timeout + graceful failure:** if Gemini errors or times out (~6s), return `{ roasts: [], status: "fallback" }` with a 200 so the frontend cleanly falls back.
- **No logging of payload contents** beyond coarse metrics (counts, latency). Never log the API key.
- Keep the existing `GET /api/health`.

### 4. Config
- Update `Code/server/.env.example` if new vars are added (e.g. `ALLOWED_ORIGIN`).
- Ensure `npm start` is the Railway production command and the server binds `process.env.PORT`.

## Frontend tasks (`Code/frontend/src/lib/api/insights.ts`)
- Implement the client that POSTs `toAggregatePayload(insights)` to `${VITE_API_BASE}/api/insights` (configurable; default to the Railway URL `https://uber-wrapped.up.railway.app`).
- Merge returned AI roasts into the roast wall / story, clearly the same visual treatment as deterministic ones (user shouldn't need to know which is which).
- **Graceful degradation:** on any failure, timeout, or `status:"fallback"`, silently use only the deterministic roasts. The experience must never show an error or empty state because of the backend.
- Add a subtle loading affordance if AI roasts are still arriving when the user reaches the roast scene (e.g. start with deterministic ones, fold in AI ones if/when they land).

## Checkpoint (stop here and report)
- With the backend running, the roast scenes/wall include fresh AI-written lines alongside the deterministic ones.
- With the backend **stopped or failing**, the full app still works perfectly using deterministic roasts — no errors, no blank states.
- Verified that the request payload contains zero raw-trip / address / coordinate data (check the network tab).
- `GEMINI_KEY` is never exposed to the client.

Do not start Phase 5 until I confirm both the AI path and the fallback path work.
