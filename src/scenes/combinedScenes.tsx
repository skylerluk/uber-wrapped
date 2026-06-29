import type { Insights } from '../types/insights';
import type { Scene, SceneActions, SceneTag } from './scenes';
import { CountUp } from '../components/CountUp';
import { SpendByYear } from '../components/charts/SpendByYear';
import { formatMoney, formatNumber, formatDate, pluralize } from '../lib/format';
import { GRADIENTS } from '../styles/gradients';

const TAG_RIDES: SceneTag = { icon: '🚗', label: 'Rides' };
const TAG_EATS: SceneTag = { icon: '🍔', label: 'Eats' };
const TAG_COMBINED: SceneTag = { icon: '✨', label: 'Rides + Eats' };

function formatHour(h: number): string {
  const am = h < 12;
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${am ? 'AM' : 'PM'}`;
}

/** Rides-vs-Eats split, rendered as a dual stat over a proportion bar. */
function SplitBlock({
  ridesSpend,
  eatsSpend,
  ridesCount,
  eatsCount,
  currency,
}: {
  ridesSpend: number;
  eatsSpend: number;
  ridesCount: number;
  eatsCount: number;
  currency: string | null;
}) {
  const total = Math.max(1, ridesSpend + eatsSpend);
  const ridesPct = (ridesSpend / total) * 100;
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-3 flex items-stretch gap-3">
        <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur">
          <p className="text-2xl">🚗</p>
          <p className="mt-1 display-number text-2xl text-white">{formatMoney(ridesSpend, currency)}</p>
          <p className="text-xs text-white/70">{pluralize(ridesCount, 'ride')}</p>
        </div>
        <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur">
          <p className="text-2xl">🍔</p>
          <p className="mt-1 display-number text-2xl text-white">{formatMoney(eatsSpend, currency)}</p>
          <p className="text-xs text-white/70">{pluralize(eatsCount, 'order')}</p>
        </div>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/20">
        <div className="h-full bg-white/90" style={{ width: `${ridesPct}%` }} />
        <div className="h-full bg-white/45" style={{ width: `${100 - ridesPct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wider text-white/70">
        <span>Rides {Math.round(ridesPct)}%</span>
        <span>Eats {Math.round(100 - ridesPct)}%</span>
      </div>
    </div>
  );
}

/**
 * The single, unified Wrapped reel: rides + Eats braided into one story, curated
 * to the strongest moment from each category. No service picker. Degrades to a
 * single world (rides-only / eats-only) with no empty scenes.
 */
