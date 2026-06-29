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

function norm(path: string): string {
  return (path.toLowerCase().split('/').pop() ?? '').replace(/[^a-z0-9]/g, '');
}

/** Eats orders CSV: prefer one under an `eats/` folder; match by filename. */
function looksLikeEatsCsv(path: string): boolean {
  const lower = path.toLowerCase();
  if (!lower.endsWith('.csv')) return false;
  if (looksLikeTripsCsv(path)) return false;
  const base = norm(path);
  const inEatsFolder = lower.includes('/eats/') || lower.startsWith('eats/');
  return inEatsFolder || base.includes('userorders') || base.includes('eatsorders');
}

function scoreEats(path: string): number {
  const lower = path.toLowerCase();
  let score = 0;
  if (lower.includes('eats')) score += 3;
  if (norm(path).includes('userorders')) score += 2;
  score -= lower.split('/').length * 0.1;
  return score;
}

/** Find an optional CSV by a filename predicate (returns first/best match). */
async function readFirst(
  zip: JSZip,
  predicate: (path: string) => boolean,
  score?: (path: string) => number,
): Promise<{ path: string; text: string } | null> {
  const matches = Object.values(zip.files)
    .filter((f) => !f.dir)
    .map((f) => f.name)
    .filter(predicate);
  if (matches.length === 0) return null;
  const best = score ? [...matches].sort((a, b) => score(b) - score(a))[0] : matches[0];
  const text = await zip.files[best].async('string');
  return { path: best, text };
}

export interface UberExportFiles {
  trips: FoundCsv | null;
  eats: { path: string; text: string } | null;
  /** user_profile CSV text (rating extracted client-side; rest is PII). */
  profileText: string | null;
  /** rider_lifetime_ratings_received CSV text. */
  ratingsText: string | null;
}

export type UnzipExportResult =
  | { ok: true; files: UberExportFiles }
  | { ok: false; code: 'CORRUPT_ZIP'; message: string };

/**
 * Open the export once and locate every file we care about: trips (rides),
 * Eats orders, the user profile (for rating), and the ratings-received list.
 * All but trips are optional — older or rides-only exports won't have Eats.
 */
export async function unzipUberExport(buffer: ArrayBuffer): Promise<UnzipExportResult> {
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

  const allFiles = Object.values(zip.files).filter((f) => !f.dir).map((f) => f.name);
  const tripCandidates = allFiles.filter(looksLikeTripsCsv);
  let trips: FoundCsv | null = null;
  if (tripCandidates.length > 0) {
    const bestPath = [...tripCandidates].sort((a, b) => scoreCandidate(b) - scoreCandidate(a))[0];
    const text = await zip.files[bestPath].async('string');
    trips = { path: bestPath, text, candidates: tripCandidates };
  }

  const eats = await readFirst(zip, looksLikeEatsCsv, scoreEats);
  const profile = await readFirst(zip, (p) => norm(p).includes('userprofile'));
  const ratings = await readFirst(
    zip,
    (p) => norm(p).includes('ratingsreceived') || norm(p).includes('lifetimeratings'),
  );

  return {
    ok: true,
    files: {
      trips,
      eats,
      profileText: profile?.text ?? null,
      ratingsText: ratings?.text ?? null,
    },
  };
}
