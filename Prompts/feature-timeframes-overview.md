# Feature: Timeframe Selection & All-Time Wrapped — Overview

> **Read `00-overview-and-plan.md` first.** This is an additive feature built **on top of the finished base app (Phases 0–6).** It introduces year selection and a flagship **All-Time Wrapped** experience. Like the phases, run the parts in order, one at a time, stopping at each checkpoint. The four part-prompts live in this folder: `feature-timeframes-1-data.md`, `-2-picker.md`, `-3-alltime.md`, `-4-design.md`.

## What we're adding
Right now the app parses a zip and shows one Wrapped over all completed trips. Users often have **multiple years** of history in a single export. We're adding a **timeframe layer**:

- After parsing, the user lands on a **"Pick your Wrapped"** screen.
- They can choose **All Time** (the default and the star of the show) or any individual year present in their data (e.g. 2026, 2025, 2024…).
- Each timeframe drives its own Wrapped story + dashboard.
- **All-Time is the headline experience** — bigger numbers, bigger roasts, and a longitudinal "your whole Uber story" narrative (year-over-year evolution, your peak year, lifetime milestones). It should feel like the grand finale, not just "the sum of the years."

## Design ethos (carry it forward)
The existing single-year Wrapped is great — keep that exact ethos (black Uber base, bold per-scene gradients, cinematic Framer Motion, count-ups, screenshot-ready). The new surfaces must feel like they shipped with the original, not bolted on. All-Time earns **extra** gravity and a distinct **timeline/journey** motif because it spans the user's entire history.

## Why "All Time" is the default
A single recent year may be thin (few rides). All-Time is almost always the most interesting: the largest totals, the most dramatic roasts (cumulative spend buys bigger things), and a real narrative arc across years. So All-Time is pre-selected; year options are there for people who want to relive a specific chapter.

## Architecture principles (unchanged + extended)
- **Still 100% client-side.** All timeframe filtering and per-year math happens in the browser. Raw data never leaves it.
- **One parse, many timeframes.** Parse the zip once into trips held in memory, then derive insights per timeframe on demand. Switching timeframe must NOT require re-uploading.
- **Deterministic first.** All per-year and all-time stats + roasts are computed deterministically. Gemini (Phase 4 backend) only adds flavor and must become timeframe-aware (so it can write all-time-specific roasts), still receiving only anonymized aggregates.
- **Graceful with sparse data.** A year with 3 rides should still produce a coherent (smaller) Wrapped; roasts scale down instead of showing absurd fractions.

## Part map
1. **Part 1 — Timeframe data & insights** (`feature-timeframes-1-data.md`): refactor the insights engine to be timeframe-aware; detect available years; compute per-year and all-time stats; add year-over-year deltas, peak year, lifetime milestones; make the AI aggregate payload timeframe-aware. Logic + tests only.
2. **Part 2 — Picker screen & navigation** (`feature-timeframes-2-picker.md`): the "Pick your Wrapped" screen, new app states, default to All-Time, and the ability to switch timeframes without re-parsing.
3. **Part 3 — All-Time experience** (`feature-timeframes-3-alltime.md`): the flagship scenes and the all-time-specific facts/roasts (functional, themed) — the longitudinal story, timeline motif, lifetime superlatives.
4. **Part 4 — Design & motion polish** (`feature-timeframes-4-design.md`): premium pass on the picker and All-Time scenes — the finale feel, the animated year timeline, share card for All-Time. Build correct (Parts 1–3) first, then make it gorgeous.

> Order matters: prove the data (Part 1) before screens (Part 2/3), and polish (Part 4) last — same discipline as the base phases.
