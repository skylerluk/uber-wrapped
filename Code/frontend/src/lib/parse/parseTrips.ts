// Parse trips CSV text into typed Trip[] using the detected schema.

import Papa from 'papaparse';
import type { Trip, ParseErrorCode } from '../../types/trip';
import { detectSchema, type CanonicalField } from './schema';
import {
  cleanString,
  parseMoney,
  parseNumber,
  parseUberDate,
} from './coerce';

export interface ParseTripsResult {
  trips: Trip[];
  mapping: Record<string, string>;
}

export type ParseTripsOutcome =
  | { ok: true; result: ParseTripsResult }
  | { ok: false; code: Extract<ParseErrorCode, 'EMPTY' | 'NO_FARE_COLUMN'>; message: string };

export function parseTripsCsv(csvText: string): ParseTripsOutcome {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const headers = parsed.meta.fields ?? [];
  const { mapping } = detectSchema(headers);

  if (!mapping.fareAmount) {
    return {
      ok: false,
      code: 'NO_FARE_COLUMN',
      message:
        "This export doesn't include fare data, so we can't tally your spending. Try re-downloading the trips data from Uber's Privacy Center.",
    };
  }

  const rows = parsed.data ?? [];
  if (rows.length === 0) {
    return { ok: false, code: 'EMPTY', message: 'This trips file has no rows.' };
  }

  const get = (row: Record<string, string>, field: CanonicalField): string | undefined => {
    const header = mapping[field];
    return header ? row[header] : undefined;
  };

  const trips: Trip[] = rows.map((row) => ({
    status: (cleanString(get(row, 'status')) ?? '').toLowerCase(),
    city: cleanString(get(row, 'city')),
    productType: cleanString(get(row, 'productType')),
    fareAmount: parseMoney(get(row, 'fareAmount')),
    currency: cleanString(get(row, 'fareCurrency')),
    distanceMiles: parseNumber(get(row, 'distanceMiles')),
    requestTime: parseUberDate(get(row, 'requestTime')),
    beginTime: parseUberDate(get(row, 'beginTime')),
    dropoffTime: parseUberDate(get(row, 'dropoffTime')),
    beginAddress: cleanString(get(row, 'beginAddress')),
    dropoffAddress: cleanString(get(row, 'dropoffAddress')),
    beginLat: parseNumber(get(row, 'beginLat')),
    beginLng: parseNumber(get(row, 'beginLng')),
    dropoffLat: parseNumber(get(row, 'dropoffLat')),
    dropoffLng: parseNumber(get(row, 'dropoffLng')),
  }));

  return { ok: true, result: { trips, mapping: mapping as Record<string, string> } };
}
