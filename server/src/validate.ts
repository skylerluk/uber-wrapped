import { z } from 'zod';

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
