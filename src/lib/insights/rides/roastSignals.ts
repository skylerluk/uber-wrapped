// Distill rides Stats into the privacy-safe signal bundle. No addresses,
// coordinates, routes, or card data — only anonymized aggregates + city/product
// labels that are already safe to surface.

import type { Stats } from '../../../types/insights';
import type { RidesRoastSignals } from '../../../types/eats';

export function buildRidesSignals(stats: Stats): RidesRoastSignals {
  return {
    totalSpend: Math.round(stats.totalSpend * 100) / 100,
    rides: stats.totalRides,
    avgFare: Math.round(stats.avgFare * 100) / 100,
    mostExpensiveFare: stats.mostExpensiveTrip?.amount ?? null,
    lateNightRides: stats.lateNightRides,
    surgeFare: Math.round(stats.totalSurgeFare * 100) / 100,
    canceledRides: stats.canceledRides,
    topCity: stats.topCity?.city ?? null,
    topProduct: stats.productMix[0]?.product ?? null,
    hoursInCar: Math.round(stats.totalDurationSeconds / 3600),
    currency: stats.currency,
  };
}
