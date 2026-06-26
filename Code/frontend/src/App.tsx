import { useCallback, useMemo, useState } from 'react';
import { parseUberExport } from './lib/parse';
import { buildInsights, toAggregatePayload } from './lib/insights';
import { fetchAiRoasts } from './lib/api/insights';
import { Landing } from './components/Landing';
import { Story } from './scenes/Story';
import { Dashboard } from './scenes/Dashboard';
import { formatMoney } from './lib/format';
import type { Insights, Roast } from './types/insights';

type AppState =
  | { phase: 'idle'; error: string | null }
  | { phase: 'parsing' }
  | { phase: 'story'; insights: Insights; aiRoasts: Roast[]; aiPending: boolean }
  | { phase: 'dashboard'; insights: Insights; aiRoasts: Roast[]; aiPending: boolean };

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
      setState({ phase: 'story', insights, aiRoasts: [], aiPending: true });

      // Fire-and-forget: AI roasts are folded into the dashboard wall when they
      // arrive. The story's `insights` is never mutated, so scenes stay stable.
      void fetchAiRoasts(toAggregatePayload(insights)).then((aiRoasts) => {
        setState((prev) => {
          if (prev.phase !== 'story' && prev.phase !== 'dashboard') return prev;
          if (prev.insights.meta.generatedAt !== insights.meta.generatedAt) return prev;
          return { ...prev, aiRoasts, aiPending: false };
        });
      });
    } catch (err) {
      setState({
        phase: 'idle',
        error: err instanceof Error ? err.message : 'Could not read that file.',
      });
    }
  }, []);

  const restart = useCallback(() => setState({ phase: 'idle', error: null }), []);

  const share = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'story' && prev.phase !== 'dashboard') return prev;
      const s = prev.insights.stats;
      const text = `My Uber Wrapped: ${s.totalRides} rides, ${formatMoney(s.totalSpend, s.currency)} spent across ${s.dateRange.label}. 🚗`;
      if (navigator.share) {
        void navigator.share({ title: 'Uber Wrapped', text }).catch(() => {});
      } else if (navigator.clipboard) {
        void navigator.clipboard.writeText(text);
      }
      return prev;
    });
  }, []);

  const goDashboard = useCallback(
    () => setState((prev) => (prev.phase === 'story' ? { ...prev, phase: 'dashboard' } : prev)),
    [],
  );
  const goStory = useCallback(
    () => setState((prev) => (prev.phase === 'dashboard' ? { ...prev, phase: 'story' } : prev)),
    [],
  );

  // Stable actions object so the story's scene list doesn't rebuild needlessly.
  const storyActions = useMemo(
    () => ({ onDashboard: goDashboard, onShare: share, onRestart: restart }),
    [goDashboard, share, restart],
  );

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
      return <Story insights={state.insights} actions={storyActions} />;
    case 'dashboard':
      return (
        <Dashboard
          insights={state.insights}
          aiRoasts={state.aiRoasts}
          aiPending={state.aiPending}
          onRestart={restart}
          onReplay={goStory}
        />
      );
  }
}

export default App;
