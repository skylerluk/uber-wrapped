import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface CountUpProps {
  value: number;
  /** Format the (possibly fractional, mid-animation) number for display. */
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
}

/** Animated number count-up. Respects prefers-reduced-motion (jumps to final). */
export function CountUp({ value, format, durationMs = 1400, className }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, durationMs, reduce]);

  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      {format ? format(display) : Math.round(display).toLocaleString('en-US')}
    </span>
  );
}
