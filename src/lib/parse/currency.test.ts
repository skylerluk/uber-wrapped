import { describe, it, expect } from 'vitest';
import {
  normalizeToUsd,
  deriveRatesFromTrips,
  rateToUsd,
  distinctCurrencies,
  STATIC_RATES_TO_USD,
} from './currency';
import type { Trip } from '../../types/trip';
import type { EatsOrder } from '../../types/eats';

function trip(over: Partial<Trip> = {}): Trip {
  return {
    status: 'completed',
    isCompleted: true,
    city: 'X',
    productType: 'UberX',
    fareAmount: 50,
    currency: 'USD',
    distanceMiles: 5,
    durationSeconds: 600,
    beginTime: new Date('2025-01-01T12:00:00Z'),
    beginTimeLocal: new Date('2025-01-01T12:00:00Z'),
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
    originalFareLocal: null,
    originalFareUsd: null,
    cancellationType: null,
    paymentType: null,
    cardLast4: null,
    flow: null,
    ...over,
  };
}

function order(over: Partial<EatsOrder> = {}): EatsOrder {
  return {
    restaurant: 'Cafe',
    city: 'X',
    requestTime: new Date('2025-01-02T12:00:00Z'),
    deliveryTime: null,
    total: 20,
    currency: 'USD',
    status: 'completed',
    items: [{ name: 'Thing', qty: 1, price: 20, customizations: null, customizationCost: 1, specialInstructions: null }],
    ...over,
  };
}

describe('currency rate derivation', () => {
  it('derives the exact FX rate from Uber local↔usd fare pairs', () => {
    const trips = [
      trip({ currency: 'EUR', originalFareLocal: 100, originalFareUsd: 108 }),
      trip({ currency: 'EUR', originalFareLocal: 50, originalFareUsd: 54 }),
    ];
    const rates = deriveRatesFromTrips(trips);
    expect(rates.get('EUR')).toBeCloseTo(1.08, 4);
  });

  it('prefers derived rate, falls back to static, then 1', () => {
    const derived = new Map([['EUR', 1.08]]);
    expect(rateToUsd('EUR', derived)).toBe(1.08);
    expect(rateToUsd('GBP', derived)).toBe(STATIC_RATES_TO_USD.GBP);
    expect(rateToUsd('USD', derived)).toBe(1);
    expect(rateToUsd('XYZ', derived)).toBe(1); // unknown → assume already USD
  });
});

describe('single-currency export', () => {
  it('is left untouched (no conversion, no approximation)', () => {
    const trips = [trip({ currency: 'EUR', fareAmount: 30 }), trip({ currency: 'EUR', fareAmount: 70 })];
    const res = normalizeToUsd(trips, trips, []);
    expect(res.converted).toBe(false);
    expect(res.completedTrips[0].currency).toBe('EUR');
    expect(res.completedTrips.reduce((s, t) => s + (t.fareAmount ?? 0), 0)).toBe(100);
  });
});

describe('mixed-currency export → normalized to USD (no inflation)', () => {
  // $50 USD + €50 EUR (rate 1.08 from its fare pair) = $50 + $54 = $104.
  const trips = [
    trip({ currency: 'USD', fareAmount: 50 }),
    trip({ currency: 'EUR', fareAmount: 50, originalFareLocal: 100, originalFareUsd: 108, surgeFare: 10 }),
  ];
  // A GBP Eats order converts via the static table.
  const orders = [order({ currency: 'USD', total: 20 }), order({ currency: 'GBP', total: 100 })];

  const res = normalizeToUsd(trips, trips, orders);

  it('flags conversion and reports the currencies seen', () => {
    expect(res.converted).toBe(true);
    expect(new Set(res.currencies)).toEqual(new Set(['USD', 'EUR', 'GBP']));
  });

  it('converts every trip to USD using the exact derived rate', () => {
    const total = res.completedTrips.reduce((s, t) => s + (t.fareAmount ?? 0), 0);
    expect(total).toBeCloseTo(104, 2); // NOT the inflated 100
    expect(res.completedTrips.every((t) => t.currency === 'USD')).toBe(true);
    const eur = res.completedTrips.find((t) => (t.fareAmount ?? 0) > 50)!;
    expect(eur.fareAmount).toBeCloseTo(54, 2);
    expect(eur.surgeFare).toBeCloseTo(10.8, 2); // components convert too
  });

  it('converts Eats orders (local-only) via the static table', () => {
    const gbp = res.eatsOrders.find((o) => o.total != null && o.total > 100)!;
    expect(gbp.total).toBeCloseTo(100 * STATIC_RATES_TO_USD.GBP, 2);
    expect(gbp.currency).toBe('USD');
    expect(gbp.items[0].price).toBeCloseTo(20 * STATIC_RATES_TO_USD.GBP, 2);
  });
});

describe('distinctCurrencies', () => {
  it('only counts rows that carry spend', () => {
    const trips = [trip({ currency: 'USD', fareAmount: 10 }), trip({ currency: 'EUR', fareAmount: 0 })];
    expect(distinctCurrencies(trips, [])).toEqual(new Set(['USD']));
  });
});
