# Feature Part 3 — The All-Time Wrapped Experience

> **Read `feature-timeframes-overview.md` first.** Part 3 of 4. Build the **flagship** experience: the all-time scene set and its unique facts/roasts. Functional and themed (black base + gradients, count-ups, Framer Motion in the existing ethos). The premium finale polish is Part 4. Stop at the checkpoint.

## The concept: "Your Uber Story"
A single year is a chapter. **All-Time is the whole book.** Where a year answers "how was this year," All-Time answers "who are you as an Uber rider, across your entire history." Lean into the **longitudinal narrative and a timeline/journey motif** — the user should feel like they're traveling through their own years. Bigger numbers, bigger roasts, more gravity than a single year, while staying playful.

## All-Time scene set (`src/scenes/alltime/`)
Data-driven scene config, full-screen, advanced by tap/scroll/keys with progress dots — same mechanics as the year story, but a distinct, grander tone. Suggested order:

1. **Opening / "Since the beginning":** "You've been an Uber person for **{yearsActive}**." Show the span from first ride to last. Slower, cinematic open — this is a story, not a stat dump.
2. **The grand total (spend):** the biggest count-up in the app — lifetime spend. Let it breathe, then land the gut-punch.
3. **Lifetime rides & distance:** total rides + total miles, with a distance roast ("that's {n}× around the Earth").
4. **The mega-roast:** cumulative spend → a big-ticket comparison ("a used 2018 Subaru Outback… and then some," down-payment / tuition / round-the-world territory). Cycle the 2–3 best big roasts.
5. **Your timeline (hero moment):** an animated **spend-per-year** chart (`allTime.byYear`) that builds bar-by-bar / draws left-to-right — the visual centerpiece. Narrate it: years scrolling, the line climbing.
6. **Peak year:** spotlight `peakYear` — "**{year}** was your Uber era — ${spend} across {rides} rides." Optional: a quick "what changed that year" line.
7. **Evolution / year-over-year:** how you changed — biggest jump or drop ("You spent {pct}% more in {year} than {prevYear}"), shifting favorite time-of-day or cities over the years ("from a {oldCity} rider to a {newCity} one").
8. **Cities across time:** "You've Uber'd in **{n} cities** across {years} years," with the top all-time city.
9. **Lifetime superlatives:** most expensive trip *ever*, longest trip *ever*, most rides in a single day *ever*, latest-night ride *ever* — rapid-fire superlative cards.
10. **Milestones:** "You crossed **${milestone}** total in {month year}" — the moment(s) it added up.
11. **Outro / "That's your Uber story":** warm closer → CTAs: "See full all-time dashboard" + "Share your story."

Implement as a separate scene array selected when `timeframe.kind === 'all'`; the existing single-year scenes stay as-is for year selections.

## All-Time dashboard additions (`src/scenes/Dashboard.tsx`, all-time variant)
When viewing All-Time, the dashboard gains sections beyond the single-year version:
- **Spend-by-year** chart (the hero timeline, themed Recharts) + a per-year table (spend, rides, distance, avg fare).
- **Year-over-year** deltas (mini up/down indicators).
- **Peak year** card, **first ride** card, **years active** card.
- **Lifetime superlatives** + **cities-over-time**.
- The roast wall pulls the big all-time roasts.
Single-year dashboard remains as built in Phase 3.

## Facts & roasts (consume Part 1)
- All longitudinal facts come from `Insights.allTime` (peak year, YoY, milestones, cities-over-time, years active) — Part 1 already computes them.
- All-time roast catalog (bigger comparisons + the "invested at 7%" finance roast + distance-around-the-Earth) comes from Part 1's timeframe-aware roast engine.
- Pull extra AI all-time roasts from the Phase 4 backend (now timeframe-aware), merged seamlessly, with the same graceful fallback if the backend is off.

## Constraints
- Reuse the existing design tokens/components; don't fork a parallel style. All-Time should read as "the same app, turned up."
- Mobile-first and screenshot-ready — the timeline scene and the grand-total scene especially must look incredible vertically.
- Sparse all-time data (e.g. one short year) must still produce a coherent story — gracefully drop scenes that have no data (no empty "Peak year: —").
- Respect `prefers-reduced-motion`.

## Checkpoint (stop here and report)
- Selecting **All-Time** plays the full all-time story end-to-end on a real multi-year zip, with correct numbers, the animated spend-by-year timeline, peak year, YoY evolution, lifetime superlatives, and milestones.
- All-time roasts are bigger and longitudinal; AI roasts merge in with clean fallback.
- All-time dashboard shows the new sections; single-year experience is unchanged.
- Coherent on mobile + desktop; reduced-motion respected; sparse data degrades gracefully.

Do not start Part 4 (design polish) until I confirm the all-time experience is correct and compelling.
