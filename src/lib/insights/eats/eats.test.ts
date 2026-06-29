import { describe, it, expect } from 'vitest';
import { parseEatsCsv, isEatsCompleted, isEatsCanceled } from '../../parse/eats/parseEats';
import { computeEatsInsights } from './computeEats';
import { buildEatsSignals } from './roastSignals';
import { computeCombined, buildCombinedSignals } from '../combined';
import { buildInsights, toAggregatePayload } from '../index';
import type { Trip } from '../../../types/trip';
import type { Reputation } from '../../../types/eats';

// Real header from Eats/user_orders-*.csv. Two multi-item orders (Order_Price
// repeats per item row and must be counted once), one single-item order, and a
// canceled order.
const EATS_CSV = `City_Name,Restaurant_Name,Request_Time_Local,Final_Delivery_Time_Local,Order_Status,Item_Name,Item_quantity,Customizations,Customization_Cost_Local,Special_Instructions,Item_Price,Order_Price,Currency
New York City,Tasty Udon,2025-06-22T12:21:41.000Z,2025-06-22T13:04:17.000Z,completed,Chicken Udon,1,Soft Tofu,3.0,"Leave at door",20.0,23.89,USD
New York City,Ootoya,2025-06-21T18:30:58.000Z,2025-06-21T18:59:34.000Z,completed,Oyako Don,1,Large Rice,2.0,"",24.0,34.36,USD
New York City,Ootoya,2025-06-21T18:30:58.000Z,2025-06-21T18:59:34.000Z,completed,Oyako Don,1,Need Utensils,0.0,"",24.0,34.36,USD
New York City,Ootoya,2025-06-21T01:30:58.000Z,2025-06-21T01:55:00.000Z,completed,Late Ramen,2,Extra Egg,1.5,"Ring twice",12.0,28.50,USD
New York City,Sad Diner,2024-02-01T19:00:00.000Z,,canceled,Burger,1,"",0.0,"",10.0,10.00,USD`;

describe('Eats order reconstruction', () => {
  const parsed = parseEatsCsv(EATS_CSV);
  if (!parsed.ok) throw new Error('parse failed');
  const orders = parsed.result.orders;

  it('groups item rows into orders by restaurant + request time', () => {
    // 4 distinct (restaurant, time) groups: Tasty Udon, Ootoya x2 (different
    // times), Sad Diner.
    expect(orders.length).toBe(4);
    const ootoyaDinner = orders.find(
      (o) => o.restaurant === 'Ootoya' && o.items.length === 2,
    );
    expect(ootoyaDinner).toBeTruthy();
    expect(ootoyaDinner!.items.map((i) => i.customizations)).toEqual([
      'Large Rice',
      'Need Utensils',
    ]);
  });

  it('counts Order_Price once per order (not per item row)', () => {
    const completed = orders.filter((o) => isEatsCompleted(o.status));
    const eats = computeEatsInsights(completed, orders.filter((o) => isEatsCanceled(o.status)).length);
    // 23.89 + 34.36 + 28.50 = 86.75
    expect(eats.totalSpend).toBeCloseTo(86.75, 2);
    expect(eats.orderCount).toBe(3);
    expect(eats.canceledOrders).toBe(1);
  });

  it('computes favorites, late-night, and customization spend', () => {
    const completed = orders.filter((o) => isEatsCompleted(o.status));
    const eats = computeEatsInsights(completed);
    expect(eats.loyalty?.restaurant).toBe('Ootoya');
    expect(eats.lateNightOrders).toBe(1); // the 01:30 Late Ramen order
    // customization costs: 3.0 + 2.0 + 0.0 + 1.5(x... per row, qty not applied) = 6.5
    expect(eats.totalCustomizationSpend).toBeCloseTo(6.5, 2);
    expect(eats.ordersWithInstructions).toBe(2); // "Leave at door" + "Ring twice"
  });
});