export function buildCombinedScenes(insights: Insights, actions: SceneActions): Scene[] {
  const { stats, roasts, eats, combined, allTime: at } = insights;
  const hasRides = !!combined?.hasRides;
  const hasEats = !!combined?.hasEats;
  const both = hasRides && hasEats;
  const scenes: Scene[] = [];

  // 1 — Intro
  scenes.push({
    id: 'c-intro',
    gradient: GRADIENTS.iceIndigo,
    tag: both ? TAG_COMBINED : hasEats ? TAG_EATS : TAG_RIDES,
    kicker: 'Uber Wrapped',
    headline: <>Here's everything you gave Uber.</>,
    sub: combined?.dateRangeLabel || stats.dateRange.label || undefined,
  });

  // 2 — The grand total (hero)
  if (both && combined) {
    scenes.push({
      id: 'c-grand-total',
      gradient: GRADIENTS.amberRed,
      tag: TAG_COMBINED,
      kicker: 'All in, you gave Uber',
      headline: (
        <CountUp value={combined.totalToUber} format={(n) => formatMoney(n, combined.currency)} blurIn durationMs={2200} />
      ),
      sub: `across ${formatNumber(combined.totalInteractions)} rides & orders`,
    });

    // 3 — The split
    scenes.push({
      id: 'c-split',
      gradient: GRADIENTS.fuchsiaIndigo,
      tag: TAG_COMBINED,
      kicker: 'Where it went',
      headline: <>Rides vs Eats</>,
      custom: (
        <SplitBlock
          ridesSpend={combined.ridesSpend}
          eatsSpend={combined.eatsSpend}
          ridesCount={combined.ridesCount}
          eatsCount={combined.eatsCount}
          currency={combined.currency}
        />
      ),
    });
  } else if (hasRides) {
    scenes.push({
      id: 'c-rides-total',
      gradient: GRADIENTS.amberRed,
      tag: TAG_RIDES,
      kicker: 'All in, you spent',
      headline: <CountUp value={stats.totalSpend} format={(n) => formatMoney(n, stats.currency)} blurIn durationMs={2000} />,
      sub: `getting driven around · ${pluralize(stats.totalRides, 'ride')}`,
    });
  } else if (hasEats && eats) {
    scenes.push({
      id: 'c-eats-total',
      gradient: GRADIENTS.orangePink,
      tag: TAG_EATS,
      kicker: 'All in, you spent',
      headline: <CountUp value={eats.totalSpend} format={(n) => formatMoney(n, eats.currency)} blurIn durationMs={2000} />,
      sub: `on delivery · ${pluralize(eats.orderCount, 'order')}`,
    });
  }

  // 4 — Rides headline: the single best rides moment.
  if (hasRides) {
    if (stats.mostExpensiveTrip?.amount) {
      scenes.push({
        id: 'c-rides-priciest',
        gradient: GRADIENTS.cyanGreen,
        tag: TAG_RIDES,
        kicker: 'Your priciest ride',
        headline: <CountUp value={stats.mostExpensiveTrip.amount} format={(n) => formatMoney(n, stats.currency)} blurIn />,
        sub: `${stats.mostExpensiveTrip.city ?? 'Somewhere'} · ${formatDate(stats.mostExpensiveTrip.date)}`,
      });
    } else {
      scenes.push({
        id: 'c-rides-count',
        gradient: GRADIENTS.cyanGreen,
        tag: TAG_RIDES,
        kicker: 'You took',
        headline: <CountUp value={stats.totalRides} blurIn />,
        sub: 'rides',
      });
    }
  }

  // 5 — Eats headline: most-ordered item, else top restaurant loyalty.
  if (hasEats && eats) {
    if (eats.mostOrderedItem) {
      scenes.push({
        id: 'c-eats-item',
        gradient: GRADIENTS.orangePink,
        tag: TAG_EATS,
        kicker: 'You could not stop ordering',
        headline: <>{eats.mostOrderedItem.name}</>,
        sub: `${pluralize(eats.mostOrderedItem.qty, 'time')} — your most-ordered item`,
      });
    } else if (eats.loyalty) {
      scenes.push({
        id: 'c-eats-loyalty',
        gradient: GRADIENTS.orangePink,
        tag: TAG_EATS,
        kicker: 'Your go-to kitchen',
        headline: <>{eats.loyalty.restaurant}</>,
        sub: `${pluralize(eats.loyalty.orders, 'order')} · ${eats.loyalty.pct}% of all your delivery`,
      });
    }
  }

  // 6 — Cross-service zinger.
  if (both && combined && combined.foodVsRidesPct != null) {
    const pct = combined.foodVsRidesPct;
    scenes.push({
      id: 'c-zinger',
      gradient: GRADIENTS.magentaViolet,
      tag: TAG_COMBINED,
      kicker: 'The verdict',
      headline:
        pct >= 0 ? (
          <>
            <CountUp value={pct} blurIn />% more on food
          </>
        ) : (
          <>
            <CountUp value={Math.abs(pct)} blurIn />% more on rides
          </>
        ),
      sub: pct >= 0 ? 'than getting driven around' : 'than getting food delivered',
    });
  }

  // 7 — A couple more category bests (curated, conditional).
  if (hasEats && eats?.loyalty && eats.mostOrderedItem) {
    // loyalty wasn't used as the headline; surface it here.
    scenes.push({
      id: 'c-eats-loyalty-2',
      gradient: GRADIENTS.limeTeal,
      tag: TAG_EATS,
      kicker: 'A regular',
      headline: <>{eats.loyalty.restaurant}</>,
      sub: `${pluralize(eats.loyalty.orders, 'order')} · ${eats.loyalty.pct}% of your delivery`,
    });
  }

  if (hasEats && eats?.mostExpensiveItem?.price) {
    scenes.push({
      id: 'c-eats-priciest-item',
      gradient: GRADIENTS.amberRed,
      tag: TAG_EATS,
      kicker: 'The big-ticket bite',
      headline: <CountUp value={eats.mostExpensiveItem.price} format={(n) => formatMoney(n, eats.currency)} blurIn />,
      sub: eats.mostExpensiveItem.name ?? 'one very expensive item',
    });
  }

  if (hasEats && eats && eats.lateNightOrders >= 2) {
    scenes.push({
      id: 'c-eats-latenight',
      gradient: GRADIENTS.fuchsiaIndigo,
      tag: TAG_EATS,
      kicker: 'After midnight',
      headline: (
        <>
          <CountUp value={eats.lateNightOrders} blurIn /> late-night orders
        </>
      ),
      sub: eats.favoriteHour != null ? `you peak around ${formatHour(eats.favoriteHour)}` : 'the cravings hit hard',
    });
  }

  if (hasRides && stats.totalSurgeFare > 0) {
    scenes.push({
      id: 'c-rides-surge',
      gradient: GRADIENTS.emeraldBlue,
      tag: TAG_RIDES,
      kicker: 'The impatience tax',
      headline: <CountUp value={stats.totalSurgeFare} format={(n) => formatMoney(n, stats.currency)} blurIn />,
      sub: `paid in surge across ${pluralize(stats.surgedRides, 'ride')}`,
    });
  }

  if (hasEats && eats && eats.specialInstructionSamples.length > 0) {
    scenes.push({
      id: 'c-eats-instructions',
      gradient: GRADIENTS.orangePink,
      tag: TAG_EATS,
      kicker: 'You actually wrote',
      headline: <span className="text-[clamp(1.5rem,6vw,3rem)]">"{eats.specialInstructionSamples[0]}"</span>,
      sub: 'to a stranger holding your food',
    });
  }

  // All-time: the rides timeline as a chart interstitial.
  if (at && at.byYear.length > 1) {
    scenes.push({
      id: 'c-timeline',
      gradient: GRADIENTS.iceIndigo,
      tag: TAG_RIDES,
      kicker: 'Year by year',
      headline: <>Your rides timeline</>,
      custom: (
        <div className="mx-auto max-w-xl">
          <SpendByYear data={at.byYear} currency={stats.currency} peakYear={at.peakYearBySpend} light height={240} />
        </div>
      ),
    });
  }

  // 8 — Signature roast spotlight: the top 2 ranked roasts as feature cards.
  roasts.slice(0, 2).forEach((roast, i) => {
    scenes.push({
      id: `c-roast-${roast.id}`,
      gradient: i === 0 ? GRADIENTS.emeraldBlue : GRADIENTS.fuchsiaIndigo,
      kicker: 'Put another way',
      roast,
    });
  });

  // 9 — Outro
  scenes.push({
    id: 'c-outro',
    gradient: GRADIENTS.magentaViolet,
    kicker: "That's a wrap",
    headline: <>That's your Uber Wrapped.</>,
    footer: (
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={actions.onDashboard}
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.04] active:scale-95"
          >
            See full dashboard
          </button>
          <button
            onClick={actions.onShare}
            className="rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            Share
          </button>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
          {actions.onPickAnother && (
            <button onClick={actions.onPickAnother} className="underline underline-offset-2 hover:text-white">
              ← Pick another Wrapped
            </button>
          )}
          <button onClick={actions.onRestart} className="underline underline-offset-2 hover:text-white">
            Try another zip
          </button>
        </div>
      </div>
    ),
  });

  return scenes;
}
