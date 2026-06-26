import type { Insights, Roast } from '../types/insights';
import { StatCard } from '../components/StatCard';
import { SpendOverTime } from '../components/charts/SpendOverTime';
import { RidesByHour } from '../components/charts/RidesByHour';
import { formatMoney, formatNumber, formatDate } from '../lib/format';

interface DashboardProps {
  insights: Insights;
  aiRoasts?: Roast[];
  aiPending?: boolean;
  onRestart: () => void;
  onReplay: () => void;
  onShare: () => void;
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`elevated rounded-[20px] border border-hairline bg-surface p-5 ${className ?? ''}`}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dim">{title}</h2>
      {children}
    </section>
  );
}

export function Dashboard({ insights, aiRoasts = [], aiPending, onRestart, onReplay, onShare }: DashboardProps) {
  const { stats } = insights;
  const roasts = [...insights.roasts, ...aiRoasts].sort((a, b) => b.funScore - a.funScore);
  const maxCityRides = Math.max(1, ...stats.cityBreakdown.map((c) => c.rides));

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">Your Uber Wrapped</h1>
          <p className="mt-1 text-dim">{stats.dateRange.label}</p>
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
        <StatCard label="Distance" value={stats.totalDistanceMiles} format={(n) => `${formatNumber(n)} mi`} />
        <StatCard label="Date range" display={stats.dateRange.label} hint={`${formatNumber(stats.canceledRides)} canceled`} />
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card title="Spend over time">
          {stats.totalSpendByMonth.length > 1 ? (
            <SpendOverTime data={stats.totalSpendByMonth} currency={stats.currency} />
          ) : (
            <p className="py-10 text-center text-sm text-dim">Not enough months to chart.</p>
          )}
        </Card>
        <Card title="Rides by hour of day">
          <RidesByHour ridesByHour={stats.ridesByHour} />
        </Card>
      </div>

      {/* Top cities */}
      <Card title="Top cities" className="mb-6">
        {stats.cityBreakdown.length === 0 ? (
          <p className="text-sm text-dim">No city data.</p>
        ) : (
          <ul className="space-y-3">
            {stats.cityBreakdown.slice(0, 6).map((c) => (
              <li key={c.city}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{c.city}</span>
                  <span className="tabular-nums text-dim">
                    {formatNumber(c.rides)} rides · {formatMoney(c.spend, stats.currency)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-white/80"
                    style={{ width: `${(c.rides / maxCityRides) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Superlatives */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card title="Most expensive">
          <p className="font-display text-2xl font-bold">
            {stats.mostExpensiveTrip?.amount != null ? formatMoney(stats.mostExpensiveTrip.amount, stats.currency) : '—'}
          </p>
          <p className="mt-1 text-xs text-dim">
            {stats.mostExpensiveTrip?.city ?? '—'} · {formatDate(stats.mostExpensiveTrip?.date ?? null)}
          </p>
        </Card>
        <Card title="Cheapest">
          <p className="font-display text-2xl font-bold">
            {stats.cheapestTrip?.amount != null ? formatMoney(stats.cheapestTrip.amount, stats.currency) : '—'}
          </p>
          <p className="mt-1 text-xs text-dim">{stats.cheapestTrip?.city ?? '—'}</p>
        </Card>
        <Card title="Longest trip">
          <p className="font-display text-2xl font-bold">
            {stats.longestTrip?.distanceMiles != null ? `${formatNumber(stats.longestTrip.distanceMiles)} mi` : '—'}
          </p>
          <p className="mt-1 text-xs text-dim">{stats.longestTrip?.city ?? '—'}</p>
        </Card>
      </div>

      {/* Roast wall */}
      <Card title="Fun facts & roasts">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {aiPending && (
            <div className="flex animate-pulse items-center justify-center rounded-xl border border-dashed border-hairline bg-surface-2 p-4 text-sm text-dim">
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