describe('combined rides + eats', () => {
  const parsed = parseEatsCsv(EATS_CSV);
  if (!parsed.ok) throw new Error('parse failed');
  const completed = parsed.result.orders.filter((o) => isEatsCompleted(o.status));
  const eats = computeEatsInsights(completed);

  it('handles eats-only (no rides) gracefully', () => {
    const combined = computeCombined(null, eats);
    expect(combined.hasRides).toBe(false);
    expect(combined.hasEats).toBe(true);
    expect(combined.totalToUber).toBeCloseTo(86.75, 2);
    expect(combined.foodVsRidesPct).toBeNull();
  });

  it('builds signals with restaurant/item text (non-PII) only', () => {
    const sig = buildEatsSignals(eats);
    expect(sig.topRestaurant?.name).toBe('Ootoya');
    expect(sig.orders).toBe(3);
    const cSig = buildCombinedSignals(null, eats);
    expect(cSig.eats).toBeTruthy();
    expect(cSig.rides).toBeNull();
  });
});

// A trip with addresses/coords that must NEVER leave the client.
function fakeTrip(over: Partial<Trip> = {}): Trip {
  return {
    status: 'completed',
    isCompleted: true,
    city: 'New York',
    productType: 'UberX',
    fareAmount: 25,
    currency: 'USD',
    distanceMiles: 5,
    durationSeconds: 900,
    beginTime: new Date('2025-03-01T15:00:00Z'),
    beginTimeLocal: new Date('2025-03-01T15:00:00Z'),
    requestTime: new Date('2025-03-01T14:55:00Z'),
    dropoffTime: new Date('2025-03-01T15:15:00Z'),
    timezone: 'America/New_York',
    beginAddress: '1600 Pennsylvania Ave NW',
    dropoffAddress: '350 Fifth Avenue',
    beginLat: 38.8977,
    beginLng: -77.0365,
    dropoffLat: 40.7484,
    dropoffLng: -73.9857,
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
    cardLast4: '4242',
    flow: null,
    ...over,
  };
}

describe('privacy boundary (rides + eats payload)', () => {
  // Includes a short-paid-walk trip (0.46 mi / $13.90) whose addresses must
  // surface in the client-side roast but NEVER in the payload.
  const trips = [
    fakeTrip(),
    fakeTrip({ beginTime: new Date('2025-04-02T03:00:00Z'), beginTimeLocal: new Date('2025-04-02T03:00:00Z') }),
    fakeTrip({
      fareAmount: 13.9,
      distanceMiles: 0.46,
      beginAddress: '742 Evergreen Terrace',
      dropoffAddress: '31 Spooner Street',
      beginTime: new Date('2025-05-01T18:00:00Z'),
      beginTimeLocal: new Date('2025-05-01T18:00:00Z'),
    }),
  ];
  const parsed = parseEatsCsv(EATS_CSV);
  if (!parsed.ok) throw new Error('parse failed');
  const reputation: Reputation = {
    rating: 4.7,
    distribution: [{ stars: 5, count: 357 }],
    oneStar: 22,
    totalRatings: 404,
  };

  const insights = buildInsights(trips, trips, { kind: 'all' }, {
    eatsOrders: parsed.result.orders,
    reputation,
  });
  const payload = toAggregatePayload(insights, reputation);
  const json = JSON.stringify(payload);

  it('includes the combined signals + rating', () => {
    expect(payload.combined).toBeTruthy();
    expect(payload.combined!.hasEats).toBe(true);
    expect(payload.combined!.hasRides).toBe(true);
    expect(payload.rating).toBe(4.7);
  });

  it('generates the signature 1-star + short-paid-walk roasts (client-side)', () => {
    const ids = insights.roasts.map((r) => r.id);
    expect(ids).toContain('rides-rating-onestar');
    expect(ids).toContain('rides-short-paid-walk');
    const walk = insights.roasts.find((r) => r.id === 'rides-short-paid-walk')!;
    // The address IS allowed in the client-side roast copy.
    expect(walk.sub).toContain('Evergreen Terrace');
  });

  it('never leaks addresses, coordinates, or card data into the payload', () => {
    expect(json).not.toContain('Pennsylvania');
    expect(json).not.toContain('Fifth Avenue');
    expect(json).not.toContain('Evergreen Terrace'); // short-walk addresses
    expect(json).not.toContain('Spooner Street');
    expect(json).not.toContain('4242');
    expect(json).not.toMatch(/-?\d{1,3}\.\d{4,}/); // coordinate-like
    // No raw ratings distribution / one-star counts (only the rating number).
    expect(json).not.toContain('357');
    expect(json).not.toContain('totalRatings');
  });
});
