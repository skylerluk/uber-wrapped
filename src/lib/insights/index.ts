// Public API for the insights engine.

import type { Trip } from '../../types/trip';
import type { AggregatePayload, Insights } from '../../types/insights';
import { computeStats } from './computeStats';
import { buildRoasts } from './roasts';

export { computeStats } from './computeStats';
export { buildRoasts } from './roasts';
export * from './comparisons';

export function buildInsights(allTrips: Trip[], completedTrips: Trip[]): Insights {
  const stats = computeStats(allTrips, completedTrips);
  const roasts = buildRoasts(stats);
  return {
    stats,
    roasts,
    meta: {
      generatedAt: new Date().toISOString(),
      hasFareData: stats.totalSpend > 0 || completedTrips.some((t) => t.fareAmount != null),
    },
  };
}

/**
 * PRIVACY BOUNDARY. The only shape that may be sent off-device (Phase 4 → Gemini).
 * Deliberately omits every address, coordinate, and raw trip. If you add a field
 * here, it must be a non-identifying aggregate — and update the privacy test.
 */
export function toAggregatePayload(insights: Insights): AggregatePayload {
  const { stats, roasts } = insights;
  return {
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
    comparisons: roasts
      .filter((r) => r.category === 'purchase' || r.category === 'travel' || r.category === 'food')
      .map((r) => ({ id: r.id, label: r.headline, multiple: Math.round(r.value * 100) / 100 })),
  };
}
