// Cross-service roasts — the contrast between rides and Eats spend. Pure,
// non-PII (works off the combined headline numbers).

import type { Roast } from '../../types/insights';
import type { CombinedInsights } from '../../types/eats';
import { formatMoney } from '../format';

export function buildCrossServiceRoasts(combined: CombinedInsights): Roast[] {
  const roasts: Roast[] = [];
  if (!combined.hasRides || !combined.hasEats) return roasts;

  if (combined.foodVsRidesPct != null) {
    const pct = combined.foodVsRidesPct;
    roasts.push({
      id: 'cross-food-vs-rides',
      category: 'food',
      headline:
        pct >= 0
          ? `You spent ${pct}% more on food than on getting around`
          : `You spent ${Math.abs(pct)}% more on rides than on food`,
      sub:
        pct >= 0
          ? `${formatMoney(combined.eatsSpend, combined.currency)} delivered vs ${formatMoney(combined.ridesSpend, combined.currency)} driven. Priorities. 🍔`
          : `${formatMoney(combined.ridesSpend, combined.currency)} driven vs ${formatMoney(combined.eatsSpend, combined.currency)} delivered. You like to move. 🚗`,
      emoji: pct >= 0 ? '🍔' : '🚗',
      severity: 'medium',
      value: Math.abs(pct),
      funScore: 79,
    });
  }

  // The grand total, reframed.
  roasts.push({
    id: 'cross-grand-total',
    category: 'purchase',
    headline: `You basically funded a driver's car payment`,
    sub: `${formatMoney(combined.totalToUber, combined.currency)} to Uber between ${combined.ridesCount} rides and ${combined.eatsCount} orders. 🚗💸`,
    emoji: '💸',
    severity: 'spicy',
    value: combined.totalToUber,
    funScore: 86,
  });

  return roasts;
}
