# Uber Wrapped

A Spotify-Wrapped-style web app for your Uber data export. Drag in your Uber
`.zip` and the app renders a cinematic, scene-by-scene "Wrapped" experience plus
a dashboard of your year in rides — total spent, distance, top city, time-of-day
patterns, and playful roasts.

## Architecture

**The frontend does all data processing.** Unzipping, CSV parsing, and every
computed stat and chart happen entirely in the browser — your raw ride data and
addresses never leave your device. **The backend is a secret-keeper only:** it
holds the Gemini API key and accepts nothing but anonymized aggregate numbers
(totals, counts, top-city name, comparison tiers), returning witty narrative
text. The app is fully functional and beautiful with the backend turned off.

## Project layout

The **frontend lives at the repo root** (so Vercel deploys it with no Root
Directory config), and the **backend lives in `server/`** (built by the root
`Dockerfile`, so Railway also needs no Root Directory config).

- `src/`, `index.html`, `vite.config.ts`, … — Vite + React + TypeScript app
  (Tailwind, Framer Motion, Recharts).
- `server/` — minimal Express backend (Node + TypeScript via `tsx`).
- `Dockerfile` — builds & runs the server image for Railway.

## Run locally

### Frontend (repo root)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm test         # Vitest
```

### Backend

```bash
cd server
npm install
cp .env.example .env   # add GEMINI_KEY (optional; app falls back without it)
npm run dev            # http://localhost:8080
# health check:
curl http://localhost:8080/api/health   # -> {"ok":true}
```

To point the frontend at a local backend during dev, create `.env.local` at the
repo root:

```
VITE_API_BASE=http://localhost:8080
```

## Deployment (split hosting, zero Root Directory config)

The frontend and backend deploy independently from the same repo root.

### Frontend → Vercel

- **Root Directory:** _(leave blank)_ — Vercel auto-detects Vite at the repo root.
- Build: `npm run build`, output `dist/` (defaults — no config needed).
- **Env var:** `VITE_API_BASE` — optional. Defaults to
  `https://uber-wrapped.up.railway.app`. Set it to your Railway URL if different.

### Backend → Railway

- **Root Directory:** _(leave blank)_ — Railway auto-detects the root `Dockerfile`
  and builds the server image (the Dockerfile copies only `server/`).
- Build/run config: [`railway.json`](railway.json) (Dockerfile builder,
  healthcheck `/api/health`). `tsx` is a runtime dependency so the production
  image (`npm ci --omit=dev`) can run `npm start`.
- **Env vars (set in Railway):**
  - `GEMINI_KEY` — Gemini API key (required for AI roasts; app falls back without it).
  - `GEMINI_MODEL` — optional, defaults to `gemini-2.0-flash`.
  - `ALLOWED_ORIGIN` — optional extra CORS origins (comma-separated). This
    project's `*.vercel.app` domains and `localhost` are always allowed.
- Railway provides `PORT`; the server binds it automatically.

Both services redeploy automatically on push to `main`.

### Verify a deploy

```bash
curl https://uber-wrapped.up.railway.app/api/health      # -> {"ok":true}
# AI roast endpoint (anonymized aggregates only):
curl -X POST https://uber-wrapped.up.railway.app/api/insights \
  -H 'Content-Type: application/json' \
  -d '{"totalSpend":5895,"currency":"USD","totalRides":146,"totalDistanceMiles":1703,"dateRangeLabel":"2023","topCity":"San Francisco","distinctCityCount":5,"avgFare":40,"mostExpensiveFare":145,"canceledRides":14,"lateNightRides":31,"busiestDayOfWeek":"Sunday","favoriteTimeOfDay":"Morning","comparisons":[]}'
# -> {"roasts":[...],"status":"ok"}  (or {"roasts":[],"status":"fallback"} if no key)
```
