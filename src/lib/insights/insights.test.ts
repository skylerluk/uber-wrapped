import { describe, it, expect } from 'vitest';
import type { Trip } from '../../types/trip';
import { computeStats } from './computeStats';
import { buildRoasts } from './roasts';
import { buildInsights, toAggregatePayload } from './index';

function trip(p: Partial<Trip>): Trip {
  return {
    status: 'completed',
    isCompleted: null,
    city: null,
    productType: null,
    fareAmount: null,
    currency: 'USD',
    distanceMiles: null,
    durationSeconds: null,
    beginTime: null,
    beginTimeLocal: null,
    requestTime: null,
    dropoffTime: null,
    timezone: null,
    beginAddress: null,
    dropoffAddress: null,
    beginLat: null,
    beginLng: null,
    dropoffLat: null,
    dropoffLng: null,
    surgeMultiplier: null,
    isSurged: null,
    isShared: null,
    isScheduled: null,
    isAirport: null,
    isCash: null,
    promotionAmount: null,
    creditsAmount: null,
    tollAmount: null,
    surgeFare: null,
    bookingFee: null,
    serviceFee: null,
    waitTimeFare: null,
    cancellationFee: null,
    baseFare: null,
    perMileFare: null,
    perMinuteFare: null,
    cancellationType: null,
    paymentType: null,
    cardLast4: null,
    flow: null,
    ...p,
  };
}
const d = (s: string) => new Date(s);

// Known-answer fixture.
const A = trip({ city: 'San Francisco', fareAmount: 10, distanceMiles: 2, beginTime: d('2023-01-02T14:00:00Z') }); // Mon afternoon
const B = trip({ city: 'San Francisco', fareAmount: 50, distanceMiles: 5, beginTime: d('2023-01-02T03:00:00Z'), beginAddress: '1 Secret St', dropoffAddress: '2 Hidden Ave', beginLat: 37.123456, beginLng: -122.654321, cardLast4: '9876' }); // Mon late-night
const C = trip({ city: 'Oakland', fareAmount: 20, distanceMiles: 100, beginTime: d('2023-06-15T18:00:00Z') }); // Thu evening
const D = trip({ city: 'San Francisco', status: 'canceled', fareAmount: null, beginTime: d('2023-07-01T12:00:00Z') });
const E = trip({ city: 'New York', fareAmount: null, beginTime: d('2023-08-01T09:00:00Z') }); // blank fare, completed

const ALL = [A, B, C, D, E];
const COMPLETED = [A, B, C, E];

describe('computeStats', () => {
  const s = computeStats(ALL, COMPLETED);

  it('headline totals', () => {
    expect(s.totalSpend).toBe(80);
    expect(s.totalRides).toBe(4);
    expect(s.totalDistanceMiles).toBe(107);
    expect(s.currency).toBe('USD');
    expect(s.dateRange.label).toBe('2023');
  });

  it('superlatives', () => {
    expect(s.mostExpensiveTrip?.amount).toBe(50);
    expect(s.cheapestTrip?.amount).toBe(10);
    expect(s.longestTrip?.distanceMiles).toBe(100);
  });

  it('money aggregates', () => {
    expect(s.avgFare).toBeCloseTo(80 / 3, 4);
    expect(s.medianFare).toBe(20);
    expect(s.spendByYear).toEqual([{ year: 2023, spend: 80, rides: 4 }]);
    expect(s.totalSpendByMonth.find((m) => m.month === '2023-01')).toEqual({
      month: '2023-01',
      spend: 60,
      rides: 2,
    });
  });

  it('geography', () => {
    expect(s.topCity?.city).toBe('San Francisco');
    expect(s.topCity?.rides).toBe(2);
    expect(s.distinctCityCount).toBe(3);
  });

  it('time patterns', () => {
    expect(s.busiestDayOfWeek?.day).toBe('Monday');
    expect(s.busiestDayOfWeek?.count).toBe(2);
    expect(s.lateNightRides).toBe(1);
    expect(s.busiestMonth?.month).toBe('2023-01');
    expect(s.ridesByHour[3]).toBe(1);
    expect(s.ridesByHour[14]).toBe(1);
  });

  it('fun extras', () => {
    expect(s.canceledRides).toBe(1);
    expect(s.firstEverRide?.amount).toBe(50); // B at 03:00 is earliest
    expect(s.mostRidesInOneDay).toEqual({ date: '2023-01-02', count: 2 });
    expect(s.longestGapBetweenRides?.days).toBeGreaterThan(150);
    expect(s.longestGapBetweenRides?.days).toBeLessThan(170);
  });

  it('never returns NaN on empty input', () => {
    const empty = computeStats([], []);
    expect(empty.totalSpend).toBe(0);
    expect(empty.avgFare).toBe(0);
    expect(empty.medianFare).toBe(0);
    expect(Number.isNaN(empty.avgFare)).toBe(false);
    expect(empty.topCity).toBeNull();
    expect(empty.ridesByHour).toHaveLength(24);
  });
});

