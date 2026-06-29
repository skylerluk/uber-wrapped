// Parse the non-PII reputation bits out of the account files:
//   - rider rating (user_profile-*.csv, "Rating" column ONLY — the rest of that
//     file is PII: name, email, phone, signup coords — never read or forward it)
//   - lifetime ratings-received distribution (rider_lifetime_ratings_received-*.csv)

import Papa from 'papaparse';
import type { Reputation } from '../../types/eats';
import { parseNumber } from './coerce';

function normalize(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Pull ONLY the numeric rating out of the user profile CSV. */
export function parseProfileRating(csvText: string | null): number | null {
  if (!csvText) return null;
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  const headers = parsed.meta.fields ?? [];
  const ratingHeader = headers.find((h) => normalize(h) === 'rating');
  if (!ratingHeader) return null;
  const row = parsed.data?.[0];
  if (!row) return null;
  const n = parseNumber(row[ratingHeader]);
  return n != null && n > 0 && n <= 5 ? n : null;
}

/** Build the ratings-received distribution (single column of star values). */
export function parseRatingsDistribution(
  csvText: string | null,
): { distribution: { stars: number; count: number }[]; total: number; oneStar: number } {
  const empty = { distribution: [], total: 0, oneStar: 0 };
  if (!csvText) return empty;

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  const headers = parsed.meta.fields ?? [];
  // The real header is `five_star_rating`; accept any single star/rating column.
  const col =
    headers.find((h) => normalize(h).includes('star')) ??
    headers.find((h) => normalize(h).includes('rating')) ??
    headers[0];
  if (!col) return empty;

  const counts = new Map<number, number>();
  for (const row of parsed.data ?? []) {
    const stars = parseNumber(row[col]);
    if (stars == null) continue;
    const s = Math.round(stars);
    if (s < 1 || s > 5) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  const distribution = [...counts.entries()]
    .map(([stars, count]) => ({ stars, count }))
    .sort((a, b) => b.stars - a.stars);
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  const oneStar = counts.get(1) ?? 0;
  return { distribution, total, oneStar };
}

/** Combine profile rating + distribution into the Reputation model. */
export function buildReputation(
  profileCsv: string | null,
  ratingsCsv: string | null,
): Reputation {
  const rating = parseProfileRating(profileCsv);
  const { distribution, total, oneStar } = parseRatingsDistribution(ratingsCsv);
  return { rating, distribution, oneStar, totalRatings: total };
}
