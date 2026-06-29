// Schema-detection layer. Uber's CSV headers drift across years and locales, so
// we never hardcode exact header strings — we normalize each header and match it
// against a synonym table to a canonical field name.
//
// The REAL rider export (Rider/trips_data-0.csv) uses snake_case headers, so
// those are the PRIMARY synonyms; older/guessed names are kept as fallbacks.

export type CanonicalField =
  | 'city'
  | 'productType'
  | 'status'
  | 'isCompleted'
  | 'timezone'
  // timestamps: UTC (for ordering/date-range) + local wall-clock (for time-of-day)
  | 'requestTimeUtc'
  | 'requestTimeLocal'
  | 'beginTimeUtc'
  | 'beginTimeLocal'
  | 'dropoffTimeUtc'
  | 'dropoffTimeLocal'
  | 'beginAddress'
  | 'dropoffAddress'
  | 'distanceMiles'
  | 'durationSeconds'
  | 'fareAmount'
  | 'fareCurrency'
  | 'beginLat'
  | 'beginLng'
  | 'dropoffLat'
  | 'dropoffLng'
  // booleans
  | 'surgeMultiplier'
  | 'isSurged'
  | 'isShared'
  | 'isScheduled'
  | 'isAirport'
  | 'isCash'
  // money components (prefer *_local which is in currency_code; *_usd fallback)
  | 'promotionAmount'
  | 'creditsAmount'
  | 'tollAmount'
  | 'surgeFare'
  | 'bookingFee'
  | 'serviceFee'
  | 'waitTimeFare'
  | 'cancellationFee'
  | 'baseFare'
  | 'perMileFare'
  | 'perMinuteFare'
  // fare in local + USD (their ratio = exact historical FX rate)
  | 'originalFareLocal'
  | 'originalFareUsd'
  // misc
  | 'cancellationType'
  | 'paymentType'
  | 'cardLast4'
  | 'flow';

/** Lowercase and strip everything that isn't a letter or digit. */
export function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Synonyms listed already-normalized. First column to satisfy a canonical's
// synonyms claims it; a canonical is never overwritten once mapped.
const SYNONYMS: Record<CanonicalField, string[]> = {
  city: ['cityname', 'city'],
  productType: ['producttypename', 'globalproductname', 'producttype', 'vehicletype', 'product'],
  status: ['status', 'tripororderstatus', 'triporderstatus', 'tripstatus', 'orderstatus'],
  isCompleted: ['iscompleted'],
  timezone: ['timezone'],

  requestTimeUtc: ['requesttimestamputc', 'requesttimeutc', 'requesttime', 'requestat'],
  requestTimeLocal: ['requesttimestamplocal', 'requesttimelocal'],
  beginTimeUtc: ['begintriptimestamputc', 'begintriptimeutc', 'begintriptime', 'begintimeutc', 'begintime', 'pickuptime', 'tripstarttime'],
  beginTimeLocal: ['begintriptimestamplocal', 'begintimelocal'],
  dropoffTimeUtc: ['dropofftimestamputc', 'dropofftimeutc', 'dropofftime', 'endtime', 'tripendtime'],
  dropoffTimeLocal: ['dropofftimestamplocal', 'dropofftimelocal'],

  beginAddress: ['begintripaddress', 'pickupaddress', 'beginaddress'],
  dropoffAddress: ['dropoffaddress', 'dropaddress', 'endaddress'],
  distanceMiles: ['tripdistancemiles', 'distancemiles', 'distancemi', 'tripdistance', 'distance'],
  durationSeconds: ['tripdurationseconds', 'durationseconds', 'tripduration'],
  fareAmount: ['fareamount', 'fare', 'amount', 'totalfare', 'total', 'price'],
  fareCurrency: ['currencycode', 'farecurrency', 'currency'],

  beginLat: ['begintriplat', 'pickuplat', 'beginlat', 'startlat'],
  beginLng: ['begintriplng', 'begintriplon', 'pickuplng', 'beginlng', 'startlng'],
  dropoffLat: ['dropofflat', 'destinationlat', 'endlat'],
  dropoffLng: ['dropofflng', 'destinationlng', 'dropofflon', 'endlng'],

  surgeMultiplier: ['surgemultiplier'],
  isSurged: ['issurged'],
  isShared: ['ispoolmatched', 'isshared'],
  isScheduled: ['isscheduledtrip', 'isscheduled'],
  isAirport: ['isairporttrip', 'isairport'],
  isCash: ['iscashtrip', 'iscash'],

  promotionAmount: ['promotionlocal', 'promotionusd', 'promotion'],
  creditsAmount: ['creditslocal', 'creditsusd', 'credits'],
  tollAmount: ['tollamountlocal', 'tollamountusd', 'tollamount', 'toll'],
  surgeFare: ['surgefarelocal', 'surgefareusd', 'surgefare'],
  bookingFee: ['bookingfeelocal', 'bookingfeeusd', 'bookingfee'],
  serviceFee: ['servicefeelocal', 'servicefeeusd', 'servicefee'],
  waitTimeFare: ['waittimefarelocal', 'waittimefareusd', 'waittimefare'],
  cancellationFee: ['cancellationfeelocal', 'cancellationfeeusd', 'cancellationfee'],
  baseFare: ['basefarelocal', 'basefareusd', 'basefare'],
  perMileFare: ['permilefarelocal', 'permilefareusd', 'permilefare'],
  perMinuteFare: ['perminutefarelocal', 'perminutefareusd', 'perminutefare'],
  originalFareLocal: ['originalfarelocal'],
  originalFareUsd: ['originalfareusd'],

  cancellationType: ['cancellationtype'],
  paymentType: ['profiletype', 'paymenttype'],
  cardLast4: ['cardnumber', 'cardlast4'],
  flow: ['flow'],
};

