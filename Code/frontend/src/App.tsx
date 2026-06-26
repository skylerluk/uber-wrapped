import { useCallback, useRef, useState } from 'react';
import { parseUberExport } from './lib/parse';
import { buildInsights } from './lib/insights';
import type { ParseResult } from './types/trip';
import type { Insights } from './types/insights';

type Status =
  | { kind: 'idle' }
  | { kind: 'parsing' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; result: ParseResult };

function App() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setStatus({ kind: 'error', message: 'Please drop the .zip file from Uber, not a different file type.' });
      return;
    }
    setStatus({ kind: 'parsing' });
    try {
      const buffer = await file.arrayBuffer();
      const outcome = await parseUberExport(buffer);
      if (outcome.ok) {
        // Dev harness: build + log full insights so we can eyeball roasts on real data.
        const insights: Insights = buildInsights(
          outcome.result.allTrips,
          outcome.result.completedTrips,
        );
        (window as unknown as { __uberInsights?: Insights }).__uberInsights = insights;
        // eslint-disable-next-line no-console
        console.log('Uber Wrapped — insights', insights);
        // eslint-disable-next-line no-console
        console.table(insights.roasts.map((r) => ({ headline: r.headline, funScore: r.funScore })));
        setStatus({ kind: 'done', result: outcome.result });
      } else {
        setStatus({ kind: 'error', message: outcome.message });
      }
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Could not read that file.',
      });
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg px-6 text-text">
      <header className="text-center">
        <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl">Uber Wrapped</h1>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-dim">
          Phase 1 — drop your Uber data export
        </p>
      </header>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center transition-colors ${
          dragging ? 'border-text bg-surface-2' : 'border-hairline bg-surface'
        }`}
      >
        <p className="text-lg font-semibold">Drag &amp; drop your Uber .zip</p>
        <p className="mt-2 text-sm text-dim">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
      </div>

      <div className="min-h-[6rem] w-full max-w-md text-center">
        {status.kind === 'parsing' && <p className="text-dim">Parsing…</p>}

        {status.kind === 'error' && (
          <p className="rounded-lg border border-hairline bg-surface p-4 text-sm text-red-400">
            {status.message}
          </p>
        )}

        {status.kind === 'done' && (
          <div className="rounded-lg border border-hairline bg-surface p-5 text-left tabular-nums">
            <p className="mb-2 text-sm uppercase tracking-widest text-dim">Parsed ✓</p>
            <dl className="space-y-1 text-sm">
              <Row label="Completed rides" value={String(status.result.summary.completedRows)} />
              <Row
                label="Total spend"
                value={`${status.result.summary.totalSpend.toFixed(2)} ${status.result.summary.currency ?? ''}`.trim()}
              />
              <Row
                label="Date range"
                value={`${fmt(status.result.summary.dateRange.earliest)} → ${fmt(status.result.summary.dateRange.latest)}`}
              />
              <Row
                label="Top city"
                value={status.result.summary.topCities[0]?.city ?? '—'}
              />
            </dl>
            <p className="mt-3 text-xs text-dim">
              Full breakdown in the console; data on <code>window.__uberWrapped</code>.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-dim">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function fmt(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : '—';
}

export default App;
