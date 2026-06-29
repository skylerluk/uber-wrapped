import type { ReactNode } from 'react';
import type { Insights, Roast, CityBucket, ProductBucket } from '../types/insights';
import { StatCard } from '../components/StatCard';
import { SpendOverTime } from '../components/charts/SpendOverTime';
import { RidesByHour } from '../components/charts/RidesByHour';
import { SpendByYear } from '../components/charts/SpendByYear';
import { formatMoney, formatNumber, formatDate, formatDuration, formatMonthLabel } from '../lib/format';

interface DashboardProps {
  insights: Insights;
  aiRoasts?: Roast[];
  aiPending?: boolean;
  onRestart: () => void;
  onReplay: () => void;
  onShare: () => void;
  onPickAnother?: () => void;
}

function Card({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`elevated rounded-[20px] border border-hairline bg-surface p-5 ${className ?? ''}`}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dim">{title}</h2>
      {children}
    </section>
  );
}

/** Small stat tile for the "by the numbers" grid. */
function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-2 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-dim">{label}</p>
      <p className="mt-1 display-number text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-dim">{hint}</p>}
    </div>
  );
}

/** Horizontal bar list reused for cities and product mix. */
function BarList({
  rows,
  currency,
}: {
  rows: { label: string; rides: number; spend: number }[];
  currency: string | null;
}) {
  const max = Math.max(1, ...rows.map((r) => r.rides));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium">{r.label}</span>
            <span className="tabular-nums text-dim">
              {formatNumber(r.rides)} · {formatMoney(r.spend, currency)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full bg-white/80" style={{ width: `${(r.rides / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Dashboard({ insights, aiRoasts = [], aiPending, onRestart, onReplay, onShare, onPickAnother }: DashboardProps) {
  const { stats } = insights;
  const a = stats.available;
  const at = insights.allTime;
  const yoyByYear = new Map((at?.yoy ?? []).map((y) => [y.year, y]));
  const roasts = [...insights.roasts, ...aiRoasts].sort((a, b) => b.funScore - a.funScore);

  const cityRows = stats.cityBreakdown.slice(0, 6).map((c: CityBucket) => ({
    label: c.city,
    rides: c.rides,
    spend: c.spend,
  }));
  const productRows = stats.productMix.slice(0, 6).map((p: ProductBucket) => ({
    label: p.product,
    rides: p.rides,
    spend: p.spend,
  }));

  // "By the numbers" tiles — each only included when its source data exists.
  const tiles: ReactNode[] = [];
  if (a.duration)
    tiles.push(
      <Tile key="hours" label="Time in car" value={formatDuration(stats.totalDurationSeconds)} hint={`avg ${formatDuration(stats.avgDurationSeconds)}/ride`} />,
    );
  if (a.distance && stats.avgPerMile > 0)
    tiles.push(<Tile key="permile" label="Per mile" value={formatMoney(stats.avgPerMile, stats.currency, { decimals: true })} />);
  if (a.perMinute && stats.avgPerMinute > 0)
    tiles.push(<Tile key="permin" label="Per minute" value={formatMoney(stats.avgPerMinute, stats.currency, { decimals: true })} />);
  if (stats.avgFare > 0)
    tiles.push(<Tile key="avgfare" label="Avg fare" value={formatMoney(stats.avgFare, stats.currency)} />);
  if (a.surge && stats.totalSurgeFare > 0)
    tiles.push(<Tile key="surge" label="Surge pricing" value={formatMoney(stats.totalSurgeFare, stats.currency)} hint={`${formatNumber(stats.surgedRides)} surged`} />);
  if (a.tolls && stats.totalTolls > 0)
    tiles.push(<Tile key="tolls" label="Tolls" value={formatMoney(stats.totalTolls, stats.currency)} />);
  if (a.fees && stats.totalFees > 0)
    tiles.push(<Tile key="fees" label="Booking & service fees" value={formatMoney(stats.totalFees, stats.currency)} />);
  if (a.savings && stats.totalSaved > 0)
    tiles.push(<Tile key="saved" label="Saved (promos/credits)" value={formatMoney(stats.totalSaved, stats.currency)} />);
  if (stats.airportRides > 0)
    tiles.push(<Tile key="airport" label="Airport runs" value={formatNumber(stats.airportRides)} />);
  if (stats.scheduledRides > 0)
    tiles.push(<Tile key="sched" label="Scheduled" value={formatNumber(stats.scheduledRides)} />);

  const showSpendChart = stats.totalSpendByMonth.length > 1;
  const showCharts = showSpendChart || a.time;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-number text-4xl sm:text-5xl">
            {insights.meta.timeframe.kind === 'all' ? 'Your Uber Wrapped' : `${insights.meta.label} Wrapped`}
          </h1>
          <p className="mt-1 text-dim">
            {insights.meta.timeframe.kind === 'all' ? `All Time · ${stats.dateRange.label}` : stats.dateRange.label}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onShare}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.04] active:scale-95"
          >
            Share
          </button>
          <button
            onClick={onReplay}
            className="rounded-full border border-hairline px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
          >
            Replay story
          </button>
          {onPickAnother && (
            <button
              onClick={onPickAnother}
              className="rounded-full border border-hairline px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
            >
              Pick another
            </button>
          )}
          <button
            onClick={onRestart}
            className="rounded-full border border-hairline px-5 py-2.5 text-sm font-semibold text-dim transition-colors hover:bg-surface-2 hover:text-text"
          >
            Try another zip
          </button>
        </div>
      </header>

      {/* Hero stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total spend" value={stats.totalSpend} format={(n) => formatMoney(n, stats.currency)} />
        <StatCard label="Total rides" value={stats.totalRides} />
        {a.distance && (
          <StatCard label="Distance" value={stats.totalDistanceMiles} format={(n) => `${formatNumber(n)} mi`} />
        )}
        <StatCard
          label="Date range"
          display={stats.dateRange.label}
          hint={stats.canceledRides > 0 ? `${formatNumber(stats.canceledRides)} canceled` : undefined}
        />
      </div>

      {/* All-time: years overview */}
      {at && at.byYear.length > 1 && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Years active" display={at.spanLabel || String(at.yearsActive)} />
            {at.peakYearBySpend != null && <StatCard label="Peak year" display={String(at.peakYearBySpend)} />}
            {at.firstRide && <StatCard label="First ride" display={formatDate(at.firstRide)} />}
            <StatCard label="Cities all-time" value={at.distinctCitiesAllTime} />
          </div>

          <Card title="Spend by year" className="mb-6">
            <SpendByYear data={at.byYear} currency={stats.currency} />
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-dim">
                    <th className="pb-2 font-medium">Year</th>
                    <th className="pb-2 text-right font-medium">Spend</th>
                    <th className="pb-2 text-right font-medium">Rides</th>
                    <th className="pb-2 text-right font-medium">Distance</th>
                    <th className="pb-2 text-right font-medium">YoY</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[...at.byYear].reverse().map((y) => {
                    const d = yoyByYear.get(y.year);
                    const pct = d?.spendPct;
                    return (
                      <tr key={y.year} className="border-t border-hairline">
                        <td className="py-2 font-semibold">{y.year}</td>
                        <td className="py-2 text-right">{formatMoney(y.spend, stats.currency)}</td>
                        <td className="py-2 text-right text-dim">{formatNumber(y.rides)}</td>
                        <td className="py-2 text-right text-dim">{formatNumber(y.distance)} mi</td>
                        <td className={`py-2 text-right ${pct == null ? 'text-faint' : pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pct == null ? '—' : `${pct >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(pct))}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {at.spendMilestones.length > 0 && (
            <Card title="Milestones" className="mb-6">
              <ul className="flex flex-wrap gap-2 text-sm">
                {at.spendMilestones.map((m) => (
                  <li key={m.amount} className="rounded-full border border-hairline bg-surface-2 px-3 py-1.5">
                    <span className="font-semibold">{formatMoney(m.amount, stats.currency)}</span>{' '}
                    <span className="text-dim">· {formatMonthLabel(m.month)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {/* Charts */}
      {showCharts && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {showSpendChart && (
            <Card title="Spend over time">
              <SpendOverTime data={stats.totalSpendByMonth} currency={stats.currency} />
            </Card>
          )}
          {a.time && (
            <Card title="Rides by hour of day">
              <RidesByHour ridesByHour={stats.ridesByHour} />
            </Card>
          )}
        </div>
      )}

      {/* By the numbers */}
      {tiles.length > 0 && (
        <Card title="By the numbers" className="mb-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{tiles}</div>
        </Card>
      )}

      {/* Cities + product mix */}
      {(a.city || a.product) && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {a.city && (
            <Card title="Top cities">
              <BarList rows={cityRows} currency={stats.currency} />
            </Card>
          )}
          {a.product && (
            <Card title="Product mix">
              <BarList rows={productRows} currency={stats.currency} />
            </Card>
          )}
        </div>
      )}

      {/* Payment + cancellations */}
      {(a.payment || stats.canceledRides > 0) && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {a.payment && (
            <Card title="Payment method">
              <ul className="space-y-2 text-sm">
                {stats.paymentSplit.map((p) => (
                  <li key={p.method} className="flex justify-between">
                    <span className="font-medium">{p.method.replace(/_/g, ' ')}</span>
                    <span className="tabular-nums text-dim">{formatNumber(p.count)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {stats.canceledRides > 0 && (
            <Card title="Cancellations">
              <p className="display-number text-3xl">{formatNumber(stats.riderCanceledRides || stats.canceledRides)}</p>
              <p className="mt-1 text-xs text-dim">
                rides canceled
                {stats.cancellationFeesPaid > 0 && ` · ${formatMoney(stats.cancellationFeesPaid, stats.currency)} in fees`}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Superlatives */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.mostExpensiveTrip?.amount != null && (
          <Card title="Most expensive">
            <p className="display-number text-2xl">{formatMoney(stats.mostExpensiveTrip.amount, stats.currency)}</p>
            <p className="mt-1 text-xs text-dim">
              {stats.mostExpensiveTrip.city ?? '—'} · {formatDate(stats.mostExpensiveTrip.date)}
            </p>
          </Card>
        )}
        {a.distance && stats.longestTrip?.distanceMiles != null && (
          <Card title="Longest trip">
            <p className="display-number text-2xl">{formatNumber(stats.longestTrip.distanceMiles)} mi</p>
            <p className="mt-1 text-xs text-dim">{stats.longestTrip.city ?? '—'}</p>
          </Card>
        )}
        {a.duration && stats.longestDurationTrip?.durationSeconds != null && (
          <Card title="Longest ride">
            <p className="display-number text-2xl">{formatDuration(stats.longestDurationTrip.durationSeconds)}</p>
            <p className="mt-1 text-xs text-dim">{stats.longestDurationTrip.city ?? '—'}</p>
          </Card>
        )}
      </div>

      {/* Roast wall */}
      <Card title="Fun facts & roasts">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {aiPending && (
            <div className="flex animate-pulse items-center justify-center rounded-2xl border border-dashed border-hairline bg-surface-2 p-4 text-sm text-dim">
              ✨ summoning more roasts…
            </div>
          )}
          {roasts.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-hairline bg-surface-2 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:border-hairline-strong"
            >
              <p className="text-2xl">{r.emoji}</p>
              <p className="mt-2 font-semibold leading-snug">{r.headline}</p>
              <p className="mt-1 text-xs text-dim">{r.sub}</p>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-10 text-center text-xs text-dim">
        🔒 Everything here was computed in your browser. Your ride data never left this device.
      </p>
    </main>
  );
}
