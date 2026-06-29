// Public API for the insights engine.

import type { Trip } from '../../types/trip';
import type { AggregatePayload, Insights, Timeframe } from '../../types/insights';
import { computeStats } from './computeStats';
import { buildRoasts } from './roasts';
import { computeAllTime } from './allTime';
import {
  filterByTimeframe,
  getAvailableYears,
  timeframeKey,
  timeframeLabel,
} from './timeframe';

export { computeStats } from './computeStats';
export { buildRoasts } from './roasts';
export { computeAllTime } from './allTime';
export * from './comparisons';
export * from './timeframe';

/**
 * Build insights for a timeframe (defaults to All Time). `allTrips` and
 * `completedTrips` are the full parsed sets; this filters both internally.
 */
export function buildInsights(
  allTrips: Trip[],
  completedTrips: Trip[],
  timeframe: Timeframe = { kind: 'all' },
): Insights {
  const all = filterByTimeframe(allTrips, timeframe);
  const completed = filterByTimeframe(completedTrips, timeframe);
  const stats = computeStats(all, completed);
  const allTime = timeframe.kind === 'all' ? computeAllTime(completed) : null;
  const roasts = buildRoasts(stats, { timeframe, allTime });
  return {
    stats,
    roasts,
    allTime,
    meta: {
      generatedAt: new Date().toISOString(),
      hasFareData: stats.totalSpend > 0 || completed.some((t) => t.fareAmount != null),
      timeframe,
      label: timeframeLabel(timeframe),
    },
  };
}

export interface AllInsights {
  years: number[];
  /** keyed by timeframeKey: 'all' | 'year:2025' */
  byTimeframe: Map<string, Insights>;
}

/**
 * Precompute insights for All Time + every available year so the UI can switch
 * timeframes instantly without re-parsing or recomputing.
 */
export function buildAllInsights(allTrips: Trip[], completedTrips: Trip[]): AllInsights {
  const years = getAvailableYears(completedTrips);
  const byTimeframe = new Map<string, Insights>();

  const allTf: Timeframe = { kind: 'all' };
  byTimeframe.set(timeframeKey(allTf), buildInsights(allTrips, completedTrips, allTf));
  for (const year of years) {
    const tf: Timeframe = { kind: 'year', year };
    byTimeframe.set(timeframeKey(tf), buildInsights(allTrips, completedTrips, tf));
  }

  return { years, byTimeframe };
}

/**
 * PRIVACY BOUNDARY. The only shape that may be sent off-device (Phase 4 → Gemini).
 * Deliberately omits every address, coordinate, card, and raw trip. If you add a
 * field here, it must be a non-identifying aggregate — and update the privacy test.
 */
export function toAggregatePayload(insights: Insights): AggregatePayload {
  const { stats, roasts, allTime, meta } = insights;
  const payload: AggregatePayload = {
    totalSpend: Math.round(stats.totalSpend),
    currency: stats.currency,
    totalRides: stats.totalRides,
    totalDistanceMiles: Math.round(stats.totalDistanceMiles),
    dateRangeLabel: stats.dateRange.label,
    topCity: stats.topCity?.city ?? null,
    distinctCityCount: stats.distinctCityCount,
    avgFare: Math.round(stats.avgFare * 100) / 100,
    mostExpensiveFare: stats.mostExpensiveTrip?.amount ?? null,
    canceledRides: stats.canceledRides,
    lateNightRides: stats.lateNightRides,
    busiestDayOfWeek: stats.busiestDayOfWeek?.day ?? null,
    favoriteTimeOfDay: stats.favoriteTimeOfDay?.bucket ?? null,
    hoursInCar: Math.round(stats.totalDurationSeconds / 3600),
    totalSurgeFare: Math.round(stats.totalSurgeFare),
    totalTolls: Math.round(stats.totalTolls),
    totalSaved: Math.round(stats.totalSaved),
    airportRides: stats.airportRides,
    scheduledRides: stats.scheduledRides,
    topProduct: stats.productMix[0]?.product ?? null,
    timeframeLabel: meta.label,
    comparisons: roasts
      .filter((r) => r.category === 'purchase' || r.category === 'travel' || r.category === 'food')
      .map((r) => ({ id: r.id, label: r.headline, multiple: Math.round(r.value * 100) / 100 })),
  };

  if (allTime) {
    payload.byYear = allTime.byYear.map((y) => ({
      year: y.year,
      spend: Math.round(y.spend),
      rides: y.rides,
    }));
    payload.peakYear = allTime.peakYearBySpend;
    payload.topYoYPct = allTime.biggestJump?.spendPct != null ? Math.round(allTime.biggestJump.spendPct) : null;
    payload.yearsActive = allTime.yearsActive;
  }

  return payload;
}