describe('expanded stats (real-export fields)', () => {
  const trips = [
    trip({ city: 'NYC', productType: 'uberX', fareAmount: 24, distanceMiles: 3.5, durationSeconds: 1680, beginTime: d('2022-10-22T18:00:00Z'), beginTimeLocal: d('2022-10-22T14:00:00Z'), surgeFare: 0, tollAmount: 0, bookingFee: 2.5, serviceFee: 0.5, promotionAmount: 0, paymentType: 'BANK_CARD', isCompleted: true }),
    trip({ city: 'NYC', productType: 'Comfort', fareAmount: 55, distanceMiles: 8, durationSeconds: 2100, beginTime: d('2022-11-05T06:00:00Z'), beginTimeLocal: d('2022-11-05T01:00:00Z'), surgeFare: 18, surgeMultiplier: 1.8, isSurged: true, tollAmount: 4, bookingFee: 2.5, serviceFee: 0.5, promotionAmount: 5, paymentType: 'APPLE_PAY', isCompleted: true }),
    trip({ city: 'Baltimore', productType: 'uberX', fareAmount: 182.72, distanceMiles: 12, durationSeconds: 2400, beginTime: d('2023-01-15T22:00:00Z'), beginTimeLocal: d('2023-01-15T17:00:00Z'), surgeFare: 40, surgeMultiplier: 2.0, isSurged: true, isAirport: true, tollAmount: 6, bookingFee: 2.5, serviceFee: 0.5, paymentType: 'BANK_CARD', isCompleted: true }),
    trip({ city: 'Baltimore', status: 'rider_canceled', isCompleted: false, cancellationFee: 3.5, beginTime: d('2023-02-01T12:00:00Z') }),
    trip({ city: 'DC', productType: 'Black', fareAmount: 90, distanceMiles: 5, durationSeconds: 2520, beginTime: d('2023-03-10T09:00:00Z'), beginTimeLocal: d('2023-03-10T04:00:00Z'), isScheduled: true, promotionAmount: 10, bookingFee: 2.5, serviceFee: 0.5, paymentType: 'BANK_CARD', isCompleted: true }),
  ];
  const completed = trips.filter((t) => t.isCompleted);
  const s = computeStats(trips, completed);

  it('money depth', () => {
    expect(s.totalSpend).toBeCloseTo(351.72, 2);
    expect(s.totalSurgeFare).toBeCloseTo(58, 2);
    expect(s.totalTolls).toBeCloseTo(10, 2);
    expect(s.totalFees).toBeCloseTo(12, 2); // (2.5+0.5)*4
    expect(s.totalSaved).toBeCloseTo(15, 2); // promos 5 + 10
  });

  it('behavior + duration', () => {
    expect(s.surgedRides).toBe(2);
    expect(s.avgSurgeMultiplier).toBeCloseTo(1.9, 2);
    expect(s.airportRides).toBe(1);
    expect(s.scheduledRides).toBe(1);
    expect(s.totalDurationSeconds).toBe(8700);
    expect(s.productMix[0].product).toBe('uberX');
    expect(s.premiumShare).toBeCloseTo(0.5, 2); // Comfort + Black of 4
    expect(s.paymentSplit.find((p) => p.method === 'BANK_CARD')?.count).toBe(3);
  });

  it('cancellations + late-night uses local clock', () => {
    expect(s.riderCanceledRides).toBe(1);
    expect(s.cancellationFeesPaid).toBeCloseTo(3.5, 2);
    expect(s.lateNightRides).toBe(2); // 01:00 and 04:00 local
  });

  it('availability flags reflect present columns', () => {
    expect(s.available.surge).toBe(true);
    expect(s.available.duration).toBe(true);
    expect(s.available.product).toBe(true);
    expect(s.available.payment).toBe(true);
  });

  it('produces the new roasts', () => {
    const roasts = buildRoasts(s);
    expect(roasts.find((r) => r.id === 'money-surge-tax')).toBeDefined();
    expect(roasts.find((r) => r.id === 'time-in-car')).toBeDefined();
    expect(roasts.find((r) => r.id === 'money-saved')).toBeDefined();
  });
});

