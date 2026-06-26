# Phase 6 — Premium Design Pass

> **Read `00-overview-and-plan.md` first.** Phase 6 of 7 — the final phase, and the most important for how this *feels*. Everything works by now (Phases 0–5). This phase makes Uber Wrapped look and feel like it shipped from **Apple, Stripe, and Uber's design teams** — premium, tactile, cinematic, and fun. **Do not break functionality or the client-side-only data rule.** Stop at the checkpoint.

## North star
Black like Uber. Precise like Stripe. Delightful like Apple. Fun like Spotify Wrapped. Every screen should feel intentional, every transition earned, every number satisfying to watch. This is a thing people screenshot and send to friends — design for that moment.

## 1. Design system — formalize the tokens
Lock a real design system in `src/styles/` (tokens consumed by Tailwind + CSS vars):
- **Color:** true black `#000000` base; layered surfaces `#0B0B0C` / `#141416` / `#1C1C1F`; hairline borders `rgba(255,255,255,0.08–0.12)`; text `#F5F5F5` / dim `#9A9A9E` / faint `#5A5A60`. Monochrome chrome.
- **Scene gradients:** a curated set of 6–8 bold duotone gradients (Spotify-Wrapped energy) used one-per-scene over black — e.g. electric lime→teal, magenta→violet, amber→red, ice-blue→indigo. Define as tokens; keep them vivid but tasteful, with subtle noise/grain over them so they never look flat.
- **Type scale:** premium grotesque/geometric sans (Inter Tight / Geist / similar). A true display scale for hero numbers (clamp-based, responsive, e.g. up to ~12–18vw), tight tracking, tabular figures for all stats. Establish a clean modular scale and consistent line-heights.
- **Spacing & radius:** an 8pt spacing scale; consistent radii (cards ~20–28px, pills full). Generous whitespace — let big numbers breathe.
- **Elevation:** soft, low-contrast shadows + inner highlights (1px top hairline) for that "lit glass" depth, not heavy drop shadows.

## 2. Signature motion (Framer Motion)
Make motion a feature, not decoration. Respect `prefers-reduced-motion` everywhere (graceful cross-fades).
- **Number count-ups:** spring-eased, with subtle blur-in and a tasteful odometer/roll feel for the big spend & ride totals.
- **Scene transitions:** cinematic enter/exit — layered parallax, gradient cross-dissolve, content that staggers in (headline → number → caption). Stories-style auto-advance option with a timed progress bar plus manual tap/scroll/keys.
- **Micro-interactions:** magnetic/hover-lift on cards and buttons, pressed states, a satisfying drag-over animation on the drop zone (border glow, scale, gradient sweep).
- **Ambient detail:** very subtle animated grain/noise overlay and a slow gradient drift on hero/roast scenes. Keep it 60fps; lazy-mount heavy scenes.

## 3. Custom components (build these now — last, on purpose)
Replace any plain elements from earlier phases with bespoke, reusable components in `src/components/`:
- `<CountUpStat />` — animated big number with label, currency/unit formatting, tabular figures.
- `<Scene />` — full-screen gradient scene shell with progress dots, nav, and reduced-motion fallback.
- `<RoastCard />` — the hero gradient card for "you could've bought a Subaru Outback" lines; bold, screenshot-ready, with the comparison's icon/illustration.
- `<DropZone />` — premium drag-and-drop with idle/hover/drag/parsing micro-states.
- `<StatCard />` — raised black card with hairline border, optional sparkline.
- Themed chart wrappers around Recharts: custom dark axes, gradient fills, animated draw-on, custom tooltips — nothing should look like default Recharts.
- `<ShareCard />` — see §4.
- A tasteful loading/parsing animation (e.g. an Uber-ish moving-route or pulsing dot motif), not a generic spinner.

## 4. Shareability (the growth moment)
- A **"Share your Wrapped"** action that generates a polished, vertical summary card (think Spotify Wrapped share image): top stats + hero roast on a branded gradient.
- Implement via `html-to-image`/canvas to produce a downloadable PNG (still 100% client-side). Include a "Copy image"/"Download" and, if easy, Web Share API on mobile.
- Make sure the share card looks incredible at story/phone aspect ratio.

## 5. Landing & how-to polish
- Elevate the landing hero: confident headline, refined drop zone, the how-to guide redesigned as an elegant collapsible with crisp iconography for each step.
- Add a small, classy footer with the privacy promise ("Processed entirely in your browser. Nothing uploaded.") and a GitHub link.

## 6. Final design QA
- **Pixel & rhythm pass:** consistent spacing, alignment, optical centering of big numbers, no orphaned elements.
- **Responsive pass:** flawless on iPhone-width, tablet, and desktop; story scenes perfect vertically.
- **Performance:** Lighthouse check; lazy-load charts/scenes; keep bundle reasonable; 60fps animations.
- **A11y:** focus order, keyboard nav, contrast on gradient scenes (add scrims behind text where needed), reduced-motion verified.
- **Cross-browser:** Chrome, Safari, mobile Safari.
- Take before/after screenshots of each scene and the dashboard and review against the Apple/Stripe/Uber north star; iterate on anything that looks "templated."

## Checkpoint (final report)
- The app looks and feels premium end-to-end: black Uber theme, bold per-scene gradients, cinematic motion, custom components, satisfying count-ups, and a beautiful shareable card.
- Nothing from Phases 1–5 regressed; data still never leaves the browser; backend fallback still clean.
- Deployed build on `uber-wrapped.up.railway.app` reflects the polished design on desktop and mobile.
- Provide a short list of any follow-up polish ideas that were out of scope.
