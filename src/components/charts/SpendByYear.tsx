import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { YearSummary } from '../../types/insights';
import { formatMoney } from '../../lib/format';
import { AXIS_TICK, DarkTooltip, GRID_STROKE } from './ChartTheme';

/** Animated spend-per-year bars — the all-time timeline centerpiece. */
export function SpendByYear({
  data,
  currency,
  light,
  height = 240,
}: {
  data: YearSummary[];
  currency: string | null;
  /** Light text/bars for use on a vivid gradient scene. */
  light?: boolean;
  height?: number;
}) {
  const tick = light ? { fill: 'rgba(255,255,255,0.85)', fontSize: 12 } : AXIS_TICK;
  const grid = light ? 'rgba(255,255,255,0.18)' : GRID_STROKE;
  const bar = light ? 'rgba(255,255,255,0.92)' : '#ffffff';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="year" tick={tick} tickLine={false} axisLine={false} />
        <YAxis
          tick={tick}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v) => formatMoney(Number(v), currency)}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.08)' }}
          content={<DarkTooltip formatter={(v) => formatMoney(v, currency)} />}
        />
        <Bar dataKey="spend" fill={bar} radius={[4, 4, 0, 0]} maxBarSize={64} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
}