describe('roasts', () => {
  it('produces 6+ ranked roasts on rich data and no absurd fractions', () => {
    // Big spender: 200 rides, lots of variety.
    const trips: Trip[] = [];
    for (let i = 0; i < 200; i++) {
      const date = new Date(Date.UTC(2023, i % 12, (i % 27) + 1, (i * 7) % 24, 0, 0));
      trips.push(
        trip({
          city: i % 3 === 0 ? 'San Francisco' : i % 3 === 1 ? 'Oakland' : 'New York',
          fareAmount: 250 + (i % 50),
          distanceMiles: 50 + (i % 80),
          beginTime: date,
        }),
      );
    }
    const stats = computeStats(trips, trips);
    const roasts = buildRoasts(stats);
    expect(roasts.length).toBeGreaterThanOrEqual(6);
    // Ranked descending by funScore.
    for (let i = 1; i < roasts.length; i++) {
      expect(roasts[i - 1].funScore).toBeGreaterThanOrEqual(roasts[i].funScore);
    }
    // No "0.x of a thing" purchase/travel headlines.
    const purchase = roasts.find((r) => r.category === 'purchase');
    if (purchase) expect(purchase.value).toBeGreaterThanOrEqual(1);
    const travel = roasts.find((r) => r.category === 'travel');
    if (travel) expect(travel.value).toBeGreaterThanOrEqual(1);
  });

  it('tiny spend ($20) skips big purchases but still has fun facts', () => {
    const t = trip({ city: 'SF', fareAmount: 20, distanceMiles: 3, beginTime: d('2023-05-05T12:00:00Z') });
    const stats = computeStats([t], [t]);
    const roasts = buildRoasts(stats);
    expect(roasts.find((r) => r.category === 'purchase')).toBeUndefined();
    expect(roasts.find((r) => r.category === 'travel')).toBeUndefined();
    expect(roasts.find((r) => r.id === 'food-latte')).toBeDefined();
  });

  it('huge spend ($50k) yields satisfying purchase/travel multiples', () => {
    const trips: Trip[] = [];
    for (let i = 0; i < 100; i++) {
      trips.push(trip({ city: 'SF', fareAmount: 500, distanceMiles: 60, beginTime: new Date(Date.UTC(2023, i % 12, 1)) }));
    }
    const stats = computeStats(trips, trips); // $50,000
    const roasts = buildRoasts(stats);
    const purchase = roasts.find((r) => r.category === 'purchase');
    expect(purchase).toBeDefined();
    expect(purchase!.value).toBeGreaterThanOrEqual(1);
    expect(purchase!.headline.toLowerCase()).toContain('enough uber to buy');
    // A satisfying small integer count, not an absurd one.
    expect(purchase!.value).toBeLessThanOrEqual(12);
  });

  it('empty input yields no roasts and no throw', () => {
    const stats = computeStats([], []);
    expect(buildRoasts(stats)).toEqual([]);
  });
});

describe('toAggregatePayload — privacy boundary', () => {
  it('contains no addresses, coordinates, or raw trips', () => {
    const insights = buildInsights(ALL, COMPLETED);
    const payload = toAggregatePayload(insights);
    const json = JSON.stringify(payload);

    // The distinctive address + coordinate + card values from trip B must NOT leak.
    expect(json).not.toContain('Secret St');
    expect(json).not.toContain('Hidden Ave');
    expect(json).not.toContain('37.123456');
    expect(json).not.toContain('122.654321');
    expect(json).not.toContain('9876'); // cardLast4 must never leave the client

    // No identifying field names (key-level check; allow-list below is the real guard).
    for (const k of Object.keys(payload)) {
      const lk = k.toLowerCase();
      expect(lk.includes('address')).toBe(false);
      expect(lk).not.toMatch(/\b(lat|lng|route|coord|card)\b/);
    }

    // Allow-list of keys only.
    const allowed = new Set([
      'totalSpend', 'currency', 'totalRides', 'totalDistanceMiles', 'dateRangeLabel',
      'topCity', 'distinctCityCount', 'avgFare', 'mostExpensiveFare', 'canceledRides',
      'lateNightRides', 'busiestDayOfWeek', 'favoriteTimeOfDay', 'hoursInCar',
      'totalSurgeFare', 'totalTolls', 'totalSaved', 'airportRides', 'scheduledRides',
      'topProduct', 'comparisons',
    ]);
    for (const k of Object.keys(payload)) expect(allowed.has(k)).toBe(true);
  });

  it('carries sensible aggregate values', () => {
    const payload = toAggregatePayload(buildInsights(ALL, COMPLETED));
    expect(payload.totalSpend).toBe(80);
    expect(payload.totalRides).toBe(4);
    expect(payload.topCity).toBe('San Francisco');
  });
});
