// Editable comparison catalog. All reference values are approximate and clearly
// labeled — tweak freely. Prices in USD; the roast engine divides spend by these.

export interface PriceRef {
  id: string;
  /** Singular noun phrase, e.g. "a used 2018 Subaru Outback". */
  label: string;
  /** Plural/countable phrase, e.g. "used 2018 Subaru Outbacks". */
  plural: string;
  unitPrice: number;
  emoji: string;
}

// Big one-time purchases — used for "you spent enough to buy ___".
export const BIG_PURCHASES: PriceRef[] = [
  { id: 'subaru', label: 'a used 2018 Subaru Outback', plural: 'used Subaru Outbacks', unitPrice: 18000, emoji: '🚗' },
  { id: 'civic', label: 'a used Honda Civic', plural: 'used Honda Civics', unitPrice: 12000, emoji: '🚙' },
  { id: 'rent', label: 'a year of average US rent', plural: 'years of US rent', unitPrice: 1800 * 12, emoji: '🏠' },
  { id: 'ring', label: 'a decent engagement ring', plural: 'engagement rings', unitPrice: 5000, emoji: '💍' },
  { id: 'macbook', label: 'a maxed-out MacBook Pro', plural: 'maxed-out MacBook Pros', unitPrice: 3500, emoji: '💻' },
  { id: 'ps5', label: 'a PS5', plural: 'PS5s', unitPrice: 500, emoji: '🎮' },
  { id: 'netflix', label: 'a year of Netflix', plural: 'years of Netflix', unitPrice: 15.49 * 12, emoji: '📺' },
];

// Travel — "you could've flown ___".
export const TRAVEL: PriceRef[] = [
  { id: 'hawaii', label: 'a week in Hawaii', plural: 'weeks in Hawaii', unitPrice: 2500, emoji: '🌺' },
  { id: 'tokyo', label: 'a round-trip flight to Tokyo', plural: 'round-trip flights to Tokyo', unitPrice: 1200, emoji: '✈️' },
  { id: 'paris', label: 'a round-trip flight to Paris', plural: 'round-trip flights to Paris', unitPrice: 900, emoji: '🗼' },
  { id: 'hotel', label: 'a night in a nice hotel', plural: 'nights in a nice hotel', unitPrice: 250, emoji: '🏨' },
];

// Food & coffee — always punchy big numbers.
export const FOOD: PriceRef[] = [
  { id: 'burrito', label: 'a Chipotle burrito', plural: 'Chipotle burritos', unitPrice: 11, emoji: '🌯' },
  { id: 'latte', label: 'a $6 latte', plural: '$6 lattes', unitPrice: 6, emoji: '☕' },
  { id: 'innout', label: 'an In-N-Out Double-Double', plural: 'In-N-Out Double-Doubles', unitPrice: 5.5, emoji: '🍔' },
];

// Distance references in miles.
export const DISTANCE = {
  acrossUSOneWay: 2800, // NYC → LA, approx
  aroundEarth: 24901,
  toMoon: 238900,
  marathon: 26.2,
};
