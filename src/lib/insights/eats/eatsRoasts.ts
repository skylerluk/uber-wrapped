// Signature Eats roasts. Restaurant / item / instruction text is non-PII, so
// these are safe to surface and (for the AI layer) safe to send. The funniest
// come from cross-references: a most-canceled "toxic ex" restaurant, or a
// pharmacy run that lands right after a spicy feast.

import type { Roast } from '../../../types/insights';
import type { EatsInsights, EatsOrder } from '../../../types/eats';
import { isEatsCanceled } from '../../parse/eats/parseEats';
import { formatMoney, formatNumber } from '../../format';

const SPICY = /(spicy|sichuan|szechuan|mapo|hot pot|hotpot|curry|jalape|habanero|ghost pepper|nashville|buffalo|kimchi|tom yum|vindaloo|peking duck|wings)/i;
const PHARMACY = /(cvs|walgreens|duane reade|rite aid|pharmacy|drug ?store|pepto|kaopectate|azo|tums|imodium|alka-?seltzer)/i;

function formatHour(h: number): string {
  const am = h < 12;
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${am ? 'AM' : 'PM'}`;
}

/** Most-ordered item cadence. */
function obsessionRoast(eats: EatsInsights): Roast | null {
  const item = eats.mostOrderedItem;
  if (!item || item.qty < 5) return null;
  return {
    id: 'eats-obsession',
    category: 'food',
    headline: `You ordered ${item.name} ${formatNumber(item.qty)} times`,
    sub: `Variety is the spice of life. You ordered the ${item.name}. 🍽️`,
    emoji: '🍽️',
    severity: item.qty >= 30 ? 'spicy' : 'medium',
    value: item.qty,
    funScore: 83,
  };
}

/** The restaurant you canceled on the most — your toxic ex. */
function toxicExRoast(orders: EatsOrder[]): Roast | null {
  const cancels = new Map<string, number>();
  for (const o of orders) {
    if (o.restaurant && isEatsCanceled(o.status)) {
      cancels.set(o.restaurant, (cancels.get(o.restaurant) ?? 0) + 1);
    }
  }
  const top = [...cancels.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] < 2) return null;
  return {
    id: 'eats-toxic-ex',
    category: 'food',
    headline: `${top[0]} is your toxic ex`,
    sub: `You canceled on them ${formatNumber(top[1])} times — and kept going back. 💔`,
    emoji: '💔',
    severity: 'medium',
    value: top[1],
    funScore: 81,
  };
}

/** Spicy feast immediately followed (within ~24h) by a pharmacy order. */
function aftermathRoast(orders: EatsOrder[]): Roast | null {
  const timed = orders
    .filter((o) => o.requestTime)
    .sort((a, b) => a.requestTime!.getTime() - b.requestTime!.getTime());
  for (let i = 0; i < timed.length; i++) {
    const o = timed[i];
    const spicy = o.items.some((it) => it.name && SPICY.test(it.name)) || (o.restaurant != null && SPICY.test(o.restaurant));
    if (!spicy) continue;
    for (let j = i + 1; j < timed.length; j++) {
      const next = timed[j];
      const gapH = (next.requestTime!.getTime() - o.requestTime!.getTime()) / 3_600_000;
      if (gapH > 24) break;
      const pharm = (next.restaurant != null && PHARMACY.test(next.restaurant)) || next.items.some((it) => it.name && PHARMACY.test(it.name));
      if (pharm) {
        return {
          id: 'eats-aftermath',
          category: 'food',
          headline: `You ordered the spicy feast, then ordered the cleanup crew`,
          sub: `${o.restaurant ?? 'A spicy order'} → ${next.restaurant ?? 'the pharmacy'} within ${Math.round(gapH)}h. Actions have consequences. 🌶️🧻`,
          emoji: '🌶️',
          severity: 'spicy',
          value: Math.round(gapH),
          funScore: 90,
        };
      }
    }
  }
  return null;
}

/** Exquisitely polite special-instruction quotes. */
function politenessRoast(eats: EatsInsights): Roast | null {
  if (eats.ordersWithInstructions < 1 || eats.specialInstructionSamples.length === 0) return null;
  const sample = eats.specialInstructionSamples[0];
  return {
    id: 'eats-politeness',
    category: 'food',
    headline: `Exquisitely polite to the void`,
    sub: `${formatNumber(eats.ordersWithInstructions)} special instructions across ${formatNumber(eats.itemCount)} items; one was "${sample}". 🙏`,
    emoji: '🙏',
    severity: 'light',
    value: eats.ordersWithInstructions,
    funScore: 76,
  };
}

/** Priciest single order. */
function splurgeRoast(eats: EatsInsights): Roast | null {
  const o = eats.mostExpensiveOrder;
  if (!o || o.total <= 0) return null;
  return {
    id: 'eats-splurge',
    category: 'food',
    headline: `Your priciest order: ${formatMoney(o.total, eats.currency)}`,
    sub: `${o.restaurant ?? 'One very generous night'} — a single delivery that cost more than some people's groceries. 🤑`,
    emoji: '🤑',
    severity: o.total >= 100 ? 'spicy' : 'light',
    value: o.total,
    funScore: 74,
  };
}

/** Late-night craving timing. */
function timingRoast(eats: EatsInsights): Roast | null {
  if (eats.lateNightOrders < 2) return null;
  return {
    id: 'eats-late-night',
    category: 'time',
    headline: `${formatNumber(eats.lateNightOrders)} late-night orders`,
    sub: eats.favoriteHour != null
      ? `You peak around ${formatHour(eats.favoriteHour)}. The cravings don't keep office hours. 🌙`
      : `The cravings don't keep office hours. 🌙`,
    emoji: '🌙',
    severity: 'medium',
    value: eats.lateNightOrders,
    funScore: 72,
  };
}

/** Build the signature Eats roasts. `orders` is all orders (any status) for the timeframe. */
export function buildEatsRoasts(eats: EatsInsights, orders: EatsOrder[]): Roast[] {
  return [
    aftermathRoast(orders),
    obsessionRoast(eats),
    toxicExRoast(orders),
    politenessRoast(eats),
    splurgeRoast(eats),
    timingRoast(eats),
  ].filter((r): r is Roast => r !== null);
}
