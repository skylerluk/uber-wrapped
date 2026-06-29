// The roast / fun-fact engine. Deterministic, derived purely from Stats.
// Tone: playful, Spotify-Wrapped energy — tease the habit, never the person.

import type { Roast, Stats, Timeframe, AllTimeInsights } from '../../types/insights';
import {
  BIG_PURCHASES,
  TRAVEL,
  FOOD,
  DISTANCE,
  ALLTIME_PURCHASES,
  ALLTIME_TRAVEL,
  investedValue,
  type PriceRef,
} from './comparisons';

export interface RoastContext {
  timeframe?: Timeframe;
  allTime?: AllTimeInsights | null;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function money(n: number, currency: string | null): string {
  const code = currency ?? 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${fmt(n)} ${code}`;
  }
}

/** Closeness-to-integer bonus (0–10): rewards satisfyingly round multiples. */
function roundnessBonus(multiple: number): number {
  const frac = Math.abs(multiple - Math.round(multiple));
  return Math.max(0, 10 - frac * 20);
}

/** Most impressive affordable item (unitPrice <= spend), else null. */
function pickAffordable(refs: PriceRef[], spend: number): { ref: PriceRef; multiple: number } | null {
  const affordable = refs.filter((r) => spend >= r.unitPrice);
  if (affordable.length === 0) return null;
  const ref = affordable.reduce((a, b) => (b.unitPrice > a.unitPrice ? b : a));
  return { ref, multiple: spend / ref.unitPrice };
}

function purchaseRoast(stats: Stats): Roast | null {
  if (stats.totalSpend <= 0) return null;
  const pick = pickAffordable(BIG_PURCHASES, stats.totalSpend);
  if (!pick) return null;
  const count = Math.floor(pick.multiple);
  const headline =
    count >= 2
      ? `Enough Uber to buy ${count} ${pick.ref.plural}`
      : `Enough Uber to buy ${pick.ref.label}`;
  return {
    id: `purchase-${pick.ref.id}`,
    category: 'purchase',
    headline,
    sub: `You spent ${money(stats.totalSpend, stats.currency)} getting driven around.`,
    emoji: pick.ref.emoji,
    severity: count >= 2 ? 'spicy' : 'medium',
    value: count >= 2 ? count : pick.multiple,
    funScore: 82 + roundnessBonus(pick.multiple),
  };
}

function travelRoast(stats: Stats): Roast | null {
  if (stats.totalSpend <= 0) return null;
  const pick = pickAffordable(TRAVEL, stats.totalSpend);
  if (!pick) return null;
  const count = Math.floor(pick.multiple);
  const headline =
    count >= 2
      ? `That's ${count} ${pick.ref.plural}`
      : `That's ${pick.ref.label}`;
  return {
    id: `travel-${pick.ref.id}`,
    category: 'travel',
    headline,
    sub: `Instead, you stayed local. ${money(stats.totalSpend, stats.currency)} of local.`,
    emoji: pick.ref.emoji,
    severity: 'medium',
    value: count >= 2 ? count : pick.multiple,
    funScore: 76 + roundnessBonus(pick.multiple),
  };
}

function foodRoast(stats: Stats): Roast | null {
  if (stats.totalSpend < 3) return null;
  // Lattes give the most relatable, punchy big number.
  const latte = FOOD.find((f) => f.id === 'latte')!;
  const count = Math.round(stats.totalSpend / latte.unitPrice);
  return {
    id: 'food-latte',
    category: 'food',
    headline: `That's ${fmt(count)} ${latte.plural}`,
    sub: `Same money, ${fmt(count)} caffeine highs. ${latte.emoji}`,
    emoji: latte.emoji,
    severity: 'light',
    value: count,
    funScore: 58,
  };
}

function distanceRoast(stats: Stats): Roast | null {
  const miles = stats.totalDistanceMiles;
  if (miles <= 0) return null;

  if (miles >= DISTANCE.aroundEarth) {
    const laps = miles / DISTANCE.aroundEarth;
    return {
      id: 'distance-earth-laps',
      category: 'distance',
      headline: `${laps.toFixed(1)}× around the Earth`,
      sub: `${fmt(miles)} miles in the back seat. 🌍`,
      emoji: '🌍',
      severity: 'spicy',
      value: laps,
      funScore: 78 + roundnessBonus(laps),
    };
  }
  if (miles >= DISTANCE.acrossUSOneWay * 2) {
    const trips = miles / (DISTANCE.acrossUSOneWay * 2);
    return {
      id: 'distance-us-roundtrips',
      category: 'distance',
      headline: `Across the US and back ${trips.toFixed(1)}×`,
      sub: `${fmt(miles)} miles of Uber. 🚗`,
      emoji: '🛣️',
      severity: 'medium',
      value: trips,
      funScore: 72 + roundnessBonus(trips),
    };
  }
  const pct = (miles / DISTANCE.aroundEarth) * 100;
  if (pct >= 1) {
    return {
      id: 'distance-earth-pct',
      category: 'distance',
      headline: `${pct.toFixed(0)}% of the way around the Earth`,
      sub: `${fmt(miles)} miles, one ride at a time. 🌍`,
      emoji: '🌍',
      severity: 'light',
      value: pct,
      funScore: 64,
    };
  }
  const marathons = miles / DISTANCE.marathon;
  return {
    id: 'distance-marathons',
    category: 'distance',
    headline: `${fmt(marathons)} marathons — that you didn't run`,
    sub: `${fmt(miles)} miles, zero steps. 🏃`,
    emoji: '🏃',
    severity: 'light',
    value: marathons,
    funScore: 60,
  };
}

function lateNightRoast(stats: Stats): Roast | null {
  if (stats.lateNightRides < 3) return null;
  return {
    id: 'time-late-night',
    category: 'time',
    headline: `${fmt(stats.lateNightRides)} rides after midnight`,
    sub: `The 2am Uber knows your secrets. 🌙`,
    emoji: '🌙',
    severity: stats.lateNightRides >= 20 ? 'spicy' : 'medium',
    value: stats.lateNightRides,
    funScore: 68 + Math.min(stats.lateNightRides / 5, 8),
  };
}

function canceledRoast(stats: Stats): Roast | null {
  if (stats.canceledRides < 3) return null;
  return {
    id: 'behavior-canceled',
    category: 'behavior',
    headline: `You ghosted ${fmt(stats.canceledRides)} drivers`,
    sub: `${fmt(stats.canceledRides)} canceled rides. They're not mad, just disappointed. 👻`,
    emoji: '👻',
    severity: 'medium',
    value: stats.canceledRides,
    funScore: 63,
  };
}

function mostExpensiveRoast(stats: Stats): Roast | null {
  const t = stats.mostExpensiveTrip;
  if (!t || t.amount == null || t.amount <= 0) return null;
  const where = t.city ? ` in ${t.city}` : '';
  return {
    id: 'superlative-most-expensive',
    category: 'superlative',
    headline: `Your priciest ride: ${money(t.amount, stats.currency)}`,
    sub: `One trip${where} that cost more than some people's weekly groceries.`,
    emoji: '💸',
    severity: t.amount >= 100 ? 'spicy' : 'light',
    value: t.amount,
    funScore: 66,
  };
}

function busyDayRoast(stats: Stats): Roast | null {
  const d = stats.mostRidesInOneDay;
  if (!d || d.count < 4) return null;
  return {
    id: 'behavior-busy-day',
    category: 'behavior',
    headline: `${d.count} rides in a single day`,
    sub: `On ${d.date} you really committed to not walking.`,
    emoji: '🐝',
    severity: 'light',
    value: d.count,
    funScore: 57,
  };
}

function avgFareRoast(stats: Stats): Roast | null {
  if (stats.avgFare <= 0 || stats.totalRides < 5) return null;
  return {
    id: 'money-avg-fare',
    category: 'behavior',
    headline: `${money(stats.avgFare, stats.currency)} per ride, on average`,
    sub: `Across ${fmt(stats.totalRides)} rides. It adds up. 📈`,
    emoji: '📈',
    severity: 'light',
    value: stats.avgFare,
    funScore: 52,
  };
}

function surgeTaxRoast(stats: Stats): Roast | null {
  if (stats.totalSurgeFare <= 0) return null;
  const avg = stats.avgSurgeMultiplier > 1 ? `, averaging ${stats.avgSurgeMultiplier.toFixed(1)}×` : '';
  return {
    id: 'money-surge-tax',
    category: 'behavior',
    headline: `${money(stats.totalSurgeFare, stats.currency)} in surge pricing`,
    sub: `${fmt(stats.surgedRides)} rides caught a surge${avg}. The impatience tax is real. ⚡`,
    emoji: '⚡',
    severity: stats.totalSurgeFare >= 200 ? 'spicy' : 'medium',
    value: stats.totalSurgeFare,
    funScore: 71,
  };
}

function tollsRoast(stats: Stats): Roast | null {
  if (stats.totalTolls <= 0) return null;
  return {
    id: 'money-tolls',
    category: 'behavior',
    headline: `${money(stats.totalTolls, stats.currency)} just in tolls`,
    sub: `Bridges and tunnels don't come free. 🌉`,
    emoji: '🌉',
    severity: 'light',
    value: stats.totalTolls,
    funScore: 54,
  };
}

function savingsRoast(stats: Stats): Roast | null {
  if (stats.totalSaved <= 0) return null;
  return {
    id: 'money-saved',
    category: 'behavior',
    headline: `You saved ${money(stats.totalSaved, stats.currency)} with promos & credits`,
    sub: `A small win against the fare. 🎟️`,
    emoji: '🎟️',
    severity: 'light',
    value: stats.totalSaved,
    funScore: 60,
  };
}

function airportRoast(stats: Stats): Roast | null {
  if (stats.airportRides < 2) return null;
  return {
    id: 'behavior-airport',
    category: 'behavior',
    headline: `${fmt(stats.airportRides)} airport runs`,
    sub: `Someone's always catching a flight. ✈️`,
    emoji: '✈️',
    severity: 'light',
    value: stats.airportRides,
    funScore: 59,
  };
}

function timeInCarRoast(stats: Stats): Roast | null {
  const hours = stats.totalDurationSeconds / 3600;
  if (hours < 1) return null;
  const movies = Math.round(hours / 2);
  return {
    id: 'time-in-car',
    category: 'time',
    headline: `${fmt(hours)} hours in the back of an Uber`,
    sub: movies >= 1 ? `That's about ${fmt(movies)} movies you could've watched. ⏱️` : `Time flies in traffic. ⏱️`,
    emoji: '⏱️',
    severity: hours >= 100 ? 'spicy' : 'medium',
    value: hours,
    funScore: 69,
  };
}

function cancellationFeesRoast(stats: Stats): Roast | null {
  if (stats.cancellationFeesPaid <= 0) return null;
  return {
    id: 'behavior-cancellation-fees',
    category: 'behavior',
    headline: `${money(stats.cancellationFeesPaid, stats.currency)} in cancellation fees`,
    sub: `${fmt(stats.riderCanceledRides)} rides you bailed on. Commitment issues? 👻`,
    emoji: '👻',
    severity: 'medium',
    value: stats.cancellationFeesPaid,
    funScore: 58,
  };
}

function productLoyaltyRoast(stats: Stats): Roast | null {
  const top = stats.productMix[0];
  if (!top || stats.totalRides < 5) return null;
  const pct = Math.round((top.rides / stats.totalRides) * 100);
  if (pct < 50) return null;
  return {
    id: 'behavior-product-loyalty',
    category: 'behavior',
    headline: `${pct}% of your rides were ${top.product}`,
    sub: `A creature of habit. 🚗`,
    emoji: '🚗',
    severity: 'light',
    value: pct,
    funScore: 53,
  };
}

// ——— All-time (bigger scale + longitudinal) ———

function allTimePurchaseRoast(stats: Stats): Roast | null {
  if (stats.totalSpend <= 0) return null;
  const pick = pickAffordable(ALLTIME_PURCHASES, stats.totalSpend);
  if (!pick) return null;
  const count = Math.floor(pick.multiple);
  const headline =
    count >= 2 ? `Lifetime Uber = ${count} ${pick.ref.plural}` : `Lifetime Uber = ${pick.ref.label}`;
  return {
    id: `alltime-purchase-${pick.ref.id}`,
    category: 'purchase',
    headline,
    sub: `${money(stats.totalSpend, stats.currency)} across your whole Uber history.`,
    emoji: pick.ref.emoji,
    severity: 'spicy',
    value: count >= 2 ? count : pick.multiple,
    funScore: 90 + roundnessBonus(pick.multiple),
  };
}

function allTimeTravelRoast(stats: Stats): Roast | null {
  if (stats.totalSpend <= 0) return null;
  const pick = pickAffordable(ALLTIME_TRAVEL, stats.totalSpend);
  if (!pick) return null;
  const count = Math.floor(pick.multiple);
  return {
    id: `alltime-travel-${pick.ref.id}`,
    category: 'travel',
    headline: count >= 2 ? `That's ${count} ${pick.ref.plural}` : `That's ${pick.ref.label}`,
    sub: `You stayed earthbound instead.`,
    emoji: pick.ref.emoji,
    severity: 'medium',
    value: count >= 2 ? count : pick.multiple,
    funScore: 80 + roundnessBonus(pick.multiple),
  };
}

function investmentRoast(stats: Stats, allTime: AllTimeInsights): Roast | null {
  if (stats.totalSpend < 1000 || allTime.yearsActive < 2) return null;
  const fv = investedValue(stats.totalSpend, allTime.yearsActive);
  return {
    id: 'alltime-invested',
    category: 'behavior',
    headline: `Invested at 7%, that'd be ${money(fv, stats.currency)} today`,
    sub: `Your rides instead of your retirement. 📈`,
    emoji: '📈',
    severity: 'spicy',
    value: fv,
    funScore: 74,
  };
}

function peakYearRoast(stats: Stats, allTime: AllTimeInsights): Roast | null {
  if (allTime.peakYearBySpend == null || allTime.byYear.length < 2) return null;
  const y = allTime.byYear.find((b) => b.year === allTime.peakYearBySpend);
  if (!y) return null;
  return {
    id: 'alltime-peak-year',
    category: 'superlative',
    headline: `${y.year} was your Uber era`,
    sub: `${money(y.spend, stats.currency)} across ${fmt(y.rides)} rides — your biggest year.`,
    emoji: '👑',
    severity: 'medium',
    value: y.spend,
    funScore: 77,
  };
}

function yearsActiveRoast(allTime: AllTimeInsights): Roast | null {
  if (!allTime.spanLabel || allTime.yearsActive < 2) return null;
  return {
    id: 'alltime-years-active',
    category: 'time',
    headline: `You've been an Uber person for ${allTime.spanLabel}`,
    sub: `Loyalty that the subway could never. 🚇`,
    emoji: '🗓️',
    severity: 'light',
    value: allTime.yearsActive,
    funScore: 70,
  };
}

function yoyRoast(allTime: AllTimeInsights): Roast | null {
  const j = allTime.biggestJump;
  if (!j || j.spendPct == null || j.spendPct < 20) return null;
  return {
    id: 'alltime-yoy',
    category: 'behavior',
    headline: `${j.year}-you spent ${Math.round(j.spendPct)}% more than ${j.prevYear}-you`,
    sub: `The habit only grew. 📈`,
    emoji: '📈',
    severity: 'medium',
    value: j.spendPct,
    funScore: 67,
  };
}

function citiesOverTimeRoast(allTime: AllTimeInsights): Roast | null {
  if (allTime.distinctCitiesAllTime < 2 || allTime.yearsActive < 2) return null;
  return {
    id: 'alltime-cities',
    category: 'behavior',
    headline: `${fmt(allTime.distinctCitiesAllTime)} cities across ${fmt(allTime.yearsActive)} years`,
    sub: `An Uber in every port. 🌎`,
    emoji: '🌎',
    severity: 'light',
    value: allTime.distinctCitiesAllTime,
    funScore: 62,
  };
}

/**
 * Build the ranked roast list. Pass `{ timeframe: { kind: 'all' }, allTime }`
 * for the grander all-time catalog + longitudinal roasts; otherwise the tighter
 * single-year scale is used.
 */
export function buildRoasts(stats: Stats, ctx?: RoastContext): Roast[] {
  const isAllTime = ctx?.timeframe?.kind === 'all';
  const at = ctx?.allTime ?? null;

  const shared = [
    foodRoast(stats),
    distanceRoast(stats),
    lateNightRoast(stats),
    canceledRoast(stats),
    mostExpensiveRoast(stats),
    busyDayRoast(stats),
    avgFareRoast(stats),
    surgeTaxRoast(stats),
    tollsRoast(stats),
    savingsRoast(stats),
    airportRoast(stats),
    timeInCarRoast(stats),
    cancellationFeesRoast(stats),
    productLoyaltyRoast(stats),
  ];

  const scaled =
    isAllTime
      ? [
          allTimePurchaseRoast(stats),
          allTimeTravelRoast(stats),
          ...(at
            ? [
                investmentRoast(stats, at),
                peakYearRoast(stats, at),
                yearsActiveRoast(at),
                yoyRoast(at),
                citiesOverTimeRoast(at),
              ]
            : []),
        ]
      : [purchaseRoast(stats), travelRoast(stats)];

  const candidates = [...scaled, ...shared].filter((r): r is Roast => r !== null);
  return candidates.sort((a, b) => b.funScore - a.funScore);
}
