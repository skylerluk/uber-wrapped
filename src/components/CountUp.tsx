import { useEffect, useState } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';

interface CountUpProps {
  value: number;
  /** Format the (possibly fractional, mid-animation) number for display. */
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
  /** Blur-in reveal as the number rolls up (for hero numbers). */
  blurIn?: boolean;
}

/** Animated number count-up. Respects prefers-reduced-motion (jumps to final). */
export function CountUp({ value, format, durationMs = 1600, className, blurIn = false }: CountUpProps) {
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

  const text = format ? format(display) : Math.round(display).toLocaleString('en-US');
  const content = <span className={`tabular-nums ${className ?? ''}`}>{text}</span>;

  if (!blurIn || reduce) return content;
  return (
    <motion.span
      initial={{ opacity: 0, filter: 'blur(14px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{ display: 'inline-block' }}
    >
      {content}
    </motion.span>
  );
}

interface CountUpStatProps {
  value: number;
  format?: (n: number) => string;
  label: string;
  hint?: string;
}

/** Labeled big-number stat with animated count-up. */
export function CountUpStat({ value, format, label, hint }: CountUpStatProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-dim">{label}</p>
      <p className="mt-2 display-number text-3xl sm:text-4xl">
        <CountUp value={value} format={format} />
      </p>
      {hint && <p className="mt-1 text-xs text-dim">{hint}</p>}
    </div>
  );
}
