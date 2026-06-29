import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { Insights } from '../types/insights';
import { formatMoney, formatNumber } from '../lib/format';
import { GRADIENTS } from '../styles/gradients';

/** The vertical, screenshot-ready summary card (Spotify-Wrapped style). */
function ShareCardVisual({ insights }: { insights: Insights }) {
  const { stats, roasts } = insights;
  const g = GRADIENTS.magentaViolet;
  const hero = roasts[0];

  return (
    <div
      className="relative flex h-[640px] w-[360px] flex-col overflow-hidden rounded-[28px] p-7 text-white"
      style={{ background: `linear-gradient(165deg, ${g.from}, ${g.to})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/30" />
      <div className="grain absolute inset-0 opacity-40" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-[0.2em]">Uber Wrapped</span>
          <span className="text-sm font-semibold opacity-80">{stats.dateRange.label}</span>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Total spent</p>
          <p className="display-number text-6xl">{formatMoney(stats.totalSpend, stats.currency)}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Rides</p>
            <p className="display-number text-3xl">{formatNumber(stats.totalRides)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Miles</p>
            <p className="display-number text-3xl">{formatNumber(stats.totalDistanceMiles)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Top city</p>
            <p className="text-xl font-bold">{stats.topCity?.city ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Priciest ride</p>
            <p className="text-xl font-bold">
              {stats.mostExpensiveTrip?.amount != null ? formatMoney(stats.mostExpensiveTrip.amount, stats.currency) : '—'}
            </p>
          </div>
        </div>

        {hero && (
          <div className="mt-auto rounded-2xl bg-black/25 p-4 backdrop-blur-sm">
            <p className="text-lg font-bold leading-snug">
              {hero.emoji} {hero.headline}
            </p>
          </div>
        )}

        <p className="mt-4 text-center text-xs opacity-70">uber-wrapped.vercel.app</p>
      </div>
    </div>
  );
}

/** Distinct vertical card for the All-Time "Uber story". */
function AllTimeShareCardVisual({ insights }: { insights: Insights }) {
  const { stats, roasts, allTime: at } = insights;
  const g = GRADIENTS.fuchsiaIndigo;
  const hero = roasts.find((r) => r.id.startsWith('alltime-')) ?? roasts[0];

  return (
    <div
      className="relative flex h-[640px] w-[360px] flex-col overflow-hidden rounded-[28px] p-7 text-white"
      style={{ background: `linear-gradient(165deg, ${g.from}, ${g.to})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/30" />
      <div className="grain absolute inset-0 opacity-40" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-[0.2em]">Uber Wrapped</span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest backdrop-blur">
            All Time
          </span>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Lifetime spend</p>
          <p className="display-number text-6xl">{formatMoney(stats.totalSpend, stats.currency)}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Rides</p>
            <p className="display-number text-3xl">{formatNumber(stats.totalRides)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-75">An Uber person for</p>
            <p className="text-xl font-bold">{at?.spanLabel || `${at?.yearsActive ?? 0} years`}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Peak year</p>
            <p className="display-number text-3xl">{at?.peakYearBySpend ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Cities</p>
            <p className="display-number text-3xl">{formatNumber(at?.distinctCitiesAllTime ?? stats.distinctCityCount)}</p>
          </div>
        </div>

        {hero && (
          <div className="mt-auto rounded-2xl bg-black/25 p-4 backdrop-blur-sm">
            <p className="text-lg font-bold leading-snug">
              {hero.emoji} {hero.headline}
            </p>
          </div>
        )}

        <p className="mt-4 text-center text-xs opacity-70">uber-wrapped.vercel.app</p>
      </div>
    </div>
  );
}

interface ShareSheetProps {
  insights: Insights;
  onClose: () => void;
}

export function ShareSheet({ insights, onClose }: ShareSheetProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const render = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
    const res = await fetch(dataUrl);
    return res.blob();
  };

  const download = async () => {
    setBusy(true);
    try {
      const blob = await render();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'uber-wrapped.png';
      a.click();
      URL.revokeObjectURL(url);
      setNote('Saved!');
    } catch {
      setNote('Could not generate image.');
    } finally {
      setBusy(false);
    }
  };

  const shareImage = async () => {
    setBusy(true);
    try {
      const blob = await render();
      if (!blob) return;
      const file = new File([blob], 'uber-wrapped.png', { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Uber Wrapped' });
      } else {
        await download();
      }
    } catch {
      /* user cancelled or unsupported */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-5" onClick={(e) => e.stopPropagation()}>
        <div ref={cardRef}>
          {insights.meta.timeframe.kind === 'all' && insights.allTime ? (
            <AllTimeShareCardVisual insights={insights} />
          ) : (
            <ShareCardVisual insights={insights} />
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={shareImage}
            disabled={busy}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.04] active:scale-95 disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Share image'}
          </button>
          <button
            onClick={download}
            disabled={busy}
            className="rounded-full border border-hairline-strong px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            Download PNG
          </button>
          <button onClick={onClose} className="rounded-full px-4 py-3 text-sm text-dim hover:text-text">
            Close
          </button>
        </div>
        {note && <p className="text-xs text-dim">{note}</p>}
      </div>
    </div>
  );
}
