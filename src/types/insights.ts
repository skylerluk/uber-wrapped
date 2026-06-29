// Typed model for the deterministic insights + roast engine (Phase 2).

export interface TripRef {
  amount: number | null;
  distanceMiles: number | null;
  durationSeconds: number | null;
  date: Date | null;
  city: string | null;
  /** "Begin → Dropoff" when both addresses exist, else null. */
  route: string | null;
}

export interface ProductBucket {
  product: string;
  rides: number;
  spend: number;
}

export interface PaymentBucket {
  method: string;
  count: number;
}

/** Which optional panels have backing data (drives conditional UI). */
export interface StatsAvailability {
  city: boolean;
  distance: boolean;
  time: boolean;
  duration: boolean;
  surge: boolean;
  tolls: boolean;
  fees: boolean;
  savings: boolean;
  product: boolean;
  payment: boolean;
  perMinute: boolean;
  cancellationFees: boolean;
}

export interface MonthBucket {
  /** "YYYY-MM" */
  month: string;
  spend: number;
  rides: number;
}

export interface YearBucket {
  year: number;
  spend: number;
  rides: number;
}

export interface CityBucket {
  city: string;
  rides: number;
  spend: number;
}

export type TimeOfDayBucket =
  | 'Late Night'
  | 'Morning'
  | 'Afternoon'
  | 'Evening'
  | 'Night';

export interface Stats {
  // Headline
  totalSpend: number;
  currency: string | null;
  totalRides: number;
  totalDistanceMiles: number;
  dateRange: { start: Date | null; end: Date | null; label: string };

  // Superlatives
  mostExpensiveTrip: TripRef | null;
  cheapestTrip: TripRef | null;
  longestTrip: TripRef | null;

  // Money
  avgFare: number;
  medianFare: number;
  totalSpendByMonth: MonthBucket[];
  spendByYear: YearBucket[];

  // Geography
  topCity: CityBucket | null;
  cityBreakdown: CityBucket[];
  distinctCityCount: number;

  // Time patterns
  busiestDayOfWeek: { day: string; count: number } | null;
  favoriteTimeOfDay: { bucket: TimeOfDayBucket; count: number } | null;
  ridesByHour: number[]; // length 24
  busiestMonth: { month: string; rides: number } | null;

  // Fun extras
  canceledRides: number;
  firstEverRide: TripRef | null;
  longestGapBetweenRides: { days: number; from: Date; to: Date } | null;
  mostRidesInOneDay: { date: string; count: number } | null;
  lateNightRides: number; // rides between 00:00–04:59 (local)

  // Duration
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  longestDurationTrip: TripRef | null;

  // Money depth
  totalSurgeFare: number;
  totalTolls: number;
  totalFees: number; // booking + service
  totalSaved: number; // promotions + credits
  avgPerMile: number;
  avgPerMinute: number;

  // Behavior
  surgedRides: number;
  avgSurgeMultiplier: number; // average multiplier among surged rides
  airportRides: number;
  scheduledRides: number;
  sharedRides: number;
  productMix: ProductBucket[];
  premiumShare: number; // 0–1 fraction on premium products
  paymentSplit: PaymentBucket[];

  // Cancellations
  riderCanceledRides: number;
  cancellationFeesPaid: number;

  available: StatsAvailability;
}

export type RoastCategory =
  | 'purchase'
  | 'travel'
  | 'food'
  | 'distance'
  | 'time'
  | 'behavior'
  | 'superlative'
  | 'ai';

export type RoastSeverity = 'light' | 'medium' | 'spicy';

export interface Roast {
  id: string;
  category: RoastCategory;
  headline: string;
  sub: string;
  emoji?: string;
  severity: RoastSeverity;
  /** The raw multiple/number behind the headline, so the UI can animate it. */
  value: number;
  /** Higher = more likely to be featured. */
  funScore: number;
}

export interface InsightsMeta {
  generatedAt: string;
  hasFareData: boolean;
}

export interface Insights {
  stats: Stats;
  roasts: Roast[];
  meta: InsightsMeta;
}

/**
 * The ONLY shape that may ever leave the client (Phase 4 → Gemini).
 * No addresses, no coordinates, no raw trips. Privacy boundary lives here.
 */
export interface AggregatePayload {
  totalSpend: number;
  currency: string | null;
  totalRides: number;
  totalDistanceMiles: number;
  dateRangeLabel: string;
  topCity: string | null;
  distinctCityCount: number;
  avgFare: number;
  mostExpensiveFare: number | null;
  canceledRides: number;
  lateNightRides: number;
  busiestDayOfWeek: string | null;
  favoriteTimeOfDay: TimeOfDayBucket | null;
  // Extra anonymized aggregates (no addresses, coords, or card data).
  hoursInCar: number;
  totalSurgeFare: number;
  totalTolls: number;
  totalSaved: number;
  airportRides: number;
  scheduledRides: number;
  topProduct: string | null;
  /** Pre-computed comparison tiers (label + multiple), already anonymized. */
  comparisons: { id: string; label: string; multiple: number }[];
}
