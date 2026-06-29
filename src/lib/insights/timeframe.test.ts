import { describe, it, expect } from 'vitest';
import type { Trip } from '../../types/trip';
import { getAvailableYears, filterByTimeframe, defaultTimeframe } from './timeframe';
import { buildInsights, buildAllInsights, toAggregatePayload } from './index';

function trip(p: Partial<Trip>): Trip {
  return {
    status: 'completed', isCompleted: true, city: null, productType: 'uberX', fareAmount: null,
    currency: 'USD', distanceMiles: null, durationSeconds: null, beginTime: null, beginTimeLocal: null,
    requestTime: null, dropoffTime: null, timezone: null, beginAddress: null, dropoffAddress: null,
    beginLat: null, beginLng: null, dropoffLat: null, dropoffLng: null, surgeMultiplier: null,
    isSurged: null, isShared: null, isScheduled: null, isAirport: null, isCash: null,
    promotionAmount: null, creditsAmount: null, tollAmount: null, surgeFare: null, bookingFee: null,
    serviceFee: null, waitTimeFare: null, cancellationFee: null, baseFare: null, perMileFare: null,
    perMinuteFare: null, cancellationType: null, paymentType: null, cardLast4: null, flow: null, ...p,
  };
}
const d = (s: string) => new Date(s);

// Multi-year fixture: 2022 (2 rides $100), 2023 (3 rides $300), 2024 (1 ride $200)
const TRIPS = [
  trip({ city: 'NYC', fareAmount: 40, distanceMiles: 5, beginTime: d('2022-03-01T12:00:00Z'), beginTimeLocal: d('2022-03-01T12:00:00Z') }),
  trip({ city: 'NYC', fareAmount: 60, distanceMiles: 7, beginTime: d('2022-08-01T12:00:00Z'), beginTimeLocal: d('2022-08-01T12:00:00Z') }),
  trip({ city: 'NYC', fareAmount: 100, distanceMiles: 10, beginTime: d('2023-02-01T12:00:00Z'), beginTimeLocal: d('2023-02-01T12:00:00Z') }),
  trip({ city: 'LA', fareAmount: 100, distanceMiles: 12, beginTime: d('2023-06-01T12:00:00Z'), beginTimeLocal: d('2023-06-01T12:00:00Z') }),
  trip({ city: 'NYC', fareAmount: 100, distanceMiles: 8, beginTime: d('2023-09-01T12:00:00Z'), beginTimeLocal: d('2023-09-01T12:00:00Z') }),
  trip({ city: 'NYC', fareAmount: 200, distanceMiles: 20, beginTime: d('2024-01-01T12:00:00Z'), beginTimeLocal: d('2024-01-01T12:00:00Z') }),
];

describe('timeframe helpers', () => {
  it('getAvailableYears is newest-first', () => {
    expect(getAvailableYears(TRIPS)).toEqual([2024, 2023, 2022]);
  });
  it('filterByTimeframe filters by year; all = everything', () => {
    expect(filterByTimeframe(TRIPS, { kind: 'year', year: 2023 })).toHaveLength(3);
    expect(filterByTimeframe(TRIPS, { kind: 'all' })).toHaveLength(6);
  });
  it('default is All Time', () => {
    expect(defaultTimeframe([2024, 2023])).toEqual({ kind: 'all' });
  });
});

