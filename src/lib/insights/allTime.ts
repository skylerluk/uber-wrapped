// All-time longitudinal metrics, computed over ALL completed trips. Every
// reducer is guarded for single-year / sparse data and never returns NaN.

import type { Trip } from '../../types/trip';
import type { AllTimeInsights, YearSummary, YoYDelta, Milestone } from '../../types/insights';

const MILESTONE_THRESHOLDS = [1000, 5000, 10000, 25000, 50000, 100000];

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function spanLabel(first: Date, last: Date): string {
  let months = (last.getUTCFullYear() - first.getUTCFullYear()) * 12 + (last.getUTCMonth() - first.getUTCMonth());
  if (months < 0) months = 0;
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} year${y === 1 ? '' : 's'}`);
  parts.push(`${m} month${m === 1 ? '' : 's'}`);
  return parts.join(', ');
}

export function computeAllTime(completedTrips: Trip[]): AllTimeInsights {
  const empty: AllTimeInsights = {
    byYear: [],
    peakYearBySpend: null,
    peakYearByRides: null,
    firstRide: null,
    lastRide: null,
    yearsActive: 0,
    spanLabel: '',
    yoy: [],
    biggestJump: null,
    biggestDrop: null,
    spendMilestones: [],
    distinctCitiesAllTime: 0,
    citiesByYear: [],
    busiestYearByRides: null,
    quietestYearByRides: null,
  };

  const dated = completedTrips.filter((t) => t.beginTime != null);
  if (dated.length === 0) return empty;

  // Per-year aggregates
  const yearMap = new Map<number, { spend: number; rides: number; distance: number; fares: number }>();
  const yearCities = new Map<number, Set<string>>();
  const allCities = new Set<string>();
  for (const t of dated) {
    const y = t.beginTime!.getUTCFullYear();
    const agg = yearMap.get(y) ?? { spend: 0, rides: 0, distance: 0, fares: 0 };
    agg.spend += t.fareAmount ?? 0;
    agg.rides += 1;
    agg.distance += t.distanceMiles ?? 0;
    if (t.fareAmount != null) agg.fares += 1;
    yearMap.set(y, agg);
    if (t.city) {
      if (!yearCities.has(y)) yearCities.set(y, new Set());
      yearCities.get(y)!.add(t.city);
      allCities.add(t.city);
    }
  }

  const byYear: YearSummary[] = [...yearMap.entries()]
    .map(([year, a]) => ({
      year,
      spend: a.spend,
      rides: a.rides,
      distance: a.distance,
      avgFare: a.fares > 0 ? a.spend / a.fares : 0,
    }))
    .sort((a, b) => a.year - b.year);

  const peakYearBySpend = byYear.reduce<YearSummary | null>((best, y) => (!best || y.spend > best.spend ? y : best), null)?.year ?? null;
  const peakYearByRides = byYear.reduce<YearSummary | null>((best, y) => (!best || y.rides > best.rides ? y : best), null)?.year ?? null;
  const busiestYearByRides = peakYearByRides;
  const quietestYearByRides = byYear.reduce<YearSummary | null>((q, y) => (!q || y.rides < q.rides ? y : q), null)?.year ?? null;

  const chrono = [...dated].sort((a, b) => a.beginTime!.getTime() - b.beginTime!.getTime());
  const firstRide = chrono[0].beginTime!;
  const lastRide = chrono[chrono.length - 1].beginTime!;
  const yearsActive = byYear.length;

  // Year-over-year deltas (consecutive present years)
  const yoy: YoYDelta[] = [];
  for (let i = 1; i < byYear.length; i++) {
    const cur = byYear[i];
    const prev = byYear[i - 1];
    yoy.push({
      year: cur.year,
      prevYear: prev.year,
      spendDelta: cur.spend - prev.spend,
      spendPct: prev.spend > 0 ? ((cur.spend - prev.spend) / prev.spend) * 100 : null,
      ridesDelta: cur.rides - prev.rides,
      ridesPct: prev.rides > 0 ? ((cur.rides - prev.rides) / prev.rides) * 100 : null,
    });
  }
  const withPct = yoy.filter((y) => y.spendPct != null);
  const biggestJump = withPct.length ? withPct.reduce((a, b) => (b.spendPct! > a.spendPct! ? b : a)) : null;
  const biggestDrop = withPct.length ? withPct.reduce((a, b) => (b.spendPct! < a.spendPct! ? b : a)) : null;

  // Cumulative-spend milestones (chronological)
  const spendMilestones: Milestone[] = [];
  let cumulative = 0;
  let nextIdx = 0;
  for (const t of chrono) {
    cumulative += t.fareAmount ?? 0;
    while (nextIdx < MILESTONE_THRESHOLDS.length && cumulative >= MILESTONE_THRESHOLDS[nextIdx]) {
      spendMilestones.push({ amount: MILESTONE_THRESHOLDS[nextIdx], month: monthKey(t.beginTime!) });
      nextIdx += 1;
    }
  }

  const citiesByYear = [...yearCities.entries()]
    .map(([year, set]) => ({ year, cities: set.size }))
    .sort((a, b) => a.year - b.year);

  return {
    byYear,
    peakYearBySpend,
    peakYearByRides,
    firstRide,
    lastRide,
    yearsActive,
    spanLabel: spanLabel(firstRide, lastRide),
    yoy,
    biggestJump,
    biggestDrop,
    spendMilestones,
    distinctCitiesAllTime: allCities.size,
    citiesByYear,
    busiestYearByRides,
    quietestYearByRides,
  };
}
