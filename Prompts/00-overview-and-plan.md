# Uber Wrapped — Master Plan & Build Overview

> Read this file first. It is the shared context for every phase prompt. Each phase has its own dedicated `.md` file in this `Prompts/` folder. Run them **one at a time, in order**, stopping at each checkpoint.

## What we're building
**Uber Wrapped** — a Spotify-Wrapped-style web app. The user drags in their Uber data export (`.zip`), and the app parses it **entirely in the browser** and renders a cinematic, scene-by-scene "Wrapped" experience plus a final dashboard: total spent, total rides, distance, most expensive trip, top city, time-of-day patterns, and playful **roasts / fun facts** (e.g. *"You spent enough on Uber to buy a 2018 Subaru Outback"* or *"That's 4 round-trip flights to Tokyo"*).

The vibe: **Uber's black aesthetic meets Apple/Stripe production quality meets Spotify Wrapped fun.** Premium, tactile, screenshot-worthy, a little cheeky.

## Tech stack (decided — do not substitute without flagging)
- **Frontend:** React + TypeScript + **Vite**.
- **Styling:** **Tailwind CSS** + CSS variables for the design tokens.
- **Animation:** **Framer Motion** (scene transitions, count-ups, parallax, reveals).
- **Charts:** lightweight + themable — **Recharts** (or visx if more control is needed). Charts must be restyled to match the theme, never default-looking.
- **Zip/CSV:** **JSZip** + **PapaParse**, both client-side.
- **Backend (Railway):** minimal **Node + Express** in `Code/server/`. Sole job: hold `GEMINI_KEY` and turn anonymized aggregate stats into AI roast text via Gemini. No raw data ever reaches it.

## Repo & infra (already set up)
- **GitHub:** https://github.com/skylerluk/uber-wrapped.git
- **Railway backend:** `uber-wrapped.up.railway.app` — env var `GEMINI_KEY` already set in Railway.
- **All application code lives in a top-level `Code/` folder** in the repo. This `Prompts/` folder holds the build prompts and must never be modified or deleted by any phase.

## Architecture rules (non-negotiable)
1. **Frontend does ALL data processing.** Unzip, parse, compute every number, render every chart — in the browser. Raw ride data and addresses NEVER leave the client.
2. **Backend is a secret-keeper only.** It receives only anonymized aggregates (totals, counts, top-city name, comparison tiers) and returns witty narrative text. It must never receive or log raw trips.
3. **Deterministic vs. AI:** All numbers and the core roast comparisons are computed deterministically on the frontend. Gemini only adds extra *flavor* text, and the app must be fully functional and beautiful with the backend turned off.
4. **Schema resilience:** Uber's CSV headers have drifted across years. Detect columns with fuzzy matching; never hardcode exact header strings. Show a clear, friendly error if fare data can't be found — never a blank crash.

## The Uber data export
Downloaded from Uber's Privacy Center. Inside the zip is a `Rider/` folder with `trips_data.csv`. Likely columns (treat as hints, fuzzy-match):
`City, Product Type, Trip or Order Status, Request Time, Begin Trip Time, Begin Trip Lat, Begin Trip Lng, Begin Trip Address, Dropoff Time, Dropoff Lat, Dropoff Lng, Dropoff Address, Distance (miles), Fare Amount, Fare Currency`
- Only count rows with a completed/fulfilled status. Exclude canceled/unfulfilled from spend & counts (but you may surface "X canceled rides" as its own fun stat).

## Design system (summary — full spec lives in Phase 6)
- **Theme:** true black like Uber. Base `#000000`, raised surfaces `#0B0B0C`–`#141416`, hairline borders `rgba(255,255,255,0.08)`. Primary text near-white `#F5F5F5`, secondary `#9A9A9E`.
- **Accent:** keep the chrome monochrome (black/white/grey) and let each Wrapped *scene* carry one bold duotone gradient (Spotify-Wrapped style — a different vivid gradient per scene), so the brand stays Uber-black but the experience feels alive.
- **Type:** a premium geometric/grotesque sans (Inter or Geist), huge display weights for hero numbers, tight tracking. Tabular figures for stats.
- **Motion:** number count-ups, staggered reveals, scene-to-scene transitions, subtle parallax and grain. 60fps, respect `prefers-reduced-motion`.
- **Custom components** (built LAST, in Phase 6): animated count-up stat, scene container with progress dots, gradient "roast card", shareable summary card, the drag-and-drop zone, themed charts.

## Phase map
- **Phase 0 — Scaffold:** wipe old code, set up `Code/` (React/Vite/Tailwind/Framer + Express backend). → `phase-0-scaffold.md`
- **Phase 1 — Parse & prove:** in-browser zip → CSV → typed trips → console-verified stats. → `phase-1-parse.md`
- **Phase 2 — Insights engine:** deterministic stats + the roast/fun-fact comparison engine. → `phase-2-insights-engine.md`
- **Phase 3 — Dashboard & Wrapped flow:** functional scene-by-scene experience + dashboard + charts (unstyled-but-correct, basic theming). → `phase-3-dashboard.md`
- **Phase 4 — Gemini backend:** Railway Express endpoint for AI roasts, privacy-safe, graceful fallback. → `phase-4-gemini-backend.md`
- **Phase 5 — How-to & deploy:** "How to download your Uber data" guide, all UI states, ship to Railway. → `phase-5-howto-deploy.md`
- **Phase 6 — Premium design pass:** the Apple/Stripe/Uber polish — custom components, motion, grain, share card, final design QA. → `phase-6-premium-design.md`

> Build correctness first (Phases 1–5), then make it gorgeous (Phase 6). Don't gold-plate components before the data and flow are proven.
