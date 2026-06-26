# Feature Part 4 — Design & Motion Polish (Picker + All-Time Finale)

> **Read `feature-timeframes-overview.md` and `phase-6-premium-design.md` first.** Part 4 of 4 — the final, design-critical pass for the new surfaces. Everything works by now (Parts 1–3). Make the picker and the All-Time experience feel like the **flagship** — the most premium, cinematic, screenshot-worthy part of the whole app. Do not break functionality or the client-side-only rule. Stop at the checkpoint.

## North star
Reuse the Phase 6 design system exactly (black Uber base, bold gradients, premium type, count-ups, grain). The All-Time experience should feel like the **finale** of the product — a notch grander than a single year, with a signature **timeline/journey** visual identity. The picker should feel like opening a beautifully designed menu, with All-Time as the irresistible default.

## 1. The picker screen — make the choice delightful
- **All-Time hero card:** the centerpiece. Large, with a signature multi-stop gradient that subtly drifts/animates, soft inner-light depth, a refined "Recommended" pill, and teaser stats with tabular count-ups on mount. Magnetic hover/press. It should clearly be the move.
- **Year cards:** elegant, smaller, newest-first; on hover, a subtle gradient sweep + lift and the teaser stat ticks up. Consistent radii/spacing from the design system.
- **Entrance:** cards stagger in; the All-Time card lands last and "settles" with a touch more weight.
- **Selection transition:** selecting a timeframe performs a cinematic hand-off into the story (e.g. the chosen card's gradient expands to fill the first scene) — make the transition feel earned, not a hard cut.
- Mobile: hero card full-width on top, year cards in a tidy 2-up/scrollable grid; thumb-friendly.

## 2. All-Time signature motif — the journey/timeline
- Give All-Time a distinct **timeline identity** that threads the scenes: a glowing year ribbon / progress-through-time element, or a gradient that evolves as the user moves through their years (early years cooler → recent years hotter, or similar). Keep it tasteful and on-brand.
- **The spend-by-year scene** is the hero animation: bars/line **draw on** sequentially with spring easing, year labels counting up, the peak year igniting (extra glow/scale) when reached. This should be the single most satisfying moment in the app.
- **Grand-total scene:** the lifetime-spend count-up gets the most dramatic treatment — slow build, blur-in, odometer roll, a beat of silence before the roast.

## 3. Elevate motion across all-time scenes
- Layered parallax and gradient cross-dissolves between scenes; staggered headline → number → caption reveals; ambient grain + slow gradient drift, especially on the opening and grand-total scenes.
- Pacing: All-Time opens slower and more cinematic (it's a story); superlatives section is rapid-fire for contrast. Design the rhythm deliberately.
- 60fps; lazy-mount heavy scenes; full `prefers-reduced-motion` fallbacks (cross-fades, no parallax).

## 4. All-Time share card (the growth moment)
- A dedicated **"Share your Uber story"** card distinct from the single-year share card: vertical, branded, featuring lifetime spend, years active, peak year, and the hero roast on a signature gradient — designed to look incredible on a phone screen and instantly recognizable as "Uber Wrapped: All Time."
- Generated client-side (canvas/html-to-image) → download/copy + Web Share API on mobile.

## 5. Custom components (extend Phase 6's set)
- `<AllTimeHeroCard />` (picker), `<YearCard />` (picker), `<YearTimeline />` (the animated spend-by-year hero), `<MilestoneCallout />`, `<AllTimeShareCard />`. Reusable, consuming existing tokens.
- Themed chart treatment for the year timeline — custom axes, gradient fills, draw-on animation, custom tooltips; nothing default-looking.

## 6. Final design QA (new surfaces)
- Pixel/rhythm pass on picker + every all-time scene; optical centering of the big numbers; consistent spacing.
- Responsive: flawless on iPhone-width (primary share surface), tablet, desktop; all-time scenes perfect vertically.
- Contrast/legibility on gradient scenes (scrims behind text as needed); a11y focus order + keyboard nav for picker and scenes.
- Performance: Lighthouse check; lazy-load the timeline chart and heavy scenes; verify 60fps and reduced-motion.
- Cross-browser: Chrome, Safari, mobile Safari.
- Capture before/after screenshots of the picker and key all-time scenes; review against the "this is the flagship" bar and iterate on anything that looks templated.

## Checkpoint (final report)
- The picker feels premium and makes All-Time the obvious, delightful default; selection transitions are cinematic.
- The All-Time experience is the most impressive part of the app: signature timeline motif, the spend-by-year hero animation, dramatic grand-total, big roasts, and a gorgeous shareable "Uber story" card.
- Nothing from earlier phases/parts regressed; data still never leaves the browser; backend fallback still clean; deployed build on `uber-wrapped.up.railway.app` reflects it on desktop + mobile.
- Provide a short list of any out-of-scope polish ideas for later.
