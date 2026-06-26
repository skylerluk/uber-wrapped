// Schema-detection layer. Uber's CSV headers drift across years and locales, so
// we never hardcode exact header strings — we normalize each header and match it
// against a synonym table to a canonical field name.

export type CanonicalField =
  | 'city'
  | 'productType'
  | 'status'
  | 'requestTime'
  | 'beginTime'
  | 'dropoffTime'
  | 'beginAddress'
  | 'dropoffAddress'
  | 'distanceMiles'
  | 'fareAmount'
  | 'fareCurrency'
  | 'beginLat'
  | 'beginLng'
  | 'dropoffLat'
  | 'dropoffLng';

/** Lowercase and strip everything that isn't a letter or digit. */
export function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Synonyms are listed already-normalized (no spaces/punctuation). Order matters
// only within a field; across fields the first column that matches a canonical
// claims it, and we never overwrite an already-mapped canonical.
const SYNONYMS: Record<CanonicalField, string[]> = {
  city: ['city'],
  productType: ['producttype', 'vehicletype', 'product'],
  status: ['tripororderstatus', 'triporderstatus', 'tripstatus', 'orderstatus', 'status'],
  requestTime: ['requesttime', 'requestat', 'requestdatetimeutc'],
  beginTime: ['begintriptime', 'begintime', 'pickuptime', 'tripstarttime'],
  dropoffTime: ['dropofftime', 'dropofftimeutc', 'endtime', 'tripendtime'],
  beginAddress: ['begintripaddress', 'pickupaddress', 'beginaddress'],
  dropoffAddress: ['dropoffaddress', 'dropaddress', 'endaddress'],
  // "Distance (miles)" -> "distancemiles"; bare "distance" also accepted.
  distanceMiles: ['distancemiles', 'distancemi', 'tripdistance', 'distance'],
  // "Fare Amount" -> "fareamount". Fallbacks for older/alt exports.
  fareAmount: ['fareamount', 'fare', 'amount', 'totalfare', 'total', 'price'],
  fareCurrency: ['farecurrency', 'currencycode', 'currency'],
  beginLat: ['begintriplat', 'pickuplat', 'beginlat', 'startlat'],
  beginLng: ['begintriplng', 'begintriplon', 'pickuplng', 'beginlng', 'startlng'],
  dropoffLat: ['dropofflat', 'endlat'],
  dropoffLng: ['dropofflng', 'dropofflon', 'endlng'],
};

export interface DetectedSchema {
  /** canonical field -> original header string present in the file. */
  mapping: Partial<Record<CanonicalField, string>>;
}

/**
 * Given the raw header row from PapaParse, build the canonical mapping.
 * First column to satisfy a canonical synonym wins that canonical.
 */
export function detectSchema(headers: string[]): DetectedSchema {
  const mapping: Partial<Record<CanonicalField, string>> = {};

  // Pre-index normalized headers -> original (first occurrence wins).
  const normToOriginal = new Map<string, string>();
  for (const h of headers) {
    const n = normalizeHeader(h);
    if (n && !normToOriginal.has(n)) normToOriginal.set(n, h);
  }

  (Object.keys(SYNONYMS) as CanonicalField[]).forEach((field) => {
    for (const syn of SYNONYMS[field]) {
      const original = normToOriginal.get(syn);
      if (original && !(field in mapping)) {
        mapping[field] = original;
        return;
      }
    }
  });

  return { mapping };
}
