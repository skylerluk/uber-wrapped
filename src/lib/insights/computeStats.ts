// Deterministic stats. Every reducer is guarded against empty / null input and
// returns well-defined zeros/nulls — never NaN.
//
// Time-based stats use UTC (getUTC*) for determinism: Uber exports timestamps
// with an offset baked in (often already UTC), so we read the instant in UTC.

import type { Trip } from '../../types/trip';
import type {
  Stats,
  TripRef,
  MonthBucket,
  YearBucket,
  CityBucket,
  TimeOfDayBucket,
} from '../../types/insights';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toTripRef(t: Trip): TripRef {
  const route =
    t.beginAddress && t.dropoffAddress ? `${t.beginAddress} → ${t.dropoffAddress}` : null;
  return {
    amount: t.fareAmount,
    distanceMiles: t.distanceMiles,
    date: t.beginTime,
    city: t.city,
    route,
  };
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mode(values: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function timeOfDayBucket(hourUTC: number): TimeOfDayBucket {
  if (hourUTC < 5) return 'Late Night';
  if (hourUTC < 12) return 'Morning';
  if (hourUTC < 17) return 'Afternoon';
  if (hourUTC < 21) return 'Evening';
  return 'Night';
}

function fmtDateRangeLabel(start: Date | null, end: Date | null): string {
  if (!start || !end) return 'your Uber history';
  const sy = start.getUTCFullYear();
  const ey = end.getUTCFullYear();
  return sy === ey ? `${sy}` : `${sy}–${ey}`;
}

export function computeStats(allTrips: Trip[], completedTrips: Trip[]): Stats {
  const fares = completedTrips
    .map((t) => t.fareAmount)
    .filter((n): n is number => n != null);
  const totalSpend = fares.reduce((s, n) => s + n, 0);

  const totalDistanceMiles = completedTrips
    .map((t) => t.distanceMiles)
    .filter((n): n is number => n != null)
    .reduce((s, n) => s + n, 0);

  const currency = mode(completedTrips.map((t) => t.currency));

  const times = completedTrips
    .map((t) => t.beginTime)
    .filter((d): d is Date => d != null)
    .sort((a, b) => a.getTime() - b.getTime());
  const start = times[0] ?? null;
  const end = times[times.length - 1] ?? null;

  // Superlatives
  const withFare = completedTrips.filter((t) => t.fareAmount != null);
  const mostExpensiveTrip =
    withFare.length > 0
      ? toTripRef(withFare.reduce((a, b) => ((b.fareAmount ?? 0) > (a.fareAmount ?? 0) ? b : a)))
      : null;
  const cheapestTrip =
    withFare.length > 0
      ? toTripRef(
          withFare.reduce((a, b) => ((b.fareAmount ?? Infinity) < (a.fareAmount ?? Infinity) ? b : a)),
        )
      : null;
  const withDistance = completedTrips.filter((t) => t.distanceMiles != null);
  const longestTrip =
    withDistance.length > 0
      ? toTripRef(
          withDistance.reduce((a, b) =>
            (b.distanceMiles ?? 0) > (a.distanceMiles ?? 0) ? b : a,
          ),
        )
      : null;

  // Money series
  const monthMap = new Map<string, MonthBucket>();
  const yearMap = new Map<number, YearBucket>();
  for (const t of completedTrips) {
    if (!t.beginTime) continue;
    const y = t.beginTime.getUTCFullYear();
    const m = `${y}-${String(t.beginTime.getUTCMonth() + 1).padStart(2, '0')}`;
    const fare = t.fareAmount ?? 0;
    const mb = monthMap.get(m) ?? { month: m, spend: 0, rides: 0 };
    mb.spend += fare;
    mb.rides += 1;
    monthMap.set(m, mb);
    const yb = yearMap.get(y) ?? { year: y, spend: 0, rides: 0 };
    yb.spend += fare;
    yb.rides += 1;
    yearMap.set(y, yb);
  }
  const totalSpendByMonth = [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month));
  const spendByYear = [...yearMap.values()].sort((a, b) => a.year - b.year);

  // Geography
  const cityMap = new Map<string, CityBucket>();
  for (const t of completedTrips) {
    if (!t.city) continue;
    const cb = cityMap.get(t.city) ?? { city: t.city, rides: 0, spend: 0 };
    cb.rides += 1;
    cb.spend += t.fareAmount ?? 0;
    cityMap.set(t.city, cb);
  }
  const cityBreakdown = [...cityMap.values()].sort(
    (a, b) => b.rides - a.rides || b.spend - a.spend,
  );
  const topCity = cityBreakdown[0] ?? null;

  // Time patterns
  const dayCounts = new Array(7).fill(0);
  const ridesByHour = new Array(24).fill(0);
  const todCounts = new Map<TimeOfDayBucket, number>();
  let lateNightRides = 0;
  for (const t of completedTrips) {
    if (!t.beginTime) continue;
    const day = t.beginTime.getUTCDay();
    const hour = t.beginTime.getUTCHours();
    dayCounts[day] += 1;
    ridesByHour[hour] += 1;
    const bucket = timeOfDayBucket(hour);
    todCounts.set(bucket, (todCounts.get(bucket) ?? 0) + 1);
    if (hour < 5) lateNightRides += 1;
  }
  const maxDay = dayCounts.reduce((bi, c, i, arr) => (c > arr[bi] ? i : bi), 0);
  const busiestDayOfWeek =
    times.length > 0 ? { day: DAY_NAMES[maxDay], count: dayCounts[maxDay] } : null;
  const todEntries = [...todCounts.entries()].sort((a, b) => b[1] - a[1]);
  const favoriteTimeOfDay =
    todEntries.length > 0 ? { bucket: todEntries[0][0], count: todEntries[0][1] } : null;
  const busiestMonthBucket = [...monthMap.values()].sort((a, b) => b.rides - a.rides)[0];
  const busiestMonth = busiestMonthBucket
    ? { month: busiestMonthBucket.month, rides: busiestMonthBucket.rides }
    : null;

  // Fun extras
  const canceledRides = allTrips.filter((t) => t.status.includes('cancel')).length;
  const firstEverRide = times.length > 0 ? toTripRef(completedTrips.find((t) => t.beginTime === start)!) : null;

  // Longest gap between consecutive rides
  let longestGapBetweenRides: Stats['longestGapBetweenRides'] = null;
  for (let i = 1; i < times.length; i++) {
    const gapMs = times[i].getTime() - times[i - 1].getTime();
    if (!longestGapBetweenRides || gapMs > longestGapBetweenRides.days * 86400000) {
      longestGapBetweenRides = {
        days: Math.round(gapMs / 86400000),
        from: times[i - 1],
        to: times[i],
      };
    }
  }

  // Most rides in one (UTC) day
  const dayMap = new Map<string, number>();
  for (const t of completedTrips) {
    if (!t.beginTime) continue;
    const key = t.beginTime.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const topDay = [...dayMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostRidesInOneDay = topDay ? { date: topDay[0], count: topDay[1] } : null;

  return {
    totalSpend,
    currency,
    totalRides: completedTrips.length,
    totalDistanceMiles,
    dateRange: { start, end, label: fmtDateRangeLabel(start, end) },
    mostExpensiveTrip,
    cheapestTrip,
    longestTrip,
    avgFare: fares.length ? totalSpend / fares.length : 0,
    medianFare: median(fares),
    totalSpendByMonth,
    spendByYear,
    topCity,
    cityBreakdown,
    distinctCityCount: cityMap.size,
    busiestDayOfWeek,
    favoriteTimeOfDay,
    ridesByHour,
    busiestMonth,
    canceledRides,
    firstEverRide,
    longestGapBetweenRides,
    mostRidesInOneDay,
    lateNightRides,
  };
}
