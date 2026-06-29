import { motion } from 'framer-motion';
import type { AllInsights } from '../lib/insights';
import { timeframeKey } from '../lib/insights';
import type { Timeframe } from '../types/insights';
import { formatMoney, formatNumber } from '../lib/format';
import { GRADIENTS } from '../styles/gradients';

interface PickerProps {
  all: AllInsights;
  onSelect: (tf: Timeframe) => void;
  onRestart: () => void;
}

export function Picker({ all, onSelect, onRestart }: PickerProps) {
  const allTime = all.byTimeframe.get('all')!;
  const at = allTime.allTime;
  const currency = allTime.stats.currency;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center px-5 py-14 sm:px-8">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 text-center"
      >
        <h1 className="display-number text-4xl sm:text-5xl">Pick your Wrapped</h1>
        <p className="mt-3 text-dim">Relive a single year — or see your whole story.</p>
      </motion.header>

      {/* All-Time hero card */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        autoFocus
        onClick={() => onSelect({ kind: 'all' })}
        className="grain elevated group relative mb-5 overflow-hidden rounded-[26px] p-7 text-left text-white outline-none ring-white/40 transition-transform hover:scale-[1.01] focus-visible:ring-2 sm:p-9"
        style={{ background: `linear-gradient(150deg, ${GRADIENTS.magentaViolet.from}, ${GRADIENTS.magentaViolet.to})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/15" />
        <div className="relative">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest backdrop-blur">
            ★ Recommended
          </span>
          <h2 className="mt-4 display-number text-4xl sm:text-5xl">All&nbsp;Time</h2>
          <p className="mt-2 text-white/85">
            {formatMoney(allTime.stats.totalSpend, currency)} · {formatNumber(allTime.stats.totalRides)} rides
            {at && at.yearsActive > 1 ? ` · ${at.spanLabel}` : ''}
          </p>
          <p className="mt-5 text-sm font-semibold">See your whole story →</p>
        </div>
      </motion.button>

      {/* Year cards (newest first) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {all.years.map((year, i) => {
          const ins = all.byTimeframe.get(timeframeKey({ kind: 'year', year }))!;
          const quiet = ins.stats.totalRides < 5;
          return (
            <motion.button
              key={year}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelect({ kind: 'year', year })}
              className="elevated rounded-2xl border border-hairline bg-surface p-5 text-left outline-none ring-white/30 transition-all hover:-translate-y-0.5 hover:border-hairline-strong focus-visible:ring-2"
            >
              <div className="flex items-center justify-between">
                <span className="display-number text-2xl">{year}</span>
                {quiet && (
                  <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-wider text-dim">
                    quiet year
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-dim">
                {formatMoney(ins.stats.totalSpend, currency)} · {formatNumber(ins.stats.totalRides)} rides
              </p>
            </motion.button>
          );
        })}
      </div>

      <button onClick={onRestart} className="mx-auto mt-10 text-xs text-dim underline underline-offset-2 hover:text-text">
        Try another zip
      </button>
    </main>
  );
}
