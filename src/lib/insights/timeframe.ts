// Timeframe model: one parse, many timeframes. All filtering uses the UTC
// instant (beginTime), consistent with date-range/month buckets in computeStats.

import type { Trip } from '../../types/trip';
import type { Timeframe } from '../../types/insights';

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
