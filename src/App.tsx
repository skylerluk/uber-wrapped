import { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { parseUberExport } from './lib/parse';
import { buildInsights, toAggregatePayload } from './lib/insights';
import { fetchAiRoasts } from './lib/api/insights';
import { Landing } from './components/Landing';
import { Loading } from './components/Loading';
import type { Insights, Roast } from './types/insights';

// Lazy-load heavy, post-landing surfaces (Recharts, html-to-image) so the
// initial landing bundle stays lean.
const Story = lazy(() => import('./scenes/Story').then((m) => ({ default: m.Story })));
const Dashboard = lazy(() => import('./scenes/Dashboard').then((m) => ({ default: m.Dashboard })));
const ShareSheet = lazy(() => import('./components/ShareCard').then((m) => ({ default: m.ShareSheet })));

type AppState =
  | { phase: 'idle'; error: string | null }
  | { phase: 'parsing' }
  | { phase: 'story'; insights: Insights; aiRoasts: Roast[]; aiPending: boolean }
  | { phase: 'dashboard'; insights: Insights; aiRoasts: Roast[]; aiPending: boolean };

function App() {
  const [state, setState] = useState<AppState>({ phase: 'idle', error: null });
  const [sharing, setSharing] = useState(false);

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

  const restart = useCallback(() => {
    setSharing(false);
    setState({ phase: 'idle', error: null });
  }, []);
  const openShare = useCallback(() => setSharing(true), []);

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
    () => ({ onDashboard: goDashboard, onShare: openShare, onRestart: restart }),
    [goDashboard, openShare, restart],
  );

  const insights = state.phase === 'story' || state.phase === 'dashboard' ? state.insights : null;

  const fallback = (
    <main className="flex min-h-[100dvh] items-center justify-center">
      <Loading />
    </main>
  );

  return (
    <Suspense fallback={fallback}>
      {state.phase === 'idle' && <Landing onFile={handleFile} error={state.error} />}
      {state.phase === 'parsing' && fallback}
      {state.phase === 'story' && <Story insights={state.insights} actions={storyActions} />}
      {state.phase === 'dashboard' && (
        <Dashboard
          insights={state.insights}
          aiRoasts={state.aiRoasts}
          aiPending={state.aiPending}
          onRestart={restart}
          onReplay={goStory}
          onShare={openShare}
        />
      )}
      {sharing && insights && <ShareSheet insights={insights} onClose={() => setSharing(false)} />}
    </Suspense>
  );
}

export default App;
