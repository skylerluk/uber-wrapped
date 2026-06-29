// Parse the Uber Eats orders CSV (Eats/user_orders-*.csv) into reconstructed
// orders. Each CSV row is one *item*; an order spans multiple rows that share a
// restaurant + request time. Order_Price repeats on every item row of an order,
// so we must count it exactly once per order.

import Papa from 'papaparse';
import type { EatsItem, EatsOrder } from '../../../types/eats';
import { cleanString, parseMoney, parseNumber, parseUberDate } from '../coerce';

export interface ParseEatsResult {
  orders: EatsOrder[];
  mapping: Record<string, string>;
}

export type ParseEatsOutcome =
  | { ok: true; result: ParseEatsResult }
  | { ok: false; code: 'EMPTY' | 'NO_EATS_COLUMNS'; message: string };

type EatsField =
  | 'city'
  | 'restaurant'
  | 'requestTime'
  | 'deliveryTime'
  | 'status'
  | 'itemName'
  | 'itemQty'
  | 'customizations'
  | 'customizationCost'
  | 'specialInstructions'
  | 'itemPrice'
  | 'orderPrice'
  | 'currency';

const SYNONYMS: Record<EatsField, string[]> = {
  city: ['cityname', 'city'],
  restaurant: ['restaurantname', 'storename', 'merchantname', 'restaurant'],
  requestTime: ['requesttimelocal', 'requesttime', 'ordertime', 'orderdate'],
  deliveryTime: ['finaldeliverytimelocal', 'deliverytime', 'finaldeliverytime', 'dropofftime'],
  status: ['orderstatus', 'status'],
  itemName: ['itemname', 'item', 'productname'],
  itemQty: ['itemquantity', 'quantity', 'qty'],
  customizations: ['customizations', 'customization', 'modifiers'],
  customizationCost: ['customizationcostlocal', 'customizationcost'],
  specialInstructions: ['specialinstructions', 'instructions', 'notes'],
  itemPrice: ['itemprice', 'price'],
  orderPrice: ['orderprice', 'ordertotal', 'total'],
  currency: ['currency', 'currencycode'],
};

function normalize(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectEatsSchema(headers: string[]): Partial<Record<EatsField, string>> {
  const normToOriginal = new Map<string, string>();
  for (const h of headers) {
    const n = normalize(h);
    if (n && !normToOriginal.has(n)) normToOriginal.set(n, h);
  }
  const mapping: Partial<Record<EatsField, string>> = {};
  (Object.keys(SYNONYMS) as EatsField[]).forEach((field) => {
    for (const syn of SYNONYMS[field]) {
      const original = normToOriginal.get(syn);
      if (original && !(field in mapping)) {
        mapping[field] = original;
        return;
      }
    }
  });
  return mapping;
}

export function parseEatsCsv(csvText: string): ParseEatsOutcome {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const headers = parsed.meta.fields ?? [];
  const mapping = detectEatsSchema(headers);

  // We need at minimum a restaurant + an order total to do anything useful.
  if (!mapping.restaurant && !mapping.orderPrice) {
    return {
      ok: false,
      code: 'NO_EATS_COLUMNS',
      message: "This file doesn't look like an Uber Eats orders export.",
    };
  }

  const rows = parsed.data ?? [];
  if (rows.length === 0) {
    return { ok: false, code: 'EMPTY', message: 'This Eats file has no rows.' };
  }

  const get = (row: Record<string, string>, field: EatsField): string | undefined => {
    const header = mapping[field];
    return header ? row[header] : undefined;
  };

  // Group rows into orders. Key on restaurant + raw request-time string so we
  // don't depend on Date parsing succeeding. Fall back to a per-row key when
  // both are missing (treat each such row as its own order).
  const groups = new Map<string, Record<string, string>[]>();
  let orphan = 0;
  for (const row of rows) {
    const restaurant = get(row, 'restaurant') ?? '';
    const reqTime = get(row, 'requestTime') ?? '';
    const key = restaurant || reqTime ? `${restaurant}@@${reqTime}` : `__orphan_${orphan++}`;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }

  const orders: EatsOrder[] = [];
  for (const groupRows of groups.values()) {
    const first = groupRows[0];
    const items: EatsItem[] = groupRows.map((row) => ({
      name: cleanString(get(row, 'itemName')),
      qty: parseNumber(get(row, 'itemQty')) ?? 1,
      price: parseMoney(get(row, 'itemPrice')),
      customizations: cleanString(get(row, 'customizations')),
      customizationCost: parseMoney(get(row, 'customizationCost')),
      specialInstructions: cleanString(get(row, 'specialInstructions')),
    }));

    orders.push({
      restaurant: cleanString(get(first, 'restaurant')),
      city: cleanString(get(first, 'city')),
      requestTime: parseUberDate(get(first, 'requestTime')),
      deliveryTime: parseUberDate(get(first, 'deliveryTime')),
      total: parseMoney(get(first, 'orderPrice')), // counted once per order
      currency: cleanString(get(first, 'currency')),
      status: (cleanString(get(first, 'status')) ?? '').toLowerCase(),
      items,
    });
  }

  return { ok: true, result: { orders, mapping: mapping as Record<string, string> } };
}

/** Is this normalized Eats status a completed order? */
export function isEatsCompleted(status: string): boolean {
  const s = status.toLowerCase();
  return s.includes('complete') || s.includes('delivered') || s.includes('fulfilled');
}

/** Is this a canceled/failed Eats order? */
export function isEatsCanceled(status: string): boolean {
  const s = status.toLowerCase();
  return s.includes('cancel') || s.includes('fail');
}
