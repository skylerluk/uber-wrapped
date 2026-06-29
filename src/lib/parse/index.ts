// Orchestrator: Uber export zip (ArrayBuffer) -> typed trips + verified summary.
// This is the single entry point the UI calls. It also logs a console summary
// and stashes the result on window.__uberWrapped for manual dev inspection.

import type {
  ParseOutcome,
  ParseResult,
  ParseSummary,
  Trip,
} from '../../types/trip';
import { unzipTrips } from './unzip';
import { parseTripsCsv } from './parseTrips';
import { isTripCompleted, isCanceledStatus } from './coerce';

export { unzipTrips } from './unzip';
export { parseTripsCsv } from './parseTrips';
export * from './schema';
export * from './coerce';

function buildSummary(
  allTrips: Trip[],
  completedTrips: Trip[],
  mapping: Record<string, string>,
  sourceFile: string,
): ParseSummary {
  const canceledRows = allTrips.filter((t) => isCanceledStatus(t.status)).length;

  const totalSpend = completedTrips.reduce((sum, t) => sum + (t.fareAmount ?? 0), 0);

  // Most common non-empty currency among completed trips.
  const currencyCounts = new Map<string, number>();
  for (const t of completedTrips) {
    if (t.currency) currencyCounts.set(t.currency, (currencyCounts.get(t.currency) ?? 0) + 1);
  }
  const currency =
    [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Date range over completed trips' begin times.
  const times = completedTrips
    .map((t) => t.beginTime)
    .filter((d): d is Date => d != null)
    .map((d) => d.getTime());
  const dateRange = {
    earliest: times.length ? new Date(Math.min(...times)) : null,
    latest: times.length ? new Date(Math.max(...times)) : null,
  };

  // City counts (completed only).
  const cityCounts = new Map<string, number>();
  for (const t of completedTrips) {
    if (t.city) cityCounts.set(t.city, (cityCounts.get(t.city) ?? 0) + 1);
  }
  const topCities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city, count]) => ({ city, count }));

  const nullFareCount = completedTrips.filter((t) => t.fareAmount == null).length;

  return {
    mapping,
    totalRows: allTrips.length,
    completedRows: completedTrips.length,
    canceledRows,
    totalSpend,
    currency,
    dateRange,
    distinctCities: cityCounts.size,
    topCities,
    nullFareCount,
    sourceFile,
  };
}

function logSummary(summary: ParseSummary, candidates: string[]): void {
  /* eslint-disable no-console */
  console.groupCollapsed('%cUber Wrapped — parse summary', 'font-weight:bold');
  console.log('Source file:', summary.sourceFile);
  if (candidates.length > 1) console.log('CSV candidates considered:', candidates);
  console.table(summary.mapping);
  console.table({
    totalRows: summary.totalRows,
    completedRows: summary.completedRows,
    canceledRows: summary.canceledRows,
    distinctCities: summary.distinctCities,
    nullFareCount: summary.nullFareCount,
  });
  console.log(
    `Total spend (completed): ${summary.totalSpend.toFixed(2)} ${summary.currency ?? ''}`.trim(),
  );
  console.log(
    'Date range:',
    summary.dateRange.earliest?.toISOString() ?? '—',
    '→',
    summary.dateRange.latest?.toISOString() ?? '—',
  );
  console.table(summary.topCities);
  console.groupEnd();
  /* eslint-enable no-console */
}

/**
 * Parse an Uber export zip end to end. Pure, defensive, never throws —
 * always returns a structured ParseOutcome.
 */
export async function parseUberExport(buffer: ArrayBuffer): Promise<ParseOutcome> {
  try {
    const unzipped = await unzipTrips(buffer);
    if (!unzipped.ok) {
      return { ok: false, code: unzipped.code, message: unzipped.message };
    }

    const parsed = parseTripsCsv(unzipped.csv.text);
    if (!parsed.ok) {
      return { ok: false, code: parsed.code, message: parsed.message };
    }

    const allTrips = parsed.result.trips;
    const completedTrips = allTrips.filter(isTripCompleted);
    const summary = buildSummary(
      allTrips,
      completedTrips,
      parsed.result.mapping,
      unzipped.csv.path,
    );

    const result: ParseResult = { allTrips, completedTrips, summary };

    if (typeof window !== 'undefined') {
      (window as unknown as { __uberWrapped?: ParseResult }).__uberWrapped = result;
      logSummary(summary, unzipped.csv.candidates);
    }

    return { ok: true, result };
  } catch (err) {
    return {
      ok: false,
      code: 'UNKNOWN',
      message: err instanceof Error ? err.message : 'Something went wrong while parsing this file.',
    };
  }
}
