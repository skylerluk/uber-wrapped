import { z } from 'zod';

// Service-tagged cross-service signals. Restaurant/item text is non-PII and
// allowed; addresses, coords, and card data are not present in this shape.
const RidesSignalsSchema = z
  .object({
    totalSpend: z.number(),
    rides: z.number().int(),
    avgFare: z.number(),
    mostExpensiveFare: z.number().nullable(),
    lateNightRides: z.number().int(),
    surgeFare: z.number(),
    canceledRides: z.number().int(),
    topCity: z.string().nullable(),
    topProduct: z.string().nullable(),
    hoursInCar: z.number(),
    currency: z.string().nullable(),
  })
  .strict();

const EatsSignalsSchema = z
  .object({
    totalSpend: z.number(),
    orders: z.number().int(),
    items: z.number().int(),
    avgOrder: z.number(),
    mostExpensiveOrder: z.number().nullable(),
    mostExpensiveItem: z
      .object({ name: z.string().nullable(), price: z.number() })
      .strict()
      .nullable(),
    mostOrderedItem: z.object({ name: z.string(), qty: z.number() }).strict().nullable(),
    topRestaurant: z
      .object({ name: z.string(), orders: z.number().int(), pct: z.number() })
      .strict()
      .nullable(),
    lateNightOrders: z.number().int(),
    favoriteHour: z.number().int().nullable(),
    busiestDay: z.string().nullable(),
    customizationSpend: z.number(),
    ordersWithInstructions: z.number().int(),
    canceledOrders: z.number().int(),
    currency: z.string().nullable(),
  })
  .strict();

const CombinedSignalsSchema = z
  .object({
    totalToUber: z.number(),
    ridesSpend: z.number(),
    eatsSpend: z.number(),
    foodVsRidesPct: z.number().nullable(),
    ridesCount: z.number().int(),
    eatsCount: z.number().int(),
    hasRides: z.boolean(),
    hasEats: z.boolean(),
    rides: RidesSignalsSchema.nullable(),
    eats: EatsSignalsSchema.nullable(),
    currency: z.string().nullable(),
  })
  .strict();

// Strict schema for the anonymized aggregate payload. `.strict()` rejects ANY
// extra keys — so address/coordinate/raw-trip fields cause a hard 400. This is
// the server-side half of the privacy boundary.
export const AggregatePayloadSchema = z
  .object({
    totalSpend: z.number(),
    currency: z.string().nullable(),
    totalRides: z.number().int(),
    totalDistanceMiles: z.number(),
    dateRangeLabel: z.string(),
    topCity: z.string().nullable(),
    distinctCityCount: z.number().int(),
    avgFare: z.number(),
    mostExpensiveFare: z.number().nullable(),
    canceledRides: z.number().int(),
    lateNightRides: z.number().int(),
    busiestDayOfWeek: z.string().nullable(),
    favoriteTimeOfDay: z
      .enum(['Late Night', 'Morning', 'Afternoon', 'Evening', 'Night'])
      .nullable(),
    hoursInCar: z.number(),
    totalSurgeFare: z.number(),
    totalTolls: z.number(),
    totalSaved: z.number(),
    airportRides: z.number().int(),
    scheduledRides: z.number().int(),
    topProduct: z.string().nullable(),
    timeframeLabel: z.string(),
    byYear: z
      .array(z.object({ year: z.number().int(), spend: z.number(), rides: z.number().int() }).strict())
      .max(40)
      .optional(),
    peakYear: z.number().int().nullable().optional(),
    topYoYPct: z.number().nullable().optional(),
    yearsActive: z.number().int().optional(),
    comparisons: z
      .array(
        z
          .object({ id: z.string(), label: z.string(), multiple: z.number() })
          .strict(),
      )
      .max(20),
    combined: CombinedSignalsSchema.optional(),
    rating: z.number().nullable().optional(),
  })
  .strict();

export type AggregatePayload = z.infer<typeof AggregatePayloadSchema>;

// Defense in depth: even within allowed string fields, reject anything that
// looks like a street address or coordinate pair.
const FORBIDDEN = /\b\d{1,5}\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|lane|ln|dr|drive)\b/i;
const COORD = /-?\d{1,3}\.\d{4,}/;

export function looksLikeLeak(payload: AggregatePayload): boolean {
  const strings = [
    payload.topCity ?? '',
    payload.busiestDayOfWeek ?? '',
    payload.dateRangeLabel,
    payload.topProduct ?? '',
    ...payload.comparisons.flatMap((c) => [c.label, c.id]),
  ];
  return strings.some((s) => FORBIDDEN.test(s) || COORD.test(s));
}
