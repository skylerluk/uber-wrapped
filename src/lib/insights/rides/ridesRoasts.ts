// Signature rides roasts — the comedic centerpiece for the rides half. These
// run CLIENT-SIDE, so the address-bearing ones (short paid walk, priciest route)
// may cite real streets; those strings must never reach the backend (they live
// only on Roast objects in `insights.roasts`, never in toAggregatePayload).

import type { Roast, Stats } from '../../../types/insights';
import type { Reputation } from '../../../types/eats';
import type { Trip } from '../../../types/trip';
import { formatMoney, formatNumber } from '../../format';

function route(begin: string | null, dropoff: string | null): string | null {
  if (!begin && !dropoff) return null;
  return `${begin ?? 'somewhere'} → ${dropoff ?? 'somewhere'}`;
}

/** Rider rating + the 1-star count (the gold). Rating numbers are non-PII. */
function ratingRoast(rep: Reputation | null, currency: string | null): Roast | null {
  void currency;
  if (!rep || rep.rating == null || rep.totalRatings === 0) return null;
  const fives = rep.distribution.find((d) => d.stars === 5)?.count ?? 0;
  if (rep.oneStar < 1) return null;
  return {
    id: 'rides-rating-onestar',
    category: 'superlative',
    headline: `Your rating is ${rep.rating.toFixed(2)} — and ${formatNumber(rep.oneStar)} drivers gave you a flat 1 star`,
    sub: `${formatNumber(fives)} of ${formatNumber(rep.totalRatings)} ratings were 5s, but ${formatNumber(rep.oneStar)} humans met you once and chose violence. ⭐`,
    emoji: '⭐',
    severity: 'spicy',
    value: rep.oneStar,
    funScore: 92,
  };
}

/** Tiny distance, real fare — you paid to skip a walk. CLIENT-SIDE (addresses). */
function shortPaidWalkRoast(completed: Trip[], currency: string | null): Roast | null {
  const candidates = completed.filter(
    (t) => t.distanceMiles != null && t.distanceMiles > 0 && t.distanceMiles < 0.6 && (t.fareAmount ?? 0) > 8,
  );
  if (candidates.length === 0) return null;
  // The most absurd one: highest dollars-per-mile.
  const worst = candidates.reduce((a, b) =>
    (b.fareAmount ?? 0) / (b.distanceMiles ?? 1) > (a.fareAmount ?? 0) / (a.distanceMiles ?? 1) ? b : a,
  );
  const miles = worst.distanceMiles ?? 0;
  const walkMin = Math.max(1, Math.round((miles / 3) * 60));
  const r = route(worst.beginAddress, worst.dropoffAddress);
  return {
    id: 'rides-short-paid-walk',
    category: 'behavior',
    headline: `You paid ${formatMoney(worst.fareAmount ?? 0, currency)} to travel ${miles.toFixed(2)} miles`,
    sub: `A ${walkMin}-minute walk${r ? ` (${r})` : ''}. You looked at the sidewalk, looked at your phone, chose the phone. 🚶`,
    emoji: '🚶',
    severity: 'spicy',
    value: worst.fareAmount ?? 0,
    funScore: 88,
  };
}

/** Rider-cancellation flakiness. */
function ghostingRoast(stats: Stats): Roast | null {
  const ghosted = stats.riderCanceledRides || stats.canceledRides;
  if (ghosted < 5) return null;
  const requests = stats.totalRides + stats.canceledRides;
  const pct = requests > 0 ? Math.round((stats.canceledRides / requests) * 100) : 0;
  const fees = stats.cancellationFeesPaid > 0 ? `, ${formatMoney(stats.cancellationFeesPaid, stats.currency)} in fees` : '';
  return {
    id: 'rides-ghosting',
    category: 'behavior',
    headline: `You've ghosted ${formatNumber(ghosted)} drivers`,
    sub: `${formatNumber(stats.canceledRides)} cancellations${fees} — about ${pct}% of your requests. They're not mad, just disappointed. 👻`,
    emoji: '👻',
    severity: ghosted >= 30 ? 'spicy' : 'medium',
    value: ghosted,
    funScore: 84,
  };
}

/** Max surge multiplier eaten without blinking. */
function surgeMaxRoast(stats: Stats, completed: Trip[]): Roast | null {
  if (stats.totalSurgeFare <= 0 && stats.surgedRides === 0) return null;
  const maxMult = completed.reduce((m, t) => Math.max(m, t.surgeMultiplier ?? 0), 0);
  if (maxMult < 1.5) return null;
  return {
    id: 'rides-surge-max',
    category: 'behavior',
    headline: `Surge pricing owns you`,
    sub: `${formatNumber(stats.surgedRides)} surged trips, max ${maxMult.toFixed(1)}×, ${formatMoney(stats.totalSurgeFare, stats.currency)} in surge tax — eaten without blinking. ⚡`,
    emoji: '⚡',
    severity: maxMult >= 3 ? 'spicy' : 'medium',
    value: maxMult,
    funScore: 80,
  };
}

/**
 * Build the signature rides roasts. `reputation` is optional (lifetime). The
 * short-paid-walk + any route copy are client-side only.
 */
export function buildRidesRoasts(
  stats: Stats,
  completed: Trip[],
  reputation: Reputation | null,
): Roast[] {
  return [
    ratingRoast(reputation, stats.currency),
    shortPaidWalkRoast(completed, stats.currency),
    ghostingRoast(stats),
    surgeMaxRoast(stats, completed),
  ].filter((r): r is Roast => r !== null);
}
