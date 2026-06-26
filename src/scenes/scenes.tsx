import type { ReactNode } from 'react';
import type { Insights, Roast } from '../types/insights';
import { CountUp } from '../components/CountUp';
import { formatMoney, formatNumber, formatDate } from '../lib/format';
import { GRADIENTS, type Gradient } from '../styles/gradients';

export interface SceneActions {
  onDashboard: () => void;
  onShare: () => void;
  onRestart: () => void;
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
    sub: `${stats.dateRange.label} · ${formatNumber(stats.totalRides)} completed rides`,
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
      sub: `${formatNumber(stats.topCity.rides)} rides started here`,
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

  scenes.push({
    id: 'outro',
    gradient: GRADIENTS.limeTeal,
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
        <button onClick={actions.onRestart} className="mt-2 text-xs text-white/60 underline underline-offset-2">
          Try another zip
        </button>
      </div>
    ),
  });

  return scenes;
}
