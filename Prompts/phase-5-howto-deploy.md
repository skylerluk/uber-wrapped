# Phase 5 — How-To Guide & Deploy

> **Read `00-overview-and-plan.md` first.** Phase 5 of 7. Finish the real-world edges: the "How to download your Uber data" guide, every UI state, and a working deployment on Railway. Stop at the checkpoint.

## Goal
Anyone landing cold can figure out how to get their data, use the app, and you can hand them a live URL. Functionally complete and deployed — the final beauty pass is Phase 6.

## Tasks

### 1. "How to download your Uber data" guide (on the landing screen)
- A clear, friendly step-by-step, visually distinct but not overwhelming. Exact steps:
  1. Open your **Uber account**.
  2. Go to **Privacy Center**.
  3. Tap **See Summary** (or "Download your data").
  4. **View my trips**.
  5. Open the **top-right burger menu**.
  6. **Download**.
- Note that Uber emails the export as a `.zip` and it can take a little while to arrive (sometimes up to ~24–48h). Tell the user to drop the whole zip in — no need to unzip.
- Make it collapsible/expandable so it doesn't dominate the hero, but is obvious for first-timers. Link out to Uber's privacy center if helpful.

### 2. Complete every UI state
- **Idle/landing:** hero + drop zone + how-to.
- **Parsing:** clean loading state with a tasteful message ("Crunching your rides…").
- **Error states (all friendly, all recoverable):** not a zip; zip with no trips CSV; CSV present but no fare column; zero completed trips; unexpected parse error. Each gives a plain explanation + "try another file."
- **Empty-ish data:** very few rides — still works, roasts scale down gracefully.
- **Success:** story → dashboard.
- A persistent, low-key "Your data never leaves your browser" trust note.

### 3. Build & deploy to Railway
- Decide and implement hosting:
  - **Preferred:** the Express server in `Code/server/` also serves the built frontend (`Code/frontend/dist`) as static files, so one Railway service hosts everything at `uber-wrapped.up.railway.app`. Add a build step that builds the frontend and copies/points to its `dist`.
  - Configure the frontend's `VITE_API_BASE` so the client calls the same origin in production.
- Add the Railway config needed (e.g. `railway.json`/Nixpacks or a `Dockerfile`, plus correct `start` script and `PORT` binding).
- Document exact deploy steps in `Code/README.md` (build commands, env vars, how Railway runs it).
- Confirm `GEMINI_KEY` is read from Railway env in production (already set).

### 4. End-to-end verification on the live URL
- Load the deployed site, drop a **real** Uber zip, and confirm the entire flow works in production, including AI roasts (with fallback intact).
- Test on a phone (mobile is the primary share surface).

### 5. Commit & push
- Push everything; confirm Railway redeploys cleanly from the pushed commit.

## Checkpoint (stop here and report)
- Live at `uber-wrapped.up.railway.app`: real zip in → full Wrapped + dashboard out, on desktop and mobile.
- How-to guide is clear and accurate.
- Every error/edge state is handled gracefully and recoverably.
- Deploy steps documented in the README.

Do not start Phase 6 until I confirm the deployed app works end-to-end.
