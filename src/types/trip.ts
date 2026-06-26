// Typed model for a single Uber trip plus the parse-pipeline result types.

export interface Trip {
  /** Original status string, lowercased (e.g. "completed", "canceled"). */
  status: string;
  city: string | null;
  productType: string | null;
  fareAmount: number | null;
  currency: string | null;
  distanceMiles: number | null;
  requestTime: Date | null;
  beginTime: Date | null;
  dropoffTime: Date | null;
  beginAddress: string | null;
  dropoffAddress: string | null;
  beginLat: number | null;
  beginLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
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
