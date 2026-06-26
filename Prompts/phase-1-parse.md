# Phase 1 — Parse & Prove the Data

> **Read `00-overview-and-plan.md` first.** Phase 1 of 7. This phase de-risks the entire project. **No styling, no dashboard yet** — just prove we can reliably read a real Uber export. Stop at the checkpoint.

## Goal
Drop a real Uber `.zip` → the app unzips and parses it in-browser → produces a clean, typed array of trips → prints verified summary stats to the console. If this doesn't work on a real export, nothing else matters, so be thorough and defensive.

## Tasks

### 1. File intake (functional, minimal styling)
- A simple drag-and-drop zone + click-to-browse fallback in `App.tsx`, accepting `.zip` only.
- On drop: read the file as an ArrayBuffer. Show a plain "Parsing…" text state. (Beautiful UI comes later.)
- Handle wrong file types and corrupt zips with a clear inline message.

### 2. Unzip (`src/lib/parse/unzip.ts`)
- Use **JSZip** to open the archive in memory.
- **Search recursively** for the trips CSV — do NOT assume `Rider/trips_data.csv`. Match any file whose name contains `trips` and ends in `.csv` (case-insensitive). If multiple, prefer one under a `Rider`/`Driver` folder that looks like rider trips; log all candidates.
- If no trips CSV is found, return a structured error the UI can show: "Couldn't find a trips file in this zip."

### 3. Parse CSV (`src/lib/parse/parseTrips.ts`)
- Parse with **PapaParse** (`header: true`, `skipEmptyLines: true`, `dynamicTyping: false` — we coerce ourselves).
- Build a **schema-detection layer** (`src/lib/parse/schema.ts`):
  - Normalize headers (lowercase, strip non-alphanumerics) and map to canonical fields via a synonym table. Canonical fields + accepted synonyms:
    - `city` ← `city`
    - `productType` ← `product type`, `producttype`
    - `status` ← `trip or order status`, `status`, `trip status`
    - `requestTime` ← `request time`, `requesttime`
    - `beginTime` ← `begin trip time`, `begintriptime`, `pickup time`
    - `dropoffTime` ← `dropoff time`, `drop off time`, `end time`
    - `beginAddress` ← `begin trip address`, `pickup address`
    - `dropoffAddress` ← `dropoff address`, `drop off address`
    - `distanceMiles` ← `distance (miles)`, `distance`, `trip distance`
    - `fareAmount` ← `fare amount`, `fare`, `amount`, `total`
    - `fareCurrency` ← `fare currency`, `currency`
    - lat/lng fields ← obvious variants (keep for later map ideas; optional).
  - The mapping must tolerate missing optional columns. `fareAmount` and a usable timestamp are the only ones we truly need; if `fareAmount` is absent, surface a friendly "this export doesn't include fare data" state.

### 4. Typed model & coercion (`src/types/trip.ts`)
- Define a `Trip` type with proper types: `fareAmount: number | null`, `currency: string | null`, `city: string | null`, `beginTime: Date | null`, `distanceMiles: number | null`, `status: string`, addresses optional.
- Coerce carefully:
  - Strip currency symbols/commas from fare; parse to float; `NaN` → `null`.
  - Parse timestamps robustly (Uber uses formats like `2023-08-14 19:42:00 +0000 UTC` — strip trailing tz words, parse to `Date`; invalid → `null`).
  - Normalize `status` to lowercase for filtering.
- Produce two arrays: `allTrips` and `completedTrips` (status indicates completed/fulfilled). Document the exact status strings you observe.

### 5. Prove it — console summary (`src/lib/parse/index.ts`)
After parsing, `console.table`/`console.log` a summary object:
- detected header→canonical mapping,
- total rows, completed rows, canceled rows,
- total spend (sum of completed `fareAmount`) + detected currency,
- date range (earliest → latest `beginTime`),
- distinct cities count + top 3 by ride count,
- count of rows where `fareAmount` is null (data-quality signal).
Also stash the parsed result on `window.__uberWrapped` for manual inspection during dev.

### 6. Resilience
- Wrap parsing in try/catch; never leave the app on an infinite "Parsing…" with no feedback.
- Add 2–3 tiny synthetic CSV fixtures (different header spellings, a canceled row, a blank-fare row, a comma in fare) under `Code/frontend/src/lib/parse/__fixtures__/` and a quick dev assertion (or Vitest tests) proving the parser handles them.

## Checkpoint (stop here and report)
- Dropping a **real Uber zip** prints a correct summary to the console: total spend, currency, completed ride count, date range, top cities.
- **Confirm `Fare Amount` is being read** and summed correctly (sanity-check against a couple known trips if possible).
- Synthetic fixtures pass.
- No styling required — correctness only.

Do not start Phase 2 until I confirm the numbers look right on a real export.
