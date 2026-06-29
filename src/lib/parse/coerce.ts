// Careful, defensive coercion of raw CSV string cells into typed values.

import type { Trip } from '../../types/trip';

/** Strip currency symbols, thousands separators, and whitespace; parse to float. */
export function parseMoney(raw: unknown): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // Keep digits, dot, and leading minus (refunds can be negative).
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

/** Parse a plain numeric cell (e.g. distance, lat/lng). */
export function parseNumber(raw: unknown): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

/**
 * Parse Uber timestamps robustly. Observed formats include:
 *   "2023-08-14 19:42:00 +0000 UTC"
 *   "2023-08-14 19:42:00 +0000"
 *   "2023-08-14T19:42:00Z"
 *   "08/14/2023 7:42:00 PM"
 * Returns null on anything unparseable.
 */
export function parseUberDate(raw: unknown): Date | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  // Drop a trailing timezone abbreviation word like "UTC" / "GMT" / "PDT".
  s = s.replace(/\s+[A-Za-z]{2,5}$/, '').trim();

  // Native parse first (handles ISO and many locale strings).
  let d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;

  // "YYYY-MM-DD HH:MM:SS +0000" (offset without colon, space-separated).
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*([+-]\d{2}):?(\d{2})$/);
  if (m) {
    d = new Date(`${m[1]}T${m[2]}${m[3]}:${m[4]}`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // No usable offset — take the date+time and assume UTC.
  const m2 = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/);
  if (m2) {
    d = new Date(`${m2[1]}T${m2[2]}Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

/** Trim a string cell to a value or null. */
export function cleanString(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s ? s : null;
}

/** Parse a boolean cell ("true"/"false", "1"/"0", "yes"/"no"). Null if blank/unknown. */
export function parseBool(raw: unknown): boolean | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === '') return null;
  if (s === 'true' || s === '1' || s === 'yes' || s === 't') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'f') return false;
  return null;
}

/** Extract the last 4 digits from a card field; client-side only. */
export function lastFour(raw: unknown): string | null {
  if (raw == null) return null;
  const digits = String(raw).replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
}

/** Is this normalized status a completed/fulfilled ride? */
export function isCompletedStatus(status: string): boolean {
  const s = status.toLowerCase();
  if (s.includes('unfulfilled')) return false;
  return s.includes('complete') || s.includes('fulfilled');
}

/** Is this a canceled ride (any party)? */
export function isCanceledStatus(status: string): boolean {
  return status.toLowerCase().includes('cancel');
}

/** Specifically a rider-initiated cancellation. */
export function isRiderCanceledStatus(status: string): boolean {
  return status.toLowerCase().includes('rider_cancel') || status.toLowerCase().includes('ridercancel');
}

/** Completed? Prefer the `is_completed` boolean; fall back to status string. */
export function isTripCompleted(trip: Trip): boolean {
  if (trip.isCompleted != null) return trip.isCompleted;
  return isCompletedStatus(trip.status);
}
