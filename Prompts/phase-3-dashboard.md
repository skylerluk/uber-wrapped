# Phase 3 — Dashboard & Wrapped Flow

> **Read `00-overview-and-plan.md` first.** Phase 3 of 7. Build the full **functional** experience: the scene-by-scene Wrapped story and the final dashboard, wired to the Phase 2 insights. Theme it cleanly (black base, real layout) but **save the heavy polish, custom motion, and bespoke components for Phase 6.** Stop at the checkpoint.

## Goal
A complete, navigable product: drop zip → animated-ish "Wrapped" story of scenes → final scrollable dashboard with charts and roasts. Correct, responsive, on-brand black theme, but intentionally not yet pixel-perfect.

## Experience structure

### A. Landing / intake screen
- Centered hero on black: "Uber Wrapped" wordmark, one-line subtitle, and the **drag-and-drop zone** (from Phase 1, now properly laid out).
- Placeholder slot for the "How to download your Uber data" guide (full version in Phase 5) — stub it with the step list so the layout exists:
  *Your account → Privacy Center → See Summary → View my trips → top-right burger menu → Download.*
- Reassurance line: "Your data never leaves your browser." (It's true — honor it.)

### B. The Wrapped story (`src/scenes/`)
A sequence of **full-screen scenes**, advanced by click/tap/scroll, with progress dots (Instagram-stories style). One headline stat per scene, big and bold, each scene carrying its own bold duotone gradient over the black base. Suggested scene order:
1. **Intro:** "Let's relive your year(s) in Uber." + date range.
2. **Total rides:** giant count-up number.
3. **Total spend:** giant count-up in the user's currency. Beat of silence, then…
4. **The roast:** the hero comparison ("That's a 2018 Subaru Outback 🚗" / "4 round-trips to Tokyo ✈️"). Cycle 2–3 top roasts.
5. **Top city:** where you Uber'd most, with ride count.
6. **Most expensive trip:** the single most painful fare, with date/city.
7. **Time personality:** busiest day + favorite time of day ("You're a 1am Uber person").
8. **Distance:** total miles + a distance roast ("X% around the Earth").
9. **Outro:** "That's your Uber Wrapped" → CTA button "See full dashboard" + "Share."

Implement scenes as data-driven config (array of scene definitions) so order/content is easy to change. Use **Framer Motion** for enter/exit transitions and number count-ups now, but keep them tasteful and simple — Phase 6 will elevate them.

### C. The dashboard (`src/scenes/Dashboard.tsx`)
A scrollable, card-based summary (the "full stats" view after the story):
- **Hero stat row:** total spend, total rides, total distance, date range — as stat cards with count-up.
- **Spend over time:** themed **Recharts** area/line chart (`totalSpendByMonth`). Restyle axes/grid/tooltip to the dark theme — no default Recharts look.
- **Top cities:** horizontal bar list with rides + spend.
- **Rides by hour / day:** small bar chart showing time patterns.
- **Most/least/longest trip:** superlative cards.
- **Roast wall:** a grid of the funniest comparison cards from the engine.
- All cards on raised black surfaces with hairline borders; consistent spacing scale.

### D. State & routing
- App states: `idle` (landing) → `parsing` → `story` → `dashboard`, plus `error`. Manage with a simple state machine / context; no heavy router needed (can use a single-page state switch).
- "Restart / try another zip" action that clears state and returns to landing.
- Persist nothing to disk; everything in memory (no localStorage of ride data).

### E. Responsive & accessible
- Mobile-first; the story must look great vertically on a phone (this is what people screenshot). Dashboard reflows to single column on mobile.
- Keyboard navigable scenes (arrow keys / space), focus states, `prefers-reduced-motion` fallback (cross-fade instead of motion).

## Wiring
- On successful parse → `buildInsights()` → feed both the story and dashboard from the same `Insights` object.
- Backend not built yet: roasts come entirely from the deterministic engine. Leave a clean seam (`src/lib/api/insights.ts` stub) where Phase 4 will optionally fetch extra AI roasts.

## Checkpoint (stop here and report)
- Full flow works end-to-end on a real zip: landing → story scenes → dashboard, with correct numbers and charts.
- Works and looks coherent on mobile and desktop; black theme consistent; reduced-motion respected.
- Charts are themed (not default), numbers count up, scenes advance smoothly.
- Still intentionally pre-polish — that's expected.

Do not start Phase 4 until I confirm the flow and numbers are right.
