import { useCallback, useState } from 'react';
import { parseUberExport } from './lib/parse';
import { buildInsights } from './lib/insights';
import { Landing } from './components/Landing';
import { Story } from './scenes/Story';
import { Dashboard } from './scenes/Dashboard';
import { formatMoney } from './lib/format';
import type { Insights } from './types/insights';

type AppState =
  | { phase: 'idle'; error: string | null }
  | { phase: 'parsing' }
  | { phase: 'story'; insights: Insights }
  | { phase: 'dashboard'; insights: Insights };

function App() {
  const [state, setState] = useState<AppState>({ phase: 'idle', error: null });

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setState({ phase: 'idle', error: 'Please drop the .zip file from Uber, not a different file type.' });
      return;
    }
    setState({ phase: 'parsing' });
    try {
      const buffer = await file.arrayBuffer();
      const outcome = await parseUberExport(buffer);
      if (!outcome.ok) {
        setState({ phase: 'idle', error: outcome.message });
        return;
      }
      const insights = buildInsights(outcome.result.allTrips, outcome.result.completedTrips);
      if (insights.stats.totalRides === 0) {
        setState({ phase: 'idle', error: 'We parsed the file but found no completed rides to wrap.' });
        return;
      }
      setState({ phase: 'story', insights });
    } catch (err) {
      setState({
        phase: 'idle',
        error: err instanceof Error ? err.message : 'Could not read that file.',
      });
    }
  }, []);

  const restart = useCallback(() => setState({ phase: 'idle', error: null }), []);

  const share = useCallback(() => {
    if (state.phase !== 'story' && state.phase !== 'dashboard') return;
    const s = state.insights.stats;
    const text = `My Uber Wrapped: ${s.totalRides} rides, ${formatMoney(s.totalSpend, s.currency)} spent across ${s.dateRange.label}. 🚗`;
    if (navigator.share) {
      void navigator.share({ title: 'Uber Wrapped', text }).catch(() => {});
    } else if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
  }, [state]);

  switch (state.phase) {
    case 'idle':
      return <Landing onFile={handleFile} error={state.error} />;
    case 'parsing':
      return (
        <main className="flex min-h-screen items-center justify-center">
          <p className="animate-pulse text-dim">Crunching your rides…</p>
        </main>
      );
    case 'story':
      return (
        <Story
          insights={state.insights}
          actions={{
            onDashboard: () => setState({ phase: 'dashboard', insights: state.insights }),
            onShare: share,
            onRestart: restart,
          }}
        />
      );
    case 'dashboard':
      return (
        <Dashboard
          insights={state.insights}
          onRestart={restart}
          onReplay={() => setState({ phase: 'story', insights: state.insights })}
        />
      );
  }
}

export default App;