// Small allowlist of safe prefix/contains fallbacks to survive future drift,
// applied only for still-unmapped critical fields (avoids false positives).
const PREFIX_FALLBACKS: Partial<Record<CanonicalField, (norm: string) => boolean>> = {
  distanceMiles: (n) => n.startsWith('tripdistance') || n.includes('distancemiles'),
  durationSeconds: (n) => n.startsWith('tripduration'),
  beginTimeUtc: (n) => n.startsWith('begintrip') && n.includes('timestamp') && n.includes('utc'),
  beginTimeLocal: (n) => n.startsWith('begintrip') && n.includes('timestamp') && n.includes('local'),
  fareAmount: (n) => n === 'fareamount',
};

export interface DetectedSchema {
  /** canonical field -> original header string present in the file. */
  mapping: Partial<Record<CanonicalField, string>>;
}

/**
 * Given the raw header row from PapaParse, build the canonical mapping.
 * Exact normalized synonym match first; then a small safe prefix fallback.
 */
export function detectSchema(headers: string[]): DetectedSchema {
  const mapping: Partial<Record<CanonicalField, string>> = {};

  // normalized header -> original (first occurrence wins).
  const normToOriginal = new Map<string, string>();
  for (const h of headers) {
    const n = normalizeHeader(h);
    if (n && !normToOriginal.has(n)) normToOriginal.set(n, h);
  }

  // Pass 1: exact synonym matches.
  (Object.keys(SYNONYMS) as CanonicalField[]).forEach((field) => {
    for (const syn of SYNONYMS[field]) {
      const original = normToOriginal.get(syn);
      if (original && !(field in mapping)) {
        mapping[field] = original;
        return;
      }
    }
  });

  // Pass 2: prefix/contains fallbacks for any still-unmapped critical field.
  (Object.keys(PREFIX_FALLBACKS) as CanonicalField[]).forEach((field) => {
    if (field in mapping) return;
    const pred = PREFIX_FALLBACKS[field]!;
    for (const [norm, original] of normToOriginal) {
      if (pred(norm) && !Object.values(mapping).includes(original)) {
        mapping[field] = original;
        return;
      }
    }
  });

  return { mapping };
}
