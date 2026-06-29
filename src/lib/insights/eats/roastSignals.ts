// Distill EatsInsights into the privacy-safe signal bundle. Restaurant/item/
// instruction text is non-PII per the data policy and allowed here; no
// addresses, coordinates, or card data are ever included.

import type { EatsInsights, EatsRoastSignals } from '../../../types/eats';

export function buildEatsSignals(eats: EatsInsights): EatsRoastSignals {
  return {
    totalSpend: Math.round(eats.totalSpend * 100) / 100,
    orders: eats.orderCount,
    items: eats.itemCount,
    avgOrder: Math.round(eats.avgOrder * 100) / 100,
    mostExpensiveOrder: eats.mostExpensiveOrder?.total ?? null,
    mostExpensiveItem: eats.mostExpensiveItem
      ? { name: eats.mostExpensiveItem.name, price: eats.mostExpensiveItem.price }
      : null,
    mostOrderedItem: eats.mostOrderedItem,
    topRestaurant: eats.loyalty
      ? { name: eats.loyalty.restaurant, orders: eats.loyalty.orders, pct: eats.loyalty.pct }
      : eats.topRestaurants[0]
        ? { name: eats.topRestaurants[0].name, orders: eats.topRestaurants[0].orders, pct: 0 }
        : null,
    lateNightOrders: eats.lateNightOrders,
    favoriteHour: eats.favoriteHour,
    busiestDay: eats.busiestDayOfWeek?.day ?? null,
    customizationSpend: Math.round(eats.totalCustomizationSpend * 100) / 100,
    ordersWithInstructions: eats.ordersWithInstructions,
    canceledOrders: eats.canceledOrders,
    currency: eats.currency,
  };
}
