import { motion } from 'framer-motion';
import type { AllInsights } from '../lib/insights';
import type { Timeframe } from '../types/insights';
import { GRADIENTS } from '../styles/gradients';

interface PickerProps {
  all: AllInsights;
  onSelect: (tf: Timeframe) => void;
  onRestart: () => void;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Picker({ all, onSelect, onRestart }: PickerProps) {
  // Year cards enter first; the All-Time hero lands last and settles.
  const heroDelay = 0.1 + all.years.length * 0.05 + 0.05;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center px-5 py-14 sm:px-8">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-8 text-center"
      >
        <h1 className="display-number text-4xl sm:text-5xl">Pick your Wrapped</h1>
        <p className="mt-3 text-dim">
          Your year in Uber rides <span className="text-text">and</span> Uber Eats — relive a single
          year or see your whole story.
        </p>
      </motion.header>

      {/* All-Time hero card */}
      <motion.button
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: heroDelay, type: 'spring', stiffness: 260, damping: 22 }}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.99 }}
        autoFocus
        onClick={() => onSelect({ kind: 'all' })}
        className="grain elevated group relative mb-5 overflow-hidden rounded-[26px] p-7 text-left text-white outline-none ring-white/40 focus-visible:ring-2 sm:p-9"
        style={{ background: `linear-gradient(150deg, ${GRADIENTS.magentaViolet.from}, ${GRADIENTS.magentaViolet.to})` }}
      >
        {/* drifting inner light */}
        <div
          className="gradient-drift pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(60% 70% at 30% 20%, rgba(255,255,255,0.25), transparent 60%)' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-black/15" />
        <div className="relative">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest backdrop-blur">
            ★ Recommended
          </span>
          <h2 className="mt-4 display-number text-4xl sm:text-5xl">All&nbsp;Time</h2>
          <p className="mt-2 text-lg text-white/90">🚗 Rides + 🍔 Uber Eats, combined</p>
          <p className="mt-5 text-sm font-semibold">See your whole story →</p>
        </div>
      </motion.button>

      {/* Year cards (newest first) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {all.years.map((year, i) => (
          <motion.button
            key={year}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: EASE }}
            onClick={() => onSelect({ kind: 'year', year })}
            className="group elevated relative overflow-hidden rounded-2xl border border-hairline bg-surface p-5 text-left outline-none ring-white/30 transition-all hover:-translate-y-0.5 hover:border-hairline-strong focus-visible:ring-2"
          >
            {/* hover gradient sweep */}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(90% 120% at 0% 0%, ${GRADIENTS.iceIndigo.from}22, transparent 55%)` }}
            />
            <div className="relative flex items-center justify-between">
              <span className="display-number text-2xl">{year}</span>
              <span className="text-sm text-dim transition-colors group-hover:text-text">View →</span>
            </div>
          </motion.button>
        ))}
      </div>

      <button onClick={onRestart} className="mx-auto mt-10 text-xs text-dim underline underline-offset-2 hover:text-text">
        Try another zip
      </button>
    </main>
  );
}
