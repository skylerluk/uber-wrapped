// Typed model for a single Uber trip plus the parse-pipeline result types.

export interface Trip {
  /** Original status string, lowercased (e.g. "completed", "rider_canceled"). */
  status: string;
  /** `is_completed` boolean when present — the source of truth for completion. */
  isCompleted: boolean | null;
  city: string | null;
  productType: string | null;
  fareAmount: number | null;
  currency: string | null;
  distanceMiles: number | null;
  durationSeconds: number | null;
  /** UTC instant — use for ordering, date range, month/year buckets. */
  beginTime: Date | null;
  /** Local wall-clock — use for hour-of-day / day-of-week stats. */
  beginTimeLocal: Date | null;
  requestTime: Date | null;
  dropoffTime: Date | null;
  timezone: string | null;
  beginAddress: string | null;
  dropoffAddress: string | null;
  beginLat: number | null;
  beginLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;

  // Behavior flags
  surgeMultiplier: number | null;
  isSurged: boolean | null;
  isShared: boolean | null;
  isScheduled: boolean | null;
  isAirport: boolean | null;
  isCash: boolean | null;

  // Money components (in `currency` units when from *_local columns)
  promotionAmount: number | null;
  creditsAmount: number | null;
  tollAmount: number | null;
  surgeFare: number | null;
  bookingFee: number | null;
  serviceFee: number | null;
  waitTimeFare: number | null;
  cancellationFee: number | null;
  baseFare: number | null;
  perMileFare: number | null;
  perMinuteFare: number | null;

  cancellationType: string | null;
  /** Payment method (e.g. BANK_CARD / APPLE_PAY) — from profile_type. */
  paymentType: string | null;
  /** Last 4 of the card — CLIENT-SIDE ONLY, never sent to the backend. */
  cardLast4: string | null;
  flow: string | null;
}

export interface ParseSummary {
  /** canonical field -> the original CSV header it was matched from. */
  mapping: Record<string, string>;
  totalRows: number;
  completedRows: number;
  canceledRows: number;
  /** Sum of completed fareAmount. */
  totalSpend: number;
  currency: string | null;
  dateRange: { earliest: Date | null; latest: Date | null };
  distinctCities: number;
  topCities: { city: string; count: number }[];
  /** Rows where fareAmount could not be parsed (data-quality signal). */
  nullFareCount: number;
  /** File name of the CSV we parsed, for transparency. */
  sourceFile: string;
}

export interface ParseResult {
  allTrips: Trip[];
  completedTrips: Trip[];
  summary: ParseSummary;
}

export type ParseErrorCode =
  | 'NOT_A_ZIP'
  | 'CORRUPT_ZIP'
  | 'NO_TRIPS_FILE'
  | 'NO_FARE_COLUMN'
  | 'EMPTY'
  | 'UNKNOWN';

export type ParseOutcome =
  | { ok: true; result: ParseResult }
  | { ok: false; code: ParseErrorCode; message: string };
