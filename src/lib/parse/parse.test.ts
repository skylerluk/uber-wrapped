import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { parseTripsCsv } from './parseTrips';
import { detectSchema, normalizeHeader } from './schema';
import { parseMoney, parseUberDate, isCompletedStatus } from './coerce';
import { parseUberExport } from './index';
import { isCanceledStatus } from './coerce';

import { isTripCompleted } from './coerce';
import modernCsv from './__fixtures__/modern.csv?raw';
import legacyCsv from './__fixtures__/legacy.csv?raw';
import messyCsv from './__fixtures__/messy.csv?raw';
import realCsv from './__fixtures__/real.csv?raw';

describe('coerce', () => {
  it('strips currency symbols and thousands separators', () => {
    expect(parseMoney('$18.50')).toBe(18.5);
    expect(parseMoney('£1,000.00')).toBe(1000);
    expect(parseMoney('1,234.50')).toBe(1234.5);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney(undefined)).toBeNull();
    expect(parseMoney('-5.00')).toBe(-5);
  });

  it('parses Uber timestamps in several formats', () => {
    expect(parseUberDate('2023-08-14 19:42:00 +0000 UTC')?.toISOString()).toBe(
      '2023-08-14T19:42:00.000Z',
    );
    expect(parseUberDate('2021-01-05T22:15:00Z')?.toISOString()).toBe(
      '2021-01-05T22:15:00.000Z',
    );
    // +0100 offset -> 08:00Z
    expect(parseUberDate('2022-06-01 09:00:00 +0100 UTC')?.toISOString()).toBe(
      '2022-06-01T08:00:00.000Z',
    );
    expect(parseUberDate('not-a-date')).toBeNull();
    expect(parseUberDate('')).toBeNull();
  });

  it('classifies statuses', () => {
    expect(isCompletedStatus('completed')).toBe(true);
    expect(isCompletedStatus('FULFILLED')).toBe(true);
    expect(isCompletedStatus('unfulfilled')).toBe(false);
    expect(isCompletedStatus('rider_canceled')).toBe(false);
    expect(isCanceledStatus('rider_canceled')).toBe(true);
  });
});

describe('schema detection', () => {
  it('normalizes headers', () => {
    expect(normalizeHeader('Distance (miles)')).toBe('distancemiles');
    expect(normalizeHeader('Trip or Order Status')).toBe('tripororderstatus');
  });

  it('maps modern and legacy headers to canonical fields', () => {
    const modern = detectSchema([
      'City',
      'Trip or Order Status',
      'Begin Trip Time',
      'Distance (miles)',
      'Fare Amount',
      'Fare Currency',
    ]).mapping;
    expect(modern.fareAmount).toBe('Fare Amount');
    expect(modern.status).toBe('Trip or Order Status');
    expect(modern.beginTimeUtc).toBe('Begin Trip Time');

    const legacy = detectSchema(['city', 'Trip Status', 'Pickup Time', 'Distance', 'Fare', 'Currency']).mapping;
    expect(legacy.fareAmount).toBe('Fare');
    expect(legacy.status).toBe('Trip Status');
    expect(legacy.beginTimeUtc).toBe('Pickup Time');
    expect(legacy.distanceMiles).toBe('Distance');
  });

  it('maps the REAL snake_case Uber export headers', () => {
    const m = detectSchema([
      'city_name',
      'product_type_name',
      'status',
      'is_completed',
      'begintrip_timestamp_utc',
      'begintrip_timestamp_local',
      'trip_distance_miles',
      'trip_duration_seconds',
      'fare_amount',
      'currency_code',
      'surge_fare_local',
      'toll_amount_local',
      'profile_type',
      'card_number',
    ]).mapping;
    // previously-unmapped fields now resolve:
    expect(m.city).toBe('city_name');
    expect(m.productType).toBe('product_type_name');
    expect(m.distanceMiles).toBe('trip_distance_miles');
    expect(m.durationSeconds).toBe('trip_duration_seconds');
    expect(m.beginTimeUtc).toBe('begintrip_timestamp_utc');
    expect(m.beginTimeLocal).toBe('begintrip_timestamp_local');
    expect(m.isCompleted).toBe('is_completed');
    expect(m.fareAmount).toBe('fare_amount');
    expect(m.fareCurrency).toBe('currency_code');
    expect(m.surgeFare).toBe('surge_fare_local');
    expect(m.tollAmount).toBe('toll_amount_local');
    expect(m.paymentType).toBe('profile_type');
    expect(m.cardLast4).toBe('card_number');
  });
});

