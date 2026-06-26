import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, DarkTooltip, GRID_STROKE } from './ChartTheme';

export function RidesByHour({ ridesByHour }: { ridesByHour: number[] }) {
  const data = ridesByHour.map((rides, hour) => ({
    hour,
    rides,
    label: hour % 6 === 0 ? `${hour}:00` : '',
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          content={<DarkTooltip formatter={(v) => `${v} rides`} />}
        />
        <Bar dataKey="rides" fill="#ffffff" radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
