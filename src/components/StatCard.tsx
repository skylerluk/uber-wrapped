import type { ReactNode } from 'react';
import { CountUp } from './CountUp';

interface StatCardProps {
  label: string;
  /** Numeric value gets a count-up; pass `format` to render it. */
  value?: number;
  format?: (n: number) => string;
  /** Or render a static string/node instead of a count-up number. */
  display?: ReactNode;
  hint?: string;
}

export function StatCard({ label, value, format, display, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-dim">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {display ?? (value != null ? <CountUp value={value} format={format} /> : '—')}
      </p>
      {hint && <p className="mt-1 text-xs text-dim">{hint}</p>}
    </div>
  );
}
