import type { ReactNode } from 'react';
import type { Insights } from '../types/insights';
import { CountUp } from '../components/CountUp';
import { formatMoney, formatNumber, formatDate } from '../lib/format';

export interface SceneActions {
  onDashboard: () => void;
  onShare: () => void;
  onRestart: () => void;
}

export interface Scene {
  id: string;
  /** Duotone gradient [from, to] layered over the black base. */
  gradient: [string, string];
  kicker?: string;
  render: () => ReactNode;
  isOutro?: boolean;
}

// Shared scene content layout.
function SceneText({
  kicker,
  headline,
  sub,
}: {
  kicker?: string;
  headline: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {kicker && (
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          {kicker}
        </p>
      )}
      <div className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
        {headline}
      </div>
      {sub && <p className="mt-6 max-w-sm text-lg text-white/80 sm:text-xl">{sub}</p>}
    </div>
  );
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

  // 1 — Intro
  scenes.push({
    id: 'intro',
    gradient: ['#1e3a8a', '#0ea5e9'],
    kicker: 'Uber Wrapped',
    render: () => (
      <SceneText
        headline={<>Let's relive your year in Uber.</>}
        sub={`${stats.dateRange.label} · ${formatNumber(stats.totalRides)} completed rides`}
      />
    ),
  });

  // 2 — Total rides
  scenes.push({
    id: 'rides',
    gradient: ['#7c3aed', '#db2777'],
    kicker: 'You took',
    render: () => (
      <SceneText headline={<CountUp value={stats.totalRides} />} sub="rides this year" />
    ),
  });

  // 3 — Total spend
  scenes.push({
    id: 'spend',
    gradient: ['#f59e0b', '#ef4444'],
    kicker: 'And you spent',
    render: () => (
      <SceneText
        headline={<CountUp value={stats.totalSpend} format={(n) => formatMoney(n, stats.currency)} />}
        sub="getting driven around"
      />
    ),
  });

  // 4 — The roast(s): top 2
  roasts.slice(0, 2).forEach((roast, i) => {
    scenes.push({
      id: `roast-${roast.id}`,
      gradient: i === 0 ? ['#10b981', '#3b82f6'] : ['#8b5cf6', '#ec4899'],
      kicker: 'Put another way',
      render: () => (
        <SceneText
          headline={
            <>
              {roast.emoji && <span className="mr-2">{roast.emoji}</span>}
              {roast.headline}
            </>
          }
          sub={roast.sub}
        />
      ),
    });
  });

  // 5 — Top city
  if (stats.topCity) {
    scenes.push({
      id: 'city',
      gradient: ['#ec4899', '#8b5cf6'],
      kicker: 'Your home turf',
      render: () => (
        <SceneText
          headline={stats.topCity!.city}
          sub={`${formatNumber(stats.topCity!.rides)} rides started here`}
        />
      ),
    });
  }

  // 6 — Most expensive trip
  if (stats.mostExpensiveTrip?.amount) {
    scenes.push({
      id: 'most-expensive',
      gradient: ['#ef4444', '#f59e0b'],
      kicker: 'Your priciest ride',
      render: () => (
        <SceneText
          headline={
            <CountUp
              value={stats.mostExpensiveTrip!.amount!}
              format={(n) => formatMoney(n, stats.currency)}
            />
          }
          sub={`${stats.mostExpensiveTrip!.city ?? 'Somewhere'} · ${formatDate(stats.mostExpensiveTrip!.date)}`}
        />
      ),
    });
  }

  // 7 — Time personality
  if (stats.favoriteTimeOfDay) {
    scenes.push({
      id: 'time',
      gradient: ['#6366f1', '#ec4899'],
      kicker: 'Your vibe',
      render: () => (
        <SceneText
          headline={<>You're {TIME_PHRASE[stats.favoriteTimeOfDay!.bucket]}</>}
          sub={
            stats.busiestDayOfWeek
              ? `Busiest on ${stats.busiestDayOfWeek.day}s`
              : undefined
          }
        />
      ),
    });
  }

  // 8 — Distance
  if (stats.totalDistanceMiles > 0) {
    const distanceRoast = roasts.find((r) => r.category === 'distance');
    scenes.push({
      id: 'distance',
      gradient: ['#06b6d4', '#22c55e'],
      kicker: 'Total distance',
      render: () => (
        <SceneText
          headline={
            <>
              <CountUp value={stats.totalDistanceMiles} /> <span className="text-3xl sm:text-5xl">mi</span>
            </>
          }
          sub={distanceRoast ? distanceRoast.headline : undefined}
        />
      ),
    });
  }

  // 9 — Outro
  scenes.push({
    id: 'outro',
    gradient: ['#8b5cf6', '#ec4899'],
    isOutro: true,
    render: () => (
      <div className="flex flex-col items-center text-center">
        <SceneText kicker="That's a wrap" headline={<>That's your Uber Wrapped.</>} />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={actions.onDashboard}
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
          >
            See full dashboard
          </button>
          <button
            onClick={actions.onShare}
            className="rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Share
          </button>
        </div>
        <button onClick={actions.onRestart} className="mt-6 text-xs text-white/60 underline">
          Try another zip
        </button>
      </div>
    ),
  });

  return scenes;
}
