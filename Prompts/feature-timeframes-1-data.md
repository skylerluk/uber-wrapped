# Feature Part 1 — Timeframe Data & Insights

> **Read `feature-timeframes-overview.md` and `00-overview-and-plan.md` first.** Part 1 of 4. **Logic only — no UI changes.** Make the insights engine timeframe-aware and build the new all-time math. Stop at the checkpoint.

## Goal
The Phase 2 insights engine currently computes one `Insights` over all completed trips. Refactor it so any caller can request insights for a **timeframe** — `all` or a specific `year` — and add the new all-time-only metrics (per-year breakdown, peak year, year-over-year deltas, lifetime milestones). All deterministic, all tested.

## Tasks

### 1. Timeframe model (`src/lib/insights/timeframe.ts`)
- Define `type Timeframe = { kind: 'all' } | { kind: 'year'; year: number }`.
- `getAvailableYears(completedTrips): number[]` — distinct years from `beginTime`, sorted **descending** (newest first). Ignore trips with null dates.
- `filterByTimeframe(trips, timeframe)` — returns trips in that timeframe (`all` = everything).
- `defaultTimeframe(years)` → always `{ kind: 'all' }`.

### 2. Make insights timeframe-aware (`src/lib/insights/index.ts`)
- Change the public API to `buildInsights(allTrips, completedTrips, timeframe): Insights`.
- Internally filter both arrays by the timeframe, then run the existing `computeStats` + `roasts` over the filtered set.
- Add `timeframe` and a human label (`"All Time"`, `"2025"`) to the returned `Insights.meta`.
- Keep a convenience `buildAllInsights(allTrips, completedTrips)` that returns `{ years: number[], byTimeframe: Map<key, Insights> }` precomputed for all years + all-time, so the UI can switch instantly. (Memoize; don't recompute on every render.)

### 3. All-time-only metrics (`src/lib/insights/allTime.ts`)
Only computed when `timeframe.kind === 'all'` (attach under `Insights.allTime`):
- `byYear[]`: for each year → `{ year, spend, rides, distance, avgFare }`, ascending by year (for the timeline chart).
- `peakYear`: the year with the highest spend (also note peak by rides if different).
- `firstRide` / `lastRide`: dates; `yearsActive` and a friendly span label ("4 years, 7 months").
- `yoy[]`: year-over-year deltas in spend & rides (absolute + %), so we can say "spending up 38% vs 2024."
- `biggestJump` / `biggestDrop`: the most dramatic YoY change.
- `lifetimeMilestones`: e.g. the month they crossed $1k / $5k / $10k cumulative; cumulative-distance milestones (around-the-world fractions).
- `citiesOverTime`: distinct cities per year + total distinct cities all-time ("Uber'd in 11 cities across 5 years").
- `quietestYear` / `busiestYear` by rides.
- Guard everything for single-year or sparse data (return nulls/empties cleanly; never `NaN`).

### 4. Timeframe-aware roasts (`src/lib/insights/roasts.ts` + `comparisons.ts`)
- Add a `timeframe` parameter so roast selection knows the scale.
- **All-time comparison catalog** (bigger ticket, since cumulative spend is large): used car → newer car → down payment on a house, semesters of in-state tuition, months/years of rent, round-the-world flights, "invested at 7% it'd be ~$X today," distance → times around the Earth / % to the Moon.
- **All-time longitudinal roasts** (only valid for all-time): "Your Uber peak was {peakYear} — ${spend} across {rides} rides," "You've been an Uber person for {yearsActive}," "{year}-you spent {pct}% more than {prevYear}-you," "You've Uber'd in {n} cities across {years} years."
- Single-year roasts keep the existing tighter scale (lattes, burritos, one Subaru, etc.).
- Selection rule still holds: pick comparisons that land on satisfying multiples; never show "0.3 of a thing." Scale the catalog to the timeframe so single years don't reach for "a house."

### 5. AI aggregate payload becomes timeframe-aware (`toAggregatePayload`)
- Include `timeframe`/label and, for all-time, the compact `byYear[]` + `peakYear` + `yoy` summary — still **anonymized aggregates only** (no raw trips, addresses, coordinates). This lets the Phase 4 Gemini backend write all-time-aware roasts. Re-assert the privacy boundary in tests.

### 6. Tests (Vitest)
- `getAvailableYears` / `filterByTimeframe` correctness across a multi-year fixture.
- `buildInsights` returns correct numbers for a specific year vs all-time over the same fixture (totals add up across years to the all-time total).
- All-time metrics: `peakYear`, `yoy` percentages, `yearsActive`, milestone months — verified against hand-computed values.
- Roast scaling: single-year picks small comparisons, all-time picks big ones; no absurd fractions at any scale; sparse-year (3 rides) still returns a coherent set.
- Privacy: `toAggregatePayload` (all-time variant) contains no raw-trip/address/coordinate fields.

## Checkpoint (stop here and report)
- A dev harness logs, for a real multi-year zip: the available years, a per-year `Insights` summary, and the all-time `Insights` including `byYear`, `peakYear`, `yoy`, `yearsActive`, and lifetime milestones.
- Single-year totals across all years reconcile to the all-time totals.
- All-time roasts are noticeably bigger/longitudinal; single-year roasts unchanged in feel.
- All tests pass, including the privacy test. **No UI yet.**

Do not start Part 2 until I confirm the per-year and all-time numbers reconcile and the new roasts read well.
