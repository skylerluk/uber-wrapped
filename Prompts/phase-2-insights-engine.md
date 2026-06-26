# Phase 2 — Insights & Roast Engine

> **Read `00-overview-and-plan.md` first.** Phase 2 of 7. Pure logic, no UI. Build the deterministic engine that turns parsed trips into every stat and every roast/fun-fact the dashboard will show. Stop at the checkpoint.

## Goal
A well-tested, framework-free module that takes `completedTrips` + `allTrips` and returns a single typed `Insights` object containing all numbers AND a ranked list of witty comparison "roasts." This must be deterministic and fully functional with no backend (Gemini only adds extra flavor later in Phase 4).

## Tasks

### 1. Stats module (`src/lib/insights/computeStats.ts`)
Compute and return a typed `Stats` object:
- **Headline:** `totalSpend`, `currency`, `totalRides`, `totalDistanceMiles`, `dateRange {start, end, label}`.
- **Superlatives:** `mostExpensiveTrip` (amount, date, city, route if available), `cheapestTrip`, `longestTrip` (distance).
- **Money:** `avgFare`, `medianFare`, `totalSpendByMonth[]` (for the trend chart), `spendByYear[]`.
- **Geography:** `topCity` (most rides) + `cityBreakdown[]` (rides + spend per city, sorted), `distinctCityCount`.
- **Time patterns:** `busiestDayOfWeek`, `favoriteTimeOfDay` (bucket into Late Night / Morning / Afternoon / Evening / Night), `ridesByHour[]`, `busiestMonth`.
- **Fun extras:** `canceledRides`, `firstEverRide`, `longestGapBetweenRides`, `mostRidesInOneDay`.
- Guard every reducer against empty/`null` values. Return well-defined zeros/nulls, never `NaN`.

### 2. Roast / fun-fact engine (`src/lib/insights/roasts.ts`)
This is the personality of the app. Generate a ranked list of `Roast` objects: `{ id, headline, sub, emoji?, severity }`. All deterministic, derived from `totalSpend`, `totalRides`, `totalDistanceMiles`, etc.

Build a **comparison catalog** with approximate, clearly-labeled reference values (keep them in one editable data file `src/lib/insights/comparisons.ts` so they're easy to tweak), e.g.:
- **Big purchases (spend ÷ price):** 2018 Subaru Outback (~$18,000 used), a year of average US rent, a high-end MacBook Pro, N PS5s, N years of Netflix, an engagement ring, a used Civic.
- **Travel (spend ÷ trip cost):** "You could've flown round-trip to Tokyo N times" (~$1,200), Paris, a week in Hawaii, N nights in a nice hotel.
- **Food/coffee (spend ÷ unit):** N $6 lattes, N Chipotle burritos, N In-N-Out Double-Doubles.
- **Distance:** total miles vs. "across the US and back N times" (~2,800 mi), "X% of the way around the Earth" (24,901 mi), "to the Moon? you're N% there" for the absurd ones.
- **Time/behavior roasts:** "You took N rides at 2am — rough nights," "Your most expensive single trip cost more than some people's monthly groceries," "You ghosted N drivers (canceled rides)."

Engine rules:
- For each category, pick the **single most flattering-to-funny** comparison where the multiple lands in a satisfying range (ideally 1–12, or a punchy round number). Don't show "0.3 Subarus."
- Roasts must be **playful, never mean about money struggles** — tease the habit, not the person. Light and fun (Spotify-Wrapped energy, slight snark).
- Return ~6–10 candidate roasts ranked by `funScore` (favor surprising/round/relatable). The dashboard will feature the top few.
- Each roast carries the raw numbers so the UI can animate them.

### 3. Public API (`src/lib/insights/index.ts`)
- Export `buildInsights(allTrips, completedTrips): Insights` where `Insights = { stats: Stats, roasts: Roast[], meta }`.
- Add a `toAggregatePayload(insights)` helper that returns ONLY anonymized aggregates (no addresses, no raw trips, no coordinates) — this is exactly what Phase 4 will send to the Gemini backend. Lock the privacy boundary here.

### 4. Tests (`Vitest`)
- Unit-test `computeStats` against a hand-built fixture set with known answers (totals, most-expensive, top city, day-of-week).
- Test `roasts` for: correct multiples, never showing absurd fractions, graceful behavior at tiny spend ($20) and huge spend ($50k), and empty input.
- Test `toAggregatePayload` contains **no** address/coordinate/raw-trip fields (assert the privacy boundary).

### 5. Dev harness
- A temporary dev-only call that runs `buildInsights` on the parsed real zip from Phase 1 and `console.log`s the full `Insights` object, so we can eyeball the roasts on real data before building UI.

## Checkpoint (stop here and report)
- On a real zip, the console shows a complete `Insights` object with sensible stats and 6–10 genuinely funny, accurate roasts (Subaru / Tokyo-flights / lattes style).
- All Vitest tests pass, including the privacy-boundary test.
- No UI yet.

Do not start Phase 3 until I confirm the roasts are accurate and funny on real data.
