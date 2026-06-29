// Deterministic stats. Every reducer is guarded against empty / null input and
// returns well-defined zeros/nulls — never NaN.
//
// Ordering / date-range / month buckets use the UTC instant (beginTime).
// Hour-of-day / day-of-week / late-night use the LOCAL wall-clock (beginTimeLocal,
// which is stored suffixed `Z`, so getUTC* reads its local clock components).

import type { Trip } from '../../types/trip';
import { isRiderCanceledStatus } from '../parse/coerce';
import type {
  Stats,
  TripRef,
  MonthBucket,
  YearBucket,
  CityBucket,
  ProductBucket,
  PaymentBucket,
  TimeOfDayBucket,
} from '../../types/insights';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PREMIUM_RE = /black|comfort|premier|lux|exec|select|suv/i;

function toTripRef(t: Trip): TripRef {
  const route =
    t.beginAddress && t.dropoffAddress ? `${t.beginAddress} → ${t.dropoffAddress}` : null;
  return {
    amount: t.fareAmount,
    distanceMiles: t.distanceMiles,
    durationSeconds: t.durationSeconds,
    date: t.beginTime,
    city: t.city,
    route,
  };
}

/** Local wall-clock for time-of-day stats; fall back to the UTC instant. */
function localTime(t: Trip): Date | null {
  return t.beginTimeLocal ?? t.beginTime;
}

