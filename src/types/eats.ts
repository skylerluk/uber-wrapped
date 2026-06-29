// Types for Uber Eats orders + their insights, the combined rides+eats view,
// and the rider reputation (rating + ratings distribution).

export interface EatsItem {
  name: string | null;
  qty: number;
  price: number | null;
  customizations: string | null;
  customizationCost: number | null;
  specialInstructions: string | null;
}

export interface EatsOrder {
  restaurant: string | null;
  city: string | null;
  requestTime: Date | null;
  deliveryTime: Date | null;
  total: number | null; // per-order total (Order_Price), counted once
  currency: string | null;
  status: string;
  items: EatsItem[];
}

export interface EatsAvailability {
  delivery: boolean;
  instructions: boolean;
  customizations: boolean;
  city: boolean;
  time: boolean;
}

export interface EatsInsights {
  totalSpend: number;
  orderCount: number;
  itemCount: number;
  avgOrder: number;
  currency: string | null;
  dateRange: { start: Date | null; end: Date | null; label: string };

  mostExpensiveOrder: { restaurant: string | null; total: number; date: Date | null } | null;
  mostExpensiveItem: { name: string | null; price: number; restaurant: string | null } | null;
  largestOrder: { restaurant: string | null; itemCount: number; date: Date | null } | null;

  topRestaurants: { name: string; orders: number; spend: number }[];
  mostOrderedItem: { name: string; qty: number } | null;
  topCities: { city: string; orders: number }[];
  loyalty: { restaurant: string; pct: number; orders: number } | null;

  favoriteHour: number | null;
  busiestDayOfWeek: { day: string; count: number } | null;
  lateNightOrders: number;
  busiestMonth: { month: string; orders: number } | null;
  ordersByHour: number[]; // length 24 (local)

  avgDeliverySeconds: number;
  longestDeliverySeconds: number;
  totalCustomizationSpend: number;
  ordersWithInstructions: number;
  specialInstructionSamples: string[];

  canceledOrders: number;
  available: EatsAvailability;
}

/** Combined rides + eats headline + cross-service facts. */
export interface CombinedInsights {
  totalToUber: number;
  ridesSpend: number;
  eatsSpend: number;
  ridesCount: number; // completed rides
  eatsCount: number; // completed orders
  totalInteractions: number;
  /** +N% means food spend exceeds ride spend by N% (null if no rides). */
  foodVsRidesPct: number | null;
  dateRangeLabel: string;
  hasRides: boolean;
  hasEats: boolean;
}

// ——— Roast signals: privacy-safe deterministic facts that feed both the
// client roast builders (Part 3) and the anonymized AI payload. No addresses,
// coordinates, or card data ever appear here. Restaurant/item/instruction text
// is non-PII and allowed.

export interface RidesRoastSignals {
  totalSpend: number;
  rides: number;
  avgFare: number;
  mostExpensiveFare: number | null;
  lateNightRides: number;
  surgeFare: number;
  canceledRides: number;
  topCity: string | null;
  topProduct: string | null;
  hoursInCar: number;
  currency: string | null;
}

export interface EatsRoastSignals {
  totalSpend: number;
  orders: number;
  items: number;
  avgOrder: number;
  mostExpensiveOrder: number | null;
  mostExpensiveItem: { name: string | null; price: number } | null;
  mostOrderedItem: { name: string; qty: number } | null;
  topRestaurant: { name: string; orders: number; pct: number } | null;
  lateNightOrders: number;
  favoriteHour: number | null;
  busiestDay: string | null;
  customizationSpend: number;
  ordersWithInstructions: number;
  canceledOrders: number;
  currency: string | null;
}

export interface CombinedRoastSignals {
  totalToUber: number;
  ridesSpend: number;
  eatsSpend: number;
  foodVsRidesPct: number | null;
  ridesCount: number;
  eatsCount: number;
  hasRides: boolean;
  hasEats: boolean;
  rides: RidesRoastSignals | null;
  eats: EatsRoastSignals | null;
  currency: string | null;
}

/** Rider reputation from the account/profile files (non-PII). */
export interface Reputation {
  rating: number | null;
  /** counts keyed by star value, e.g. { stars: 5, count: 357 }. */
  distribution: { stars: number; count: number }[];
  oneStar: number;
  totalRatings: number;
}
