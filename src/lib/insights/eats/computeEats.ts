// Deterministic insights over reconstructed Eats orders. Mirrors the rides
// computeStats style: defensive, null-tolerant, timeframe-agnostic (the caller
// passes already-filtered completed orders). Local wall-clock stats read the
// Z-suffixed *_Local timestamps via getUTC* getters (same trick as rides).

import type { EatsInsights, EatsOrder } from '../../../types/eats';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function rangeLabel(start: Date | null, end: Date | null): string {
  if (!start || !end) return '';
  const fmt = (d: Date) =>
    `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
  const a = fmt(start);
  const b = fmt(end);
  return a === b ? a : `${a} – ${b}`;
}

/** Compute Eats insights from the COMPLETED orders (+ canceled count). */
export function computeEatsInsights(
  completedOrders: EatsOrder[],
  canceledOrders = 0,
): EatsInsights {
  const orders = completedOrders;

  // Spend: order.total is per-order (already deduped during reconstruction).
  const totalSpend = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const orderCount = orders.length;
  const itemCount = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + (it.qty || 1), 0),
    0,
  );
  const avgOrder = orderCount > 0 ? totalSpend / orderCount : 0;

  const currencyCounts = new Map<string, number>();
  for (const o of orders) if (o.currency) currencyCounts.set(o.currency, (currencyCounts.get(o.currency) ?? 0) + 1);
  const currency = [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Date range over request times.
  const times = orders.map((o) => o.requestTime).filter((d): d is Date => d != null).map((d) => d.getTime());
  const start = times.length ? new Date(Math.min(...times)) : null;
  const end = times.length ? new Date(Math.max(...times)) : null;

  // Superlatives.
  let mostExpensiveOrder: EatsInsights['mostExpensiveOrder'] = null;
  let largestOrder: EatsInsights['largestOrder'] = null;
  let mostExpensiveItem: EatsInsights['mostExpensiveItem'] = null;
  for (const o of orders) {
    if (o.total != null && (!mostExpensiveOrder || o.total > mostExpensiveOrder.total)) {
      mostExpensiveOrder = { restaurant: o.restaurant, total: o.total, date: o.requestTime };
    }
    const oItemCount = o.items.reduce((s, it) => s + (it.qty || 1), 0);
    if (!largestOrder || oItemCount > largestOrder.itemCount) {
      largestOrder = { restaurant: o.restaurant, itemCount: oItemCount, date: o.requestTime };
    }
    for (const it of o.items) {
      if (it.price != null && (!mostExpensiveItem || it.price > mostExpensiveItem.price)) {
        mostExpensiveItem = { name: it.name, price: it.price, restaurant: o.restaurant };
      }
    }
  }

  // Top restaurants by orders (and spend).
  const restMap = new Map<string, { orders: number; spend: number }>();
  for (const o of orders) {
    if (!o.restaurant) continue;
    const e = restMap.get(o.restaurant) ?? { orders: 0, spend: 0 };
    e.orders += 1;
    e.spend += o.total ?? 0;
    restMap.set(o.restaurant, e);
  }
  const topRestaurants = [...restMap.entries()]
    .map(([name, v]) => ({ name, orders: v.orders, spend: v.spend }))
    .sort((a, b) => b.orders - a.orders || b.spend - a.spend)
    .slice(0, 5);

  const loyalty =
    topRestaurants[0] && orderCount > 0
      ? {
          restaurant: topRestaurants[0].name,
          orders: topRestaurants[0].orders,
          pct: Math.round((topRestaurants[0].orders / orderCount) * 100),
        }
      : null;

  // Most-ordered item by total quantity.
  const itemQty = new Map<string, number>();
  for (const o of orders) for (const it of o.items) {
    if (!it.name) continue;
    itemQty.set(it.name, (itemQty.get(it.name) ?? 0) + (it.qty || 1));
  }
  const topItem = [...itemQty.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostOrderedItem = topItem ? { name: topItem[0], qty: topItem[1] } : null;

  // Cities.
  const cityMap = new Map<string, number>();
  for (const o of orders) if (o.city) cityMap.set(o.city, (cityMap.get(o.city) ?? 0) + 1);
  const topCities = [...cityMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city, orders]) => ({ city, orders }));

  // Time-of-day patterns (local wall clock via getUTC*).
  const ordersByHour = new Array(24).fill(0) as number[];
  const dowCounts = new Array(7).fill(0) as number[];
  const monthCounts = new Map<string, number>();
  let lateNightOrders = 0;
  for (const o of orders) {
    const d = o.requestTime;
    if (!d) continue;
    const h = d.getUTCHours();
    ordersByHour[h] += 1;
    dowCounts[d.getUTCDay()] += 1;
    if (h >= 0 && h < 5) lateNightOrders += 1;
    const key = `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const favoriteHour = ordersByHour.some((c) => c > 0)
    ? ordersByHour.indexOf(Math.max(...ordersByHour))
    : null;
  const maxDow = Math.max(...dowCounts);
  const busiestDayOfWeek = maxDow > 0 ? { day: DAYS[dowCounts.indexOf(maxDow)], count: maxDow } : null;
  const busiestMonthEntry = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const busiestMonth = busiestMonthEntry ? { month: busiestMonthEntry[0], orders: busiestMonthEntry[1] } : null;

  // Delivery durations (request -> final delivery).
  const deliverySecs: number[] = [];
  for (const o of orders) {
    if (o.requestTime && o.deliveryTime) {
      const s = (o.deliveryTime.getTime() - o.requestTime.getTime()) / 1000;
      if (s > 0 && s < 6 * 3600) deliverySecs.push(s);
    }
  }
  const avgDeliverySeconds = deliverySecs.length
    ? deliverySecs.reduce((a, b) => a + b, 0) / deliverySecs.length
    : 0;
  const longestDeliverySeconds = deliverySecs.length ? Math.max(...deliverySecs) : 0;

  // Customizations + special instructions.
  let totalCustomizationSpend = 0;
  let ordersWithInstructions = 0;
  const specialInstructionSamples: string[] = [];
  for (const o of orders) {
    let hasInstruction = false;
    for (const it of o.items) {
      if (it.customizationCost != null) totalCustomizationSpend += it.customizationCost;
      if (it.specialInstructions) {
        hasInstruction = true;
        if (specialInstructionSamples.length < 8) specialInstructionSamples.push(it.specialInstructions);
      }
    }
    if (hasInstruction) ordersWithInstructions += 1;
  }

  return {
    totalSpend,
    orderCount,
    itemCount,
    avgOrder,
    currency,
    dateRange: { start, end, label: rangeLabel(start, end) },
    mostExpensiveOrder,
    mostExpensiveItem,
    largestOrder,
    topRestaurants,
    mostOrderedItem,
    topCities,
    loyalty,
    favoriteHour,
    busiestDayOfWeek,
    lateNightOrders,
    busiestMonth,
    ordersByHour,
    avgDeliverySeconds,
    longestDeliverySeconds,
    totalCustomizationSpend,
    ordersWithInstructions,
    specialInstructionSamples,
    canceledOrders,
    available: {
      delivery: deliverySecs.length > 0,
      instructions: ordersWithInstructions > 0,
      customizations: totalCustomizationSpend > 0,
      city: cityMap.size > 0,
      time: times.length > 0,
    },
  };
}
