# Phase 0 — Wipe & Scaffold

> **Read `00-overview-and-plan.md` first.** This is Phase 0 of 7. Scaffold only — build NO product features. Stop at the checkpoint and wait for confirmation before Phase 1.

## Context
You are working inside the `uber-wrapped` repo (https://github.com/skylerluk/uber-wrapped.git).
- **All application code goes in a top-level `Code/` folder.**
- The `Prompts/` folder holds the build prompts — **never modify or delete it.**
- Railway backend already exists at `uber-wrapped.up.railway.app` with env var `GEMINI_KEY` set.

## Goal of this phase
A clean repo with a modern React frontend and a minimal Express backend that both boot, both lint, and are committed. No Uber logic yet.

## Tasks

### 1. Wipe old code
- Delete everything in the repo **except** `.git/` and the `Prompts/` folder. I built an earlier version I dislike — remove it entirely so we start fresh.
- Confirm `Prompts/` is untouched after the wipe.

### 2. Create the structure
```
uber-wrapped/
  Prompts/                 # leave alone
  Code/
    frontend/              # Vite + React + TS app
    server/                # Express backend
    README.md
    .gitignore
```

### 3. Frontend scaffold (`Code/frontend/`)
- Vite + **React + TypeScript** (`npm create vite@latest . -- --template react-ts`).
- Install and configure:
  - **Tailwind CSS** (with PostCSS/autoprefixer), configured for `src/**/*.{ts,tsx}`.
  - **Framer Motion**.
  - **Recharts**.
  - **JSZip** and **PapaParse** (+ `@types/papaparse`).
- Set up the **design-token foundation** now so later phases just consume it:
  - In `src/index.css`, define CSS variables on `:root` for the black theme: `--bg:#000000; --surface:#0B0B0C; --surface-2:#141416; --border:rgba(255,255,255,0.08); --text:#F5F5F5; --text-dim:#9A9A9E;` plus placeholder scene-gradient variables.
  - Set global black background, near-white text, and import a premium sans (Inter via `@fontsource/inter`, or Geist). Enable `font-feature-settings` for tabular numbers on a utility class.
  - Map these to Tailwind via `theme.extend.colors` so classes like `bg-surface`, `text-dim`, `border-hairline` work.
- Replace the Vite boilerplate `App.tsx` with a minimal centered placeholder: pure black screen, the word "Uber Wrapped" in the display font, and a small "scaffold ready" caption. No features.
- Folder skeleton (empty/placeholder files with TODO comments) to signal the intended architecture:
  ```
  src/
    components/      # UI components (built in Phase 6)
    scenes/          # Wrapped story scenes (Phase 3)
    lib/
      parse/         # zip + csv parsing (Phase 1)
      insights/      # stats + roast engine (Phase 2)
      api/           # backend client (Phase 4)
    types/           # shared TS types
    App.tsx
    main.tsx
    index.css
  ```
- Ensure `npm run dev` works and `npm run build` passes with no type errors.

### 4. Backend scaffold (`Code/server/`)
- Node + **Express** + TypeScript (or plain JS if simpler to deploy — but prefer TS with `tsx`/`ts-node`).
- One placeholder route: `GET /api/health` → `{ ok: true }`.
- Read config from `process.env` only. Add `dotenv` for local dev.
- CORS enabled (will be locked to the frontend origin in Phase 4).
- `package.json` scripts: `dev` (hot reload) and `start` (production, what Railway runs).
- Listen on `process.env.PORT || 8080` (Railway provides `PORT`).

### 5. Config & docs
- `Code/.gitignore`: ignore `node_modules`, `dist`, `.env`, `.DS_Store`, build artifacts (both frontend and server).
- `Code/server/.env.example`:
  ```
  # Gemini API key (set in Railway, never commit the real one)
  GEMINI_KEY=
  PORT=8080
  ```
- `Code/README.md`: project name, the **client-side-processing / backend-is-secret-keeper** architecture in 3–4 sentences, and exact local-run instructions for both frontend and backend.

### 6. Commit
- One clean commit: `chore: reset repo, scaffold uber-wrapped (react/vite/tailwind + express)`.

## Checkpoint (stop here and report)
- Repo contains only `Prompts/` + `Code/` (and `.git/`); old code is gone.
- `cd Code/frontend && npm run dev` serves a black "Uber Wrapped" placeholder; `npm run build` passes with no TS errors.
- `cd Code/server && npm run dev` boots; `GET /api/health` returns `{ ok: true }`.
- Design tokens (black theme variables + premium font) are wired and visible on the placeholder.

Do **not** start Phase 1 (zip parsing) until I confirm this checkpoint.
