# Feature Part 2 — "Pick Your Wrapped" Screen & Navigation

> **Read `feature-timeframes-overview.md` first.** Part 2 of 4. Add the timeframe picker screen and wire timeframe selection through the whole flow. Functional + on-brand theming; the heavy polish for this screen comes in Part 4. Stop at the checkpoint.

## Goal
After a successful parse, the user chooses a timeframe before the Wrapped story. All-Time is pre-selected and visually elevated. Switching timeframes never re-uploads the zip.

## Tasks

### 1. New app state
Extend the state machine from Phase 3:
`idle → parsing → picker → story → dashboard` (plus `error`).
- After parse success, hold the parsed trips (and the precomputed `buildAllInsights` result) in memory/context, then route to **`picker`** instead of straight to `story`.
- Store the selected `Timeframe` in app state; `story` and `dashboard` read insights for that timeframe from the precomputed map (instant switch, no recompute).

### 2. The picker screen (`src/scenes/Picker.tsx`)
Title: **"Pick your Wrapped."** Subtitle: something like "Relive a single year — or see your whole story."

Layout:
- **All-Time hero card** on top: large, premium, its own bold gradient, tagged **"Recommended"** (or "Most interesting"). Show 1–2 teaser stats (lifetime spend or total rides + years active) and a clear "See your whole story →" affordance. This is the obvious default — pre-focused/selected.
- **Year cards** below in a responsive grid, **newest year first**. Each card shows the year and one teaser stat (that year's spend or ride count) so the choice feels informed. De-emphasized relative to the All-Time card.
- If only one year exists in the data, still show All-Time as default but make the single year available; if effectively only one timeframe, you may auto-skip the picker (note this behavior).

Interactions:
- Selecting a card transitions into the `story` for that timeframe (Part 3/4 will make the transition cinematic).
- Keyboard accessible (arrow/enter), focus states, reduced-motion friendly.

### 3. Switch-timeframe navigation (no re-upload)
- From the **dashboard** and the **story outro**, add a clear, low-key control: "← Pick another Wrapped" / "Switch year" that returns to the `picker` using the already-parsed data.
- "Start over / new file" still exists and clears everything back to `idle`.
- Selecting a different timeframe re-renders story + dashboard from the precomputed insights instantly.

### 4. Sparse-data handling
- A year with very few rides is still selectable and produces a coherent (smaller) Wrapped — don't hide it, but it's fine to show a tiny "quiet year" badge.
- All-Time remains the default regardless.

### 5. Wire insights by timeframe
- Story and Dashboard components take the active `Insights` for the selected timeframe (from Part 1's precomputed map). All existing single-year scenes keep working unchanged when a specific year is selected.
- Leave a clean seam for Part 3's all-time-specific scenes (e.g. the Story component branches: if `timeframe.kind === 'all'`, render the all-time scene set; else the existing year scene set).

## Checkpoint (stop here and report)
- After dropping a multi-year zip, the picker appears with All-Time elevated/default and year cards (newest first) showing teaser stats.
- Selecting All-Time or any year shows the correct Wrapped + dashboard for that timeframe.
- Switching timeframes from the dashboard/outro works instantly with no re-upload.
- Single-year selections still match the original Phase 3 experience; theming is consistent.

Do not start Part 3 until I confirm the picker and timeframe switching work end-to-end.
