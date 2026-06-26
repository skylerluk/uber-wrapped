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
    <div className="elevated rounded-[20px] border border-hairline bg-surface p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:border-hairline-strong">
      <p className="text-xs font-medium uppercase tracking-wider text-dim">{label}</p>
      <p className="mt-2 display-number text-3xl sm:text-4xl">
        {display ?? (value != null ? <CountUp value={value} format={format} /> : '—')}
      </p>
      {hint && <p className="mt-1 text-xs text-dim">{hint}</p>}
    </div>
  );
}
