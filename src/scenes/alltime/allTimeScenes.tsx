import type { Insights } from '../../types/insights';
import type { Scene, SceneActions } from '../scenes';
import { CountUp } from '../../components/CountUp';
import { SpendByYear } from '../../components/charts/SpendByYear';
import { formatMoney, formatNumber, formatDate, formatMonthLabel, pluralize } from '../../lib/format';
import { GRADIENTS } from '../../styles/gradients';

/**
 * The flagship all-time scene set — a longitudinal "your whole Uber story".
 * Each scene is conditional on its data so sparse histories degrade cleanly.
 */
export function buildAllTimeScenes(insights: Insights, actions: SceneActions): Scene[] {
  const { stats, roasts, allTime: at } = insights;
  const scenes: Scene[] = [];
  if (!at) return scenes;

  // 1 — Opening
  scenes.push({
    id: 'at-open',
    gradient: GRADIENTS.iceIndigo,
    kicker: 'Your Uber story',
    headline:
      at.yearsActive > 1 && at.spanLabel ? (
        <>You've been an Uber person for {at.spanLabel}.</>
      ) : (
        <>Let's relive your whole Uber story.</>
      ),
    sub: at.firstRide ? `From ${formatDate(at.firstRide)} to ${formatDate(at.lastRide)}` : undefined,
  });

  // 2 — Grand total spend
  scenes.push({
    id: 'at-spend',
    gradient: GRADIENTS.amberRed,
    kicker: 'All in, you have spent',
    headline: <CountUp value={stats.totalSpend} format={(n) => formatMoney(n, stats.currency)} blurIn durationMs={2000} />,
    sub: at.yearsActive > 1 ? `across ${pluralize(at.yearsActive, 'year')}` : 'on Uber',
  });

  // 3 — Lifetime rides & distance
  scenes.push({
    id: 'at-rides',
    gradient: GRADIENTS.magentaViolet,
    kicker: 'That comes to',
    headline: <CountUp value={stats.totalRides} blurIn />,
    sub:
      stats.totalDistanceMiles > 0
        ? `rides · ${formatNumber(stats.totalDistanceMiles)} miles`
        : 'lifetime rides',
  });

  // 4 — Mega roast (top big/longitudinal roast)
  const megaRoast = roasts.find((r) => r.id.startsWith('alltime-')) ?? roasts[0];
  if (megaRoast) {
    scenes.push({ id: `at-roast-${megaRoast.id}`, gradient: GRADIENTS.emeraldBlue, kicker: 'Put another way', roast: megaRoast });
  }

  // 5 — Timeline (hero)
  if (at.byYear.length > 1) {
    scenes.push({
      id: 'at-timeline',
      gradient: GRADIENTS.fuchsiaIndigo,
      kicker: 'Year by year',
      headline: <>Your Uber timeline</>,
      custom: (
        <div className="mx-auto max-w-xl">
          <SpendByYear data={at.byYear} currency={stats.currency} peakYear={at.peakYearBySpend} light height={260} />
        </div>
      ),
    });
  }

  // 6 — Peak year
  if (at.peakYearBySpend != null && at.byYear.length > 1) {
    const y = at.byYear.find((b) => b.year === at.peakYearBySpend);
    if (y) {
      scenes.push({
        id: 'at-peak',
        gradient: GRADIENTS.orangePink,
        kicker: 'Your Uber era',
        headline: <>{y.year}</>,
        sub: `${formatMoney(y.spend, stats.currency)} across ${pluralize(y.rides, 'ride')} — your biggest year`,
      });
    }
  }

  // 7 — Evolution (YoY)
  if (at.biggestJump && at.biggestJump.spendPct != null && at.biggestJump.spendPct >= 15) {
    const j = at.biggestJump;
    scenes.push({
      id: 'at-yoy',
      gradient: GRADIENTS.cyanGreen,
      kicker: 'You evolved',
      headline: (
        <>
          <CountUp value={Math.round(j.spendPct!)} blurIn />% more
        </>
      ),
      sub: `in ${j.year} than ${j.prevYear}`,
    });
  }

  // 8 — Cities across time
  if (at.distinctCitiesAllTime >= 2) {
    scenes.push({
      id: 'at-cities',
      gradient: GRADIENTS.limeTeal,
      kicker: 'Everywhere you went',
      headline: (
        <>
          <CountUp value={at.distinctCitiesAllTime} blurIn /> cities
        </>
      ),
      sub: stats.topCity ? `across ${pluralize(at.yearsActive, 'year')} · most in ${stats.topCity.city}` : `across ${pluralize(at.yearsActive, 'year')}`,
    });
  }

  // 9 — Lifetime superlative (priciest ride ever)
  if (stats.mostExpensiveTrip?.amount != null) {
    scenes.push({
      id: 'at-priciest',
      gradient: GRADIENTS.amberRed,
      kicker: 'Your priciest ride ever',
      headline: <CountUp value={stats.mostExpensiveTrip.amount} format={(n) => formatMoney(n, stats.currency)} blurIn />,
      sub: `${stats.mostExpensiveTrip.city ?? 'Somewhere'} · ${formatDate(stats.mostExpensiveTrip.date)}`,
    });
  }

  // 10 — Milestone
  const lastMilestone = at.spendMilestones[at.spendMilestones.length - 1];
  if (lastMilestone) {
    scenes.push({
      id: 'at-milestone',
      gradient: GRADIENTS.iceIndigo,
      kicker: 'The moment it added up',
      headline: <>{formatMoney(lastMilestone.amount, stats.currency)}</>,
      sub: `total — crossed in ${formatMonthLabel(lastMilestone.month)}`,
    });
  }

  // 11 — Outro
  scenes.push({
    id: 'at-outro',
    gradient: GRADIENTS.magentaViolet,
    kicker: "That's your Uber story",
    headline: <>That's your Uber story.</>,
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
            Share your story
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
