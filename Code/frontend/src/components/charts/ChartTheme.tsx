// Shared dark-theme bits for Recharts so nothing looks default.
import type { ReactNode } from 'react';

export const AXIS_TICK = { fill: '#9A9A9E', fontSize: 11 };
export const GRID_STROKE = 'rgba(255,255,255,0.06)';

interface TooltipPayloadItem {
  value?: number | string;
  name?: string;
  payload?: Record<string, unknown>;
}

export function DarkTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (v: number) => string;
}): ReactNode {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-semibold text-text">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums text-dim">
          {typeof p.value === 'number' && formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}
