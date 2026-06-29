// Timeframe model: one parse, many timeframes. All filtering uses the UTC
// instant (beginTime), consistent with date-range/month buckets in computeStats.

import type { Trip } from '../../types/trip';
import type { Timeframe } from '../../types/insights';
import type { EatsOrder } from '../../types/eats';

/** Distinct years present (newest first). Trips without a date are ignored. */
export function getAvailableYears(completedTrips: Trip[]): number[] {
  const years = new Set<number>();
  for (const t of completedTrips) {
    if (t.beginTime) years.add(t.beginTime.getUTCFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

export function filterByTimeframe<T extends Trip>(trips: T[], tf: Timeframe): T[] {
  if (tf.kind === 'all') return trips;
  return trips.filter((t) => t.beginTime != null && t.beginTime.getUTCFullYear() === tf.year);
}

/** Filter Eats orders by timeframe using the order request time. */
export function filterEatsByTimeframe(orders: EatsOrder[], tf: Timeframe): EatsOrder[] {
  if (tf.kind === 'all') return orders;
  return orders.filter((o) => o.requestTime != null && o.requestTime.getUTCFullYear() === tf.year);
}

/** Years present across rides + eats (newest first). */
export function getAvailableYearsCombined(
  completedTrips: Trip[],
  completedOrders: EatsOrder[],
): number[] {
  const years = new Set<number>();
  for (const t of completedTrips) if (t.beginTime) years.add(t.beginTime.getUTCFullYear());
  for (const o of completedOrders) if (o.requestTime) years.add(o.requestTime.getUTCFullYear());
  return [...years].sort((a, b) => b - a);
}

/** All-Time is always the default. */
export function defaultTimeframe(_years: number[]): Timeframe {
  return { kind: 'all' };
}

/** Stable string key for maps. */
export function timeframeKey(tf: Timeframe): string {
  return tf.kind === 'all' ? 'all' : `year:${tf.year}`;
}

export function timeframeLabel(tf: Timeframe): string {
  return tf.kind === 'all' ? 'All Time' : String(tf.year);
}
