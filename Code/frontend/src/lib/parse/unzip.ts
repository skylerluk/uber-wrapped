// Open an Uber export zip in memory and locate the trips CSV. We never assume a
// fixed path like "Rider/trips_data.csv" — Uber's layout varies — so we search
// recursively for any CSV whose name suggests trips.

import JSZip from 'jszip';

export interface FoundCsv {
  /** Full path of the chosen CSV inside the zip. */
  path: string;
  /** Raw CSV text. */
  text: string;
  /** All trip-CSV candidates we considered, for transparency/logging. */
  candidates: string[];
}

export type UnzipResult =
  | { ok: true; csv: FoundCsv }
  | { ok: false; code: 'NOT_A_ZIP' | 'CORRUPT_ZIP' | 'NO_TRIPS_FILE'; message: string };

function looksLikeTripsCsv(path: string): boolean {
  const lower = path.toLowerCase();
  if (!lower.endsWith('.csv')) return false;
  const base = lower.split('/').pop() ?? lower;
  return base.includes('trip');
}

/** Score a candidate so rider trips outrank driver/other trip files. */
function scoreCandidate(path: string): number {
  const lower = path.toLowerCase();
  let score = 0;
  if (lower.includes('rider')) score += 3;
  if (lower.includes('trips_data')) score += 2;
  if (lower.includes('driver')) score -= 2;
  // shallower paths are mildly preferred
  score -= lower.split('/').length * 0.1;
  return score;
}

export async function unzipTrips(buffer: ArrayBuffer): Promise<UnzipResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return {
      ok: false,
      code: 'CORRUPT_ZIP',
      message: "This file couldn't be opened as a zip. Make sure it's the .zip from Uber's Privacy Center.",
    };
  }

  const files = Object.values(zip.files).filter((f) => !f.dir);
  const candidates = files.map((f) => f.name).filter(looksLikeTripsCsv);

  if (candidates.length === 0) {
    return {
      ok: false,
      code: 'NO_TRIPS_FILE',
      message: "Couldn't find a trips file in this zip. Expected a CSV with 'trips' in its name.",
    };
  }

  const bestPath = [...candidates].sort((a, b) => scoreCandidate(b) - scoreCandidate(a))[0];
  const text = await zip.files[bestPath].async('string');

  return { ok: true, csv: { path: bestPath, text, candidates } };
}
