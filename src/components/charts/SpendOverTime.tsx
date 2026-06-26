import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthBucket } from '../../types/insights';
import { formatMoney, formatMonthLabel } from '../../lib/format';
import { AXIS_TICK, DarkTooltip, GRID_STROKE } from './ChartTheme';

export function SpendOverTime({
  data,
  currency,
}: {
  data: MonthBucket[];
  currency: string | null;
}) {
  const chartData = data.map((d) => ({ ...d, label: formatMonthLabel(d.month) }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => formatMoney(Number(v), currency)}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
          content={<DarkTooltip formatter={(v) => formatMoney(v, currency)} />}
        />
        <Area
          type="monotone"
          dataKey="spend"
          stroke="#ffffff"
          strokeWidth={2}
          fill="url(#spendFill)"
          dot={false}
          activeDot={{ r: 4, fill: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
