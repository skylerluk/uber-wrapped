// Parse trips CSV text into typed Trip[] using the detected schema.

import Papa from 'papaparse';
import type { Trip, ParseErrorCode } from '../../types/trip';
import { detectSchema, type CanonicalField } from './schema';
import { cleanString, parseBool, parseMoney, parseNumber, parseUberDate, lastFour } from './coerce';

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

  const trips: Trip[] = rows.map((row) => {
    const beginUtc = parseUberDate(get(row, 'beginTimeUtc'));
    const beginLocal = parseUberDate(get(row, 'beginTimeLocal')) ?? beginUtc;
    return {
      status: (cleanString(get(row, 'status')) ?? '').toLowerCase(),
      isCompleted: parseBool(get(row, 'isCompleted')),
      city: cleanString(get(row, 'city')),
      productType: cleanString(get(row, 'productType')),
      fareAmount: parseMoney(get(row, 'fareAmount')),
      currency: cleanString(get(row, 'fareCurrency')),
      distanceMiles: parseNumber(get(row, 'distanceMiles')),
      durationSeconds: parseNumber(get(row, 'durationSeconds')),
      beginTime: beginUtc,
      beginTimeLocal: beginLocal,
      requestTime: parseUberDate(get(row, 'requestTimeUtc')) ?? parseUberDate(get(row, 'requestTimeLocal')),
      dropoffTime: parseUberDate(get(row, 'dropoffTimeUtc')) ?? parseUberDate(get(row, 'dropoffTimeLocal')),
      timezone: cleanString(get(row, 'timezone')),
      beginAddress: cleanString(get(row, 'beginAddress')),
      dropoffAddress: cleanString(get(row, 'dropoffAddress')),
      beginLat: parseNumber(get(row, 'beginLat')),
      beginLng: parseNumber(get(row, 'beginLng')),
      dropoffLat: parseNumber(get(row, 'dropoffLat')),
      dropoffLng: parseNumber(get(row, 'dropoffLng')),

      surgeMultiplier: parseNumber(get(row, 'surgeMultiplier')),
      isSurged: parseBool(get(row, 'isSurged')),
      isShared: parseBool(get(row, 'isShared')),
      isScheduled: parseBool(get(row, 'isScheduled')),
      isAirport: parseBool(get(row, 'isAirport')),
      isCash: parseBool(get(row, 'isCash')),

      promotionAmount: parseMoney(get(row, 'promotionAmount')),
      creditsAmount: parseMoney(get(row, 'creditsAmount')),
      tollAmount: parseMoney(get(row, 'tollAmount')),
      surgeFare: parseMoney(get(row, 'surgeFare')),
      bookingFee: parseMoney(get(row, 'bookingFee')),
      serviceFee: parseMoney(get(row, 'serviceFee')),
      waitTimeFare: parseMoney(get(row, 'waitTimeFare')),
      cancellationFee: parseMoney(get(row, 'cancellationFee')),
      baseFare: parseMoney(get(row, 'baseFare')),
      perMileFare: parseMoney(get(row, 'perMileFare')),
      perMinuteFare: parseMoney(get(row, 'perMinuteFare')),

      cancellationType: cleanString(get(row, 'cancellationType')),
      paymentType: cleanString(get(row, 'paymentType')),
      cardLast4: lastFour(get(row, 'cardLast4')),
      flow: cleanString(get(row, 'flow')),
    };
  });

  return { ok: true, result: { trips, mapping: mapping as Record<string, string> } };
}
