// Combine rides + eats into the headline "total to Uber" story. Pure helper —
// no PII (works off already-aggregated rides Stats + EatsInsights).

import type { Stats } from '../../types/insights';
import type { CombinedInsights, CombinedRoastSignals, EatsInsights } from '../../types/eats';
import { buildRidesSignals } from './rides/roastSignals';
import { buildEatsSignals } from './eats/roastSignals';

export function computeCombined(
  stats: Stats | null,
  eats: EatsInsights | null,
): CombinedInsights {
  const ridesSpend = stats?.totalSpend ?? 0;
  const eatsSpend = eats?.totalSpend ?? 0;
  const ridesCount = stats?.totalRides ?? 0;
  const eatsCount = eats?.orderCount ?? 0;
  const hasRides = !!stats && ridesCount > 0;
  const hasEats = !!eats && eatsCount > 0;

  const foodVsRidesPct =
    ridesSpend > 0 ? Math.round(((eatsSpend - ridesSpend) / ridesSpend) * 100) : null;

  // Merge the two date-range labels into a single span when both exist.
  const labels = [stats?.dateRange.label, eats?.dateRange.label].filter(
    (l): l is string => !!l,
  );
  const dateRangeLabel = labels[0] ?? '';

  return {
    totalToUber: ridesSpend + eatsSpend,
    ridesSpend,
    eatsSpend,
    ridesCount,
    eatsCount,
    totalInteractions: ridesCount + eatsCount,
    foodVsRidesPct,
    dateRangeLabel,
    hasRides,
    hasEats,
  };
}

/** Build the privacy-safe cross-service signal bundle. */
export function buildCombinedSignals(
  stats: Stats | null,
  eats: EatsInsights | null,
): CombinedRoastSignals {
  const combined = computeCombined(stats, eats);
  const rides = stats ? buildRidesSignals(stats) : null;
  const eatsSig = eats ? buildEatsSignals(eats) : null;
  return {
    totalToUber: Math.round(combined.totalToUber * 100) / 100,
    ridesSpend: Math.round(combined.ridesSpend * 100) / 100,
    eatsSpend: Math.round(combined.eatsSpend * 100) / 100,
    foodVsRidesPct: combined.foodVsRidesPct,
    ridesCount: combined.ridesCount,
    eatsCount: combined.eatsCount,
    hasRides: combined.hasRides,
    hasEats: combined.hasEats,
    rides,
    eats: eatsSig,
    currency: stats?.currency ?? eats?.currency ?? null,
  };
}
