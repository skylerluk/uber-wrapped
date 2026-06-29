// Multi-currency normalization. A single Uber export can span countries (a move
// abroad, travel, a work trip), and each row's money is in that region's local
// currency. Summing them raw would inflate the total (₹1,000 + $50 ≠ $1,050).
//
// Strategy: when an export contains MORE THAN ONE currency, convert every
// monetary value to USD. Rides carry Uber's own USD equivalent of the fare
// (original_fare_usd), so we derive the EXACT historical FX rate per currency
// from local↔usd ratios; Eats (local-only) and any unseen currency fall back to
// an approximate static table. Single-currency exports are left untouched (no
// inflation risk, no approximation error).

import type { Trip } from '../../types/trip';
import type { EatsOrder } from '../../types/eats';
import { isEatsCompleted } from './eats/parseEats';

/** Approximate currency→USD multipliers (fallback only). */
export const STATIC_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.66,
  NZD: 0.61,
  CHF: 1.12,
  SEK: 0.095,
  NOK: 0.092,
  DKK: 0.145,
  PLN: 0.25,
  CZK: 0.043,
  HUF: 0.0028,
  RON: 0.22,
  INR: 0.012,
  PKR: 0.0036,
  BDT: 0.0085,
  LKR: 0.0033,
  JPY: 0.0067,
  CNY: 0.14,
  HKD: 0.128,
  TWD: 0.031,
  KRW: 0.00073,
  SGD: 0.74,
  MYR: 0.22,
  THB: 0.028,
  IDR: 0.000063,
  PHP: 0.0175,
  VND: 0.00004,
  AED: 0.272,
  SAR: 0.267,
  QAR: 0.275,
  ILS: 0.27,
  TRY: 0.029,
  EGP: 0.021,
  ZAR: 0.055,
  NGN: 0.00065,
  KES: 0.0077,
  MXN: 0.058,
  BRL: 0.18,
  ARS: 0.001,
  CLP: 0.00105,
  COP: 0.00025,
  PEN: 0.27,
  UYU: 0.025,
};

function median(nums: number[]): number {
  if (nums.length === 0) return NaN;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function norm(currency: string | null | undefined): string | null {
  const c = currency?.trim().toUpperCase();
  return c ? c : null;
}

/** Per-currency exact FX rate derived from Uber's local↔usd fare pairs. */
export function deriveRatesFromTrips(trips: Trip[]): Map<string, number> {
  const ratios = new Map<string, number[]>();
  for (const t of trips) {
    const cur = norm(t.currency);
    if (!cur) continue;
    const local = t.originalFareLocal;
    const usd = t.originalFareUsd;
    if (local != null && usd != null && local > 0 && usd > 0) {
      const r = usd / local;
      if (Number.isFinite(r) && r > 0) {
        const arr = ratios.get(cur);
        if (arr) arr.push(r);
        else ratios.set(cur, [r]);
      }
    }
  }
  const out = new Map<string, number>();
  for (const [cur, rs] of ratios) out.set(cur, median(rs));
  return out;
}

/** Resolve a currency→USD rate: derived (exact) → static (approx) → 1. */
export function rateToUsd(currency: string | null, derived: Map<string, number>): number {
  const c = norm(currency);
  if (!c || c === 'USD') return 1;
  const d = derived.get(c);
  if (d != null && Number.isFinite(d) && d > 0) return d;
  return STATIC_RATES_TO_USD[c] ?? 1;
}

/** Distinct currencies that actually carry spend (completed trips + orders). */
export function distinctCurrencies(completedTrips: Trip[], completedOrders: EatsOrder[]): Set<string> {
  const set = new Set<string>();
  for (const t of completedTrips) {
    const c = norm(t.currency);
    if (c && (t.fareAmount ?? 0) !== 0) set.add(c);
  }
  for (const o of completedOrders) {
    const c = norm(o.currency);
    if (c && (o.total ?? 0) !== 0) set.add(c);
  }
  return set;
}

const TRIP_MONEY_FIELDS = [
  'fareAmount',
  'promotionAmount',
  'creditsAmount',
  'tollAmount',
  'surgeFare',
  'bookingFee',
  'serviceFee',
  'waitTimeFare',
  'cancellationFee',
  'baseFare',
  'perMileFare',
  'perMinuteFare',
  'originalFareLocal',
] as const;

function convertTrip(trip: Trip, rate: number): Trip {
  if (rate === 1) return { ...trip, currency: 'USD' };
  const out: Trip = { ...trip, currency: 'USD' };
  for (const f of TRIP_MONEY_FIELDS) {
    const v = out[f];
    if (v != null) out[f] = v * rate;
  }
  // originalFareUsd is already USD; leave it.
  return out;
}

function convertOrder(order: EatsOrder, rate: number): EatsOrder {
  if (rate === 1) return { ...order, currency: 'USD' };
  return {
    ...order,
    currency: 'USD',
    total: order.total != null ? order.total * rate : order.total,
    items: order.items.map((it) => ({
      ...it,
      price: it.price != null ? it.price * rate : it.price,
      customizationCost: it.customizationCost != null ? it.customizationCost * rate : it.customizationCost,
    })),
  };
}

export interface NormalizeResult {
  allTrips: Trip[];
  completedTrips: Trip[];
  eatsOrders: EatsOrder[];
  /** True when conversion happened (i.e. >1 currency was present). */
  converted: boolean;
  /** All currencies seen across spend. */
  currencies: string[];
}

/**
 * Normalize a mixed-currency export to USD. No-op (returns inputs) when the
 * export uses a single currency — that already can't be inflated, and skipping
 * conversion avoids any FX approximation error.
 */
export function normalizeToUsd(
  allTrips: Trip[],
  completedTrips: Trip[],
  eatsOrders: EatsOrder[],
): NormalizeResult {
  const completedOrders = eatsOrders.filter((o) => isEatsCompleted(o.status));
  const currencies = distinctCurrencies(completedTrips, completedOrders);

  if (currencies.size <= 1) {
    return { allTrips, completedTrips, eatsOrders, converted: false, currencies: [...currencies] };
  }

  const derived = deriveRatesFromTrips(allTrips);
  const convertedAll = allTrips.map((t) => convertTrip(t, rateToUsd(t.currency, derived)));
  // Re-derive completed from the converted set so references stay identical.
  const completedSet = new Set(completedTrips);
  const convertedCompleted = allTrips
    .map((t, i) => (completedSet.has(t) ? convertedAll[i] : null))
    .filter((t): t is Trip => t !== null);
  const convertedOrders = eatsOrders.map((o) => convertOrder(o, rateToUsd(o.currency, derived)));

  return {
    allTrips: convertedAll,
    completedTrips: convertedCompleted,
    eatsOrders: convertedOrders,
    converted: true,
    currencies: [...currencies],
  };
}
