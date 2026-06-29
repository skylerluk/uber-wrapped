import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { YearSummary } from '../../types/insights';
import { formatMoney } from '../../lib/format';
import { AXIS_TICK, DarkTooltip, GRID_STROKE } from './ChartTheme';

/** Animated spend-per-year bars — the all-time timeline centerpiece. The peak
 *  year "ignites" with a brighter fill + glow. */
export function SpendByYear({
  data,
  currency,
  peakYear,
  light,
  height = 240,
}: {
  data: YearSummary[];
  currency: string | null;
  peakYear?: number | null;
  light?: boolean;
  height?: number;
}) {
  const tick = light ? { fill: 'rgba(255,255,255,0.85)', fontSize: 12 } : AXIS_TICK;
  const grid = light ? 'rgba(255,255,255,0.18)' : GRID_STROKE;
  const baseBar = light ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.4)';
  const peakBar = '#ffffff';

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
        <Bar dataKey="spend" radius={[4, 4, 0, 0]} maxBarSize={64} animationDuration={1100} animationEasing="ease-out">
          {data.map((d) => {
            const isPeak = peakYear != null && d.year === peakYear;
            return (
              <Cell
                key={d.year}
                fill={isPeak ? peakBar : baseBar}
                style={isPeak ? { filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.55))' } : undefined}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