describe('real export parsing', () => {
  it('parses snake_case rows; is_completed drives completion', () => {
    const out = parseTripsCsv(realCsv);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const { trips } = out.result;
    expect(trips).toHaveLength(5);

    const completed = trips.filter(isTripCompleted);
    expect(completed).toHaveLength(4); // 4 is_completed=true, 1 rider_canceled

    // previously-empty fields now populated:
    expect(completed.every((t) => t.city != null)).toBe(true);
    expect(completed.every((t) => t.beginTime != null)).toBe(true);
    expect(completed.every((t) => t.distanceMiles != null)).toBe(true);

    const spend = completed.reduce((s, t) => s + (t.fareAmount ?? 0), 0);
    expect(spend).toBeCloseTo(351.72, 2);

    // local wall-clock differs from UTC (used for time-of-day stats)
    const first = trips[0];
    expect(first.beginTime?.getUTCHours()).toBe(18);
    expect(first.beginTimeLocal?.getUTCHours()).toBe(14);

    // card is reduced to last 4, client-side only
    expect(first.cardLast4).toBe('9876');
  });
});

describe('parseTripsCsv', () => {
  it('parses modern export and reads fares', () => {
    const out = parseTripsCsv(modernCsv);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const { trips } = out.result;
    expect(trips).toHaveLength(3);
    const completed = trips.filter((t) => isCompletedStatus(t.status));
    expect(completed).toHaveLength(2);
    const spend = completed.reduce((s, t) => s + (t.fareAmount ?? 0), 0);
    expect(spend).toBeCloseTo(42.5, 2);
  });

  it('handles legacy headers and comma-in-fare', () => {
    const out = parseTripsCsv(legacyCsv);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const completed = out.result.trips.filter((t) => isCompletedStatus(t.status));
    const spend = completed.reduce((s, t) => s + (t.fareAmount ?? 0), 0);
    expect(spend).toBeCloseTo(1244.49, 2);
  });

  it('handles messy data: symbols, blank fare, bad date, unfulfilled', () => {
    const out = parseTripsCsv(messyCsv);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const { trips } = out.result;
    const completed = trips.filter((t) => isCompletedStatus(t.status));
    expect(completed).toHaveLength(3); // unfulfilled excluded
    const spend = completed.reduce((s, t) => s + (t.fareAmount ?? 0), 0);
    expect(spend).toBeCloseTo(1012.3, 2);
    const nullFares = completed.filter((t) => t.fareAmount == null);
    expect(nullFares).toHaveLength(1);
    const badDate = completed.find((t) => t.fareAmount == null);
    expect(badDate?.beginTime).toBeNull();
  });

  it('returns NO_FARE_COLUMN when fare is missing', () => {
    const out = parseTripsCsv('City,Status\nSF,completed\n');
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.code).toBe('NO_FARE_COLUMN');
  });
});

describe('parseUberExport (full pipeline)', () => {
  async function makeZip(files: Record<string, string>): Promise<ArrayBuffer> {
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) zip.file(path, content);
    return zip.generateAsync({ type: 'arraybuffer' });
  }

  it('unzips, finds the trips CSV, and produces a correct summary', async () => {
    const buf = await makeZip({
      'Uber Data/Rider/trips_data.csv': modernCsv,
      'Uber Data/Rider/readme.txt': 'hello',
    });
    const out = await parseUberExport(buf);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.summary.completedRows).toBe(2);
    expect(out.result.summary.totalSpend).toBeCloseTo(42.5, 2);
    expect(out.result.summary.currency).toBe('USD');
    expect(out.result.summary.canceledRows).toBe(1);
    expect(out.result.summary.sourceFile).toContain('trips_data.csv');
  });

  it('prefers the Rider trips file over a driver one', async () => {
    const buf = await makeZip({
      'Driver/driver_trips.csv': 'City,Fare Amount\nSF,999\n',
      'Rider/trips_data.csv': modernCsv,
    });
    const out = await parseUberExport(buf);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.summary.sourceFile).toContain('Rider/trips_data.csv');
  });

  it('errors clearly when no trips CSV is present', async () => {
    const buf = await makeZip({ 'Account/profile.csv': 'name\nAda\n' });
    const out = await parseUberExport(buf);
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.code).toBe('NO_TRIPS_FILE');
  });

  it('errors clearly on a non-zip buffer', async () => {
    const out = await parseUberExport(new TextEncoder().encode('not a zip').buffer);
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.code).toBe('CORRUPT_ZIP');
  });
});
