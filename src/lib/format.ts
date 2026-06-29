// Shared display formatters.

export function formatMoney(n: number, currency: string | null, opts?: { decimals?: boolean }): string {
  const code = currency ?? 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: opts?.decimals ? 2 : 0,
      minimumFractionDigits: opts?.decimals ? 2 : 0,
    }).format(n);
  } catch {
    return `${Math.round(n).toLocaleString('en-US')} ${code}`;
  }
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** "1 ride" / "2 rides" — count with a correctly pluralized noun. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** Seconds → "Xh Ym" / "Ym" / "Ys". */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/** "2023-08" -> "Aug '23" */
export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const month = new Date(Date.UTC(y, (m ?? 1) - 1, 1)).toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });
  return `${month} '${String(y).slice(2)}`;
}

/** "2023-08-14" -> "Aug 14, 2023" */
export function formatDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