function sum(nums: (number | null)[]): number {
  return nums.reduce<number>((s, n) => s + (n ?? 0), 0);
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

function timeOfDayBucket(hour: number): TimeOfDayBucket {
  if (hour < 5) return 'Late Night';
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  if (hour < 21) return 'Evening';
  return 'Night';
}

function fmtDateRangeLabel(start: Date | null, end: Date | null): string {
  if (!start || !end) return 'your Uber history';
  const sy = start.getUTCFullYear();
  const ey = end.getUTCFullYear();
  return sy === ey ? `${sy}` : `${sy}–${ey}`;
}

export function computeStats(allTrips: Trip[], completedTrips: Trip[]): Stats {
  const fares = completedTrips.map((t) => t.fareAmount).filter((n): n is number => n != null);
  const totalSpend = sum(fares);

  const distances = completedTrips.map((t) => t.distanceMiles).filter((n): n is number => n != null);
  const totalDistanceMiles = sum(distances);

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
      ? toTripRef(withFare.reduce((a, b) => ((b.fareAmount ?? Infinity) < (a.fareAmount ?? Infinity) ? b : a)))
      : null;
  const withDistance = completedTrips.filter((t) => t.distanceMiles != null);
  const longestTrip =
    withDistance.length > 0
      ? toTripRef(withDistance.reduce((a, b) => ((b.distanceMiles ?? 0) > (a.distanceMiles ?? 0) ? b : a)))
      : null;
  const withDuration = completedTrips.filter((t) => t.durationSeconds != null);
  const longestDurationTrip =
    withDuration.length > 0
      ? toTripRef(withDuration.reduce((a, b) => ((b.durationSeconds ?? 0) > (a.durationSeconds ?? 0) ? b : a)))
      : null;

  // Money series (UTC month/year)
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
  const cityBreakdown = [...cityMap.values()].sort((a, b) => b.rides - a.rides || b.spend - a.spend);
  const topCity = cityBreakdown[0] ?? null;

  // Time patterns (LOCAL)
  const dayCounts = new Array(7).fill(0);
  const ridesByHour = new Array(24).fill(0);
  const todCounts = new Map<TimeOfDayBucket, number>();
  let lateNightRides = 0;
  let localTimeCount = 0;
  for (const t of completedTrips) {
    const lt = localTime(t);
    if (!lt) continue;
    localTimeCount += 1;
    const day = lt.getUTCDay();
    const hour = lt.getUTCHours();
    dayCounts[day] += 1;
    ridesByHour[hour] += 1;
    const bucket = timeOfDayBucket(hour);
    todCounts.set(bucket, (todCounts.get(bucket) ?? 0) + 1);
    if (hour < 5) lateNightRides += 1;
  }
  const maxDay = dayCounts.reduce((bi, c, i, arr) => (c > arr[bi] ? i : bi), 0);
  const busiestDayOfWeek =
    localTimeCount > 0 ? { day: DAY_NAMES[maxDay], count: dayCounts[maxDay] } : null;
  const todEntries = [...todCounts.entries()].sort((a, b) => b[1] - a[1]);
  const favoriteTimeOfDay =
    todEntries.length > 0 ? { bucket: todEntries[0][0], count: todEntries[0][1] } : null;
  const busiestMonthBucket = [...monthMap.values()].sort((a, b) => b.rides - a.rides)[0];
  const busiestMonth = busiestMonthBucket
    ? { month: busiestMonthBucket.month, rides: busiestMonthBucket.rides }
    : null;

  // Cancellations
  const canceledRides = allTrips.filter((t) => t.status.includes('cancel')).length;
  const riderCanceledRides = allTrips.filter((t) => isRiderCanceledStatus(t.status)).length;
  const cancellationFeesPaid = sum(allTrips.map((t) => t.cancellationFee));

  const firstEverRide =
    times.length > 0 ? toTripRef(completedTrips.find((t) => t.beginTime === start)!) : null;

  // Longest gap between consecutive rides
  let longestGapBetweenRides: Stats['longestGapBetweenRides'] = null;
  for (let i = 1; i < times.length; i++) {
    const gapMs = times[i].getTime() - times[i - 1].getTime();
    if (!longestGapBetweenRides || gapMs > longestGapBetweenRides.days * 86400000) {
      longestGapBetweenRides = { days: Math.round(gapMs / 86400000), from: times[i - 1], to: times[i] };
    }
  }

  // Most rides in one (local) day
  const dayMap = new Map<string, number>();
  for (const t of completedTrips) {
    const lt = localTime(t);
    if (!lt) continue;
    const key = lt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const topDay = [...dayMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostRidesInOneDay = topDay ? { date: topDay[0], count: topDay[1] } : null;

  // Duration
  const durations = completedTrips.map((t) => t.durationSeconds).filter((n): n is number => n != null);
  const totalDurationSeconds = sum(durations);
  const avgDurationSeconds = durations.length ? totalDurationSeconds / durations.length : 0;

  // Money depth
  const totalSurgeFare = sum(completedTrips.map((t) => t.surgeFare));
  const totalTolls = sum(completedTrips.map((t) => t.tollAmount));
  const totalFees = sum(completedTrips.map((t) => (t.bookingFee ?? 0) + (t.serviceFee ?? 0)));
  const totalSaved =
    sum(completedTrips.map((t) => (t.promotionAmount != null ? Math.abs(t.promotionAmount) : 0))) +
    sum(completedTrips.map((t) => (t.creditsAmount != null ? Math.abs(t.creditsAmount) : 0)));
  const avgPerMile = totalDistanceMiles > 0 ? totalSpend / totalDistanceMiles : 0;
  const avgPerMinute = totalDurationSeconds > 0 ? totalSpend / (totalDurationSeconds / 60) : 0;

  // Behavior
  const surgedRides = completedTrips.filter(
    (t) => t.isSurged === true || (t.surgeMultiplier != null && t.surgeMultiplier > 1),
  ).length;
  const surgeMultipliers = completedTrips
    .map((t) => t.surgeMultiplier)
    .filter((n): n is number => n != null && n > 1);
  const avgSurgeMultiplier = surgeMultipliers.length ? sum(surgeMultipliers) / surgeMultipliers.length : 0;
  const airportRides = completedTrips.filter((t) => t.isAirport === true).length;
  const scheduledRides = completedTrips.filter((t) => t.isScheduled === true).length;
  const sharedRides = completedTrips.filter((t) => t.isShared === true).length;

  const productMap = new Map<string, ProductBucket>();
  for (const t of completedTrips) {
    if (!t.productType) continue;
    const pb = productMap.get(t.productType) ?? { product: t.productType, rides: 0, spend: 0 };
    pb.rides += 1;
    pb.spend += t.fareAmount ?? 0;
    productMap.set(t.productType, pb);
  }
  const productMix = [...productMap.values()].sort((a, b) => b.rides - a.rides);
  const premiumRides = completedTrips.filter((t) => t.productType && PREMIUM_RE.test(t.productType)).length;
  const premiumShare = completedTrips.length ? premiumRides / completedTrips.length : 0;

  const paymentMap = new Map<string, number>();
  for (const t of completedTrips) {
    if (!t.paymentType) continue;
    paymentMap.set(t.paymentType, (paymentMap.get(t.paymentType) ?? 0) + 1);
  }
  const paymentSplit: PaymentBucket[] = [...paymentMap.entries()]
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);

  const available: Stats['available'] = {
    city: cityMap.size > 0,
    distance: distances.length > 0,
    time: localTimeCount > 0,
    duration: durations.length > 0,
    surge: completedTrips.some((t) => t.surgeFare != null || t.isSurged != null || t.surgeMultiplier != null),
    tolls: completedTrips.some((t) => t.tollAmount != null),
    fees: completedTrips.some((t) => t.bookingFee != null || t.serviceFee != null),
    savings: completedTrips.some((t) => t.promotionAmount != null || t.creditsAmount != null),
    product: productMix.length > 0,
    payment: paymentSplit.length > 0,
    perMinute: durations.length > 0 && totalSpend > 0,
    cancellationFees: allTrips.some((t) => t.cancellationFee != null),
  };

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
    totalDurationSeconds,
    avgDurationSeconds,
    longestDurationTrip,
    totalSurgeFare,
    totalTolls,
    totalFees,
    totalSaved,
    avgPerMile,
    avgPerMinute,
    surgedRides,
    avgSurgeMultiplier,
    airportRides,
    scheduledRides,
    sharedRides,
    productMix,
    premiumShare,
    paymentSplit,
    riderCanceledRides,
    cancellationFeesPaid,
    available,
  };
}