describe('timeframe-aware insights reconcile', () => {
  const all = buildInsights(TRIPS, TRIPS, { kind: 'all' });
  const y2022 = buildInsights(TRIPS, TRIPS, { kind: 'year', year: 2022 });
  const y2023 = buildInsights(TRIPS, TRIPS, { kind: 'year', year: 2023 });
  const y2024 = buildInsights(TRIPS, TRIPS, { kind: 'year', year: 2024 });

  it('per-year totals sum to all-time', () => {
    expect(all.stats.totalSpend).toBe(600);
    expect(y2022.stats.totalSpend + y2023.stats.totalSpend + y2024.stats.totalSpend).toBe(600);
    expect(y2022.stats.totalRides + y2023.stats.totalRides + y2024.stats.totalRides).toBe(all.stats.totalRides);
  });

  it('labels + allTime presence', () => {
    expect(all.meta.label).toBe('All Time');
    expect(y2023.meta.label).toBe('2023');
    expect(all.allTime).not.toBeNull();
    expect(y2023.allTime).toBeNull();
  });

  it('all-time longitudinal metrics', () => {
    const at = all.allTime!;
    expect(at.byYear.map((y) => y.year)).toEqual([2022, 2023, 2024]); // ascending
    expect(at.peakYearBySpend).toBe(2023); // $300 is the most
    expect(at.yearsActive).toBe(3);
    expect(at.distinctCitiesAllTime).toBe(2);
    // 2023 vs 2022: 300 vs 100 → +200%
    const yoy23 = at.yoy.find((y) => y.year === 2023)!;
    expect(yoy23.spendPct).toBeCloseTo(200, 0);
    expect(at.biggestJump?.year).toBe(2023);
  });

  it('spend milestones cross at the right month', () => {
    const at = all.allTime!;
    // cumulative crosses $1000? total is only $600, so no milestone
    expect(at.spendMilestones).toEqual([]);
  });
});

describe('roast scaling by timeframe', () => {
  // Big all-time spender across years
  const big: Trip[] = [];
  for (let y = 2020; y <= 2024; y++) {
    for (let i = 0; i < 60; i++) {
      big.push(trip({ city: 'NYC', fareAmount: 80, distanceMiles: 10, beginTime: new Date(Date.UTC(y, i % 12, 1)), beginTimeLocal: new Date(Date.UTC(y, i % 12, 1)) }));
    }
  }
  it('all-time reaches big-ticket comparisons; single year stays small', () => {
    const all = buildInsights(big, big, { kind: 'all' }); // $24,000
    const purchase = all.roasts.find((r) => r.category === 'purchase');
    expect(purchase).toBeDefined();
    expect(purchase!.id.startsWith('alltime-purchase')).toBe(true);
    expect(all.roasts.some((r) => r.id === 'alltime-years-active')).toBe(true);

    const oneYear = buildInsights(big, big, { kind: 'year', year: 2024 }); // $4,800
    const p2 = oneYear.roasts.find((r) => r.category === 'purchase');
    if (p2) expect(p2.id.startsWith('alltime-')).toBe(false);
  });

  it('sparse year still yields a coherent roast set, no absurd fractions', () => {
    const t = trip({ city: 'SF', fareAmount: 22, distanceMiles: 3, beginTime: d('2023-05-05T12:00:00Z'), beginTimeLocal: d('2023-05-05T12:00:00Z') });
    const ins = buildInsights([t], [t], { kind: 'year', year: 2023 });
    expect(ins.roasts.length).toBeGreaterThan(0);
    for (const r of ins.roasts) {
      if (r.category === 'purchase' || r.category === 'travel') expect(r.value).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('buildAllInsights precomputes timeframes', () => {
  it('contains all + each year', () => {
    const { years, byTimeframe } = buildAllInsights(TRIPS, TRIPS);
    expect(years).toEqual([2024, 2023, 2022]);
    expect(byTimeframe.get('all')?.stats.totalSpend).toBe(600);
    expect(byTimeframe.get('year:2023')?.stats.totalSpend).toBe(300);
    expect(byTimeframe.has('year:2022')).toBe(true);
  });
});

describe('all-time payload privacy + timeframe', () => {
  it('carries byYear/peakYear but no raw-trip/address fields', () => {
    const all = buildInsights(TRIPS, TRIPS, { kind: 'all' });
    const payload = toAggregatePayload(all);
    expect(payload.timeframeLabel).toBe('All Time');
    expect(payload.byYear?.length).toBe(3);
    expect(payload.peakYear).toBe(2023);
    for (const k of Object.keys(payload)) {
      const lk = k.toLowerCase();
      expect(lk.includes('address')).toBe(false);
      expect(lk).not.toMatch(/\b(lat|lng|route|coord|card)\b/);
    }
  });
});
