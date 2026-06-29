import type { ReactNode } from 'react';
import type { Insights, Roast } from '../types/insights';
import { CountUp } from '../components/CountUp';
import { formatMoney, formatDate, pluralize } from '../lib/format';
import { GRADIENTS, type Gradient } from '../styles/gradients';

export interface SceneActions {
  onDashboard: () => void;
  onShare: () => void;
  onRestart: () => void;
  onPickAnother?: () => void;
}

export interface Scene {
  id: string;
  gradient: Gradient;
  kicker?: string;
  /** Big headline content (string or count-up). Omitted for pure roast scenes. */
  headline?: ReactNode;
  sub?: ReactNode;
  /** When set, the scene features this roast as a RoastCard. */
  roast?: Roast;
  /** Arbitrary custom content (e.g. the all-time timeline chart). */
  custom?: ReactNode;
  /** Outro action row. */
  footer?: ReactNode;
}

const TIME_PHRASE: Record<string, string> = {
  'Late Night': 'a Late-Night Uber person',
  Morning: 'a Morning-Commute Uber person',
  Afternoon: 'an Afternoon Uber person',
  Evening: 'an Evening-Out Uber person',
  Night: 'a Night-Owl Uber person',
};

export function buildScenes(insights: Insights, actions: SceneActions): Scene[] {
  const { stats, roasts } = insights;
  const scenes: Scene[] = [];

  scenes.push({
    id: 'intro',
    gradient: GRADIENTS.iceIndigo,
    kicker: 'Uber Wrapped',
    headline: <>Let's relive your year in Uber.</>,
    sub: `${stats.dateRange.label} · ${pluralize(stats.totalRides, 'completed ride')}`,
  });

  scenes.push({
    id: 'rides',
    gradient: GRADIENTS.magentaViolet,
    kicker: 'You took',
    headline: <CountUp value={stats.totalRides} blurIn />,
    sub: 'rides this year',
  });

  scenes.push({
    id: 'spend',
    gradient: GRADIENTS.amberRed,
    kicker: 'And you spent',
    headline: <CountUp value={stats.totalSpend} format={(n) => formatMoney(n, stats.currency)} blurIn />,
    sub: 'getting driven around',
  });

  // Top 2 roasts as feature cards.
  roasts.slice(0, 2).forEach((roast, i) => {
    scenes.push({
      id: `roast-${roast.id}`,
      gradient: i === 0 ? GRADIENTS.emeraldBlue : GRADIENTS.fuchsiaIndigo,
      kicker: 'Put another way',
      roast,
    });
  });

  if (stats.topCity) {
    scenes.push({
      id: 'city',
      gradient: GRADIENTS.orangePink,
      kicker: 'Your home turf',
      headline: stats.topCity.city,
      sub: `${pluralize(stats.topCity.rides, 'ride')} started here`,
    });
  }

  if (stats.mostExpensiveTrip?.amount) {
    scenes.push({
      id: 'most-expensive',
      gradient: GRADIENTS.amberRed,
      kicker: 'Your priciest ride',
      headline: (
        <CountUp value={stats.mostExpensiveTrip.amount} format={(n) => formatMoney(n, stats.currency)} blurIn />
      ),
      sub: `${stats.mostExpensiveTrip.city ?? 'Somewhere'} · ${formatDate(stats.mostExpensiveTrip.date)}`,
    });
  }

  if (stats.favoriteTimeOfDay) {
    scenes.push({
      id: 'time',
      gradient: GRADIENTS.fuchsiaIndigo,
      kicker: 'Your vibe',
      headline: <>You're {TIME_PHRASE[stats.favoriteTimeOfDay.bucket]}</>,
      sub: stats.busiestDayOfWeek ? `Busiest on ${stats.busiestDayOfWeek.day}s` : undefined,
    });
  }

  if (stats.totalDistanceMiles > 0) {
    const distanceRoast = roasts.find((r) => r.category === 'distance');
    scenes.push({
      id: 'distance',
      gradient: GRADIENTS.cyanGreen,
      kicker: 'Total distance',
      headline: (
        <>
          <CountUp value={stats.totalDistanceMiles} blurIn /> <span className="text-3xl sm:text-5xl">mi</span>
        </>
      ),
      sub: distanceRoast ? distanceRoast.headline : undefined,
    });
  }

  // Time in car
  const hoursInCar = stats.totalDurationSeconds / 3600;
  if (hoursInCar >= 1) {
    scenes.push({
      id: 'time-in-car',
      gradient: GRADIENTS.iceIndigo,
      kicker: 'Time well spent?',
      headline: (
        <>
          <CountUp value={Math.round(hoursInCar)} blurIn /> <span className="text-3xl sm:text-5xl">hrs</span>
        </>
      ),
      sub: 'in the back of an Uber',
    });
  }

  // Surge "tax"
  if (stats.totalSurgeFare > 0) {
    scenes.push({
      id: 'surge',
      gradient: GRADIENTS.amberRed,
      kicker: 'The impatience tax',
      headline: <CountUp value={stats.totalSurgeFare} format={(n) => formatMoney(n, stats.currency)} blurIn />,
      sub: `paid in surge pricing across ${pluralize(stats.surgedRides, 'ride')}`,
    });
  }

  // Money saved
  if (stats.totalSaved > 0) {
    scenes.push({
      id: 'saved',
      gradient: GRADIENTS.limeTeal,
      kicker: 'Small wins',
      headline: <CountUp value={stats.totalSaved} format={(n) => formatMoney(n, stats.currency)} blurIn />,
      sub: 'saved with promos & credits',
    });
  }

  scenes.push({
    id: 'outro',
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
