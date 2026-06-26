import type { Roast } from '../types/insights';
import type { Gradient } from '../styles/gradients';

interface RoastCardProps {
  roast: Roast;
  gradient: Gradient;
}

/** The bold, screenshot-ready gradient card for a roast/comparison line. */
export function RoastCard({ roast, gradient }: RoastCardProps) {
  return (
    <div
      className="elevated relative mx-auto max-w-md overflow-hidden rounded-[28px] p-8 text-center sm:p-10"
      style={{ background: `linear-gradient(155deg, ${gradient.from}, ${gradient.to})` }}
    >
      {/* dark scrim for text legibility across varied gradients */}
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="grain absolute inset-0 opacity-50" />
      <div className="relative">
        {roast.emoji && <div className="text-5xl drop-shadow-sm sm:text-6xl">{roast.emoji}</div>}
        <h2 className="mt-5 display-number text-3xl leading-[1.02] text-white drop-shadow-sm sm:text-[2.75rem]">
          {roast.headline}
        </h2>
        <p className="mt-4 text-sm font-medium text-white/85 sm:text-base">{roast.sub}</p>
      </div>
    </div>
  );
}
