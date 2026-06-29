interface MarqueeProps {
  items: string[];
  direction?: 'left' | 'right';
  /** Seconds for one full cycle (lower = faster). */
  speed?: number;
  className?: string;
}

/** Seamless scrolling band: content is duplicated and the track travels one
 *  copy-width, so the wrap is invisible. Edge-faded via .marquee-mask. */
export function Marquee({ items, direction = 'left', speed = 40, className }: MarqueeProps) {
  const content = items.join('  •  ') + '  •  ';
  return (
    <div className={`marquee-mask overflow-hidden ${className ?? ''}`} aria-hidden>
      <div
        className="inline-flex w-max whitespace-nowrap"
        style={{ animation: `marquee-${direction} ${speed}s linear infinite` }}
      >
        <span>{content}</span>
        <span>{content}</span>
      </div>
    </div>
  );
}
