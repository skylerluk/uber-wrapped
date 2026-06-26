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

- `frontend/` — Vite + React + TypeScript app (Tailwind, Framer Motion, Recharts).
- `server/` — minimal Express backend (Node + TypeScript via `tsx`).

## Run locally

### Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

### Backend

```bash
cd server
npm install
cp .env.example .env   # add GEMINI_KEY for Phase 4+
npm run dev            # http://localhost:8080
# health check:
curl http://localhost:8080/api/health   # -> {"ok":true}
```
