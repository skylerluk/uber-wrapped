import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import { parseUberExport } from './lib/parse';
import { buildAllInsights, toAggregatePayload, timeframeKey } from './lib/insights';
import type { AllInsights } from './lib/insights';
import { fetchAiRoasts } from './lib/api/insights';
import { Landing } from './components/Landing';
import { Loading } from './components/Loading';
import type { Insights, Roast, Timeframe } from './types/insights';

const Picker = lazy(() => import('./scenes/Picker').then((m) => ({ default: m.Picker })));
const Story = lazy(() => import('./scenes/Story').then((m) => ({ default: m.Story })));
const Dashboard = lazy(() => import('./scenes/Dashboard').then((m) => ({ default: m.Dashboard })));
const ShareSheet = lazy(() => import('./components/ShareCard').then((m) => ({ default: m.ShareSheet })));

type AppState =
  | { phase: 'idle'; error: string | null }
  | { phase: 'parsing' }
  | { phase: 'picker'; all: AllInsights }
  | { phase: 'story'; all: AllInsights; timeframe: Timeframe; aiRoasts: Roast[]; aiPending: boolean }
  | { phase: 'dashboard'; all: AllInsights; timeframe: Timeframe; aiRoasts: Roast[]; aiPending: boolean };

function App() {
  const [state, setState] = useState<AppState>({ phase: 'idle', error: null });
  const [sharing, setSharing] = useState(false);
  // AI roasts cached per timeframe key so switching never re-fetches.
  const aiCache = useRef<Map<string, Roast[]>>(new Map());

  const activeInsights = (s: AppState): Insights | null =>
    s.phase === 'story' || s.phase === 'dashboard'
      ? s.all.byTimeframe.get(timeframeKey(s.timeframe)) ?? null
      : null;

  const fetchAiFor = useCallback((all: AllInsights, timeframe: Timeframe) => {
    const key = timeframeKey(timeframe);
    if (aiCache.current.has(key)) return;
    const insights = all.byTimeframe.get(key);
    if (!insights) return;
    void fetchAiRoasts(toAggregatePayload(insights)).then((roasts) => {
      aiCache.current.set(key, roasts);
      setState((prev) => {
        if (prev.phase !== 'story' && prev.phase !== 'dashboard') return prev;
        if (timeframeKey(prev.timeframe) !== key) return prev;
        return { ...prev, aiRoasts: roasts, aiPending: false };
      });
    });
  }, []);

  const selectTimeframe = useCallback(
    (all: AllInsights, timeframe: Timeframe) => {
      const key = timeframeKey(timeframe);
      const cached = aiCache.current.get(key);
      setState({ phase: 'story', all, timeframe, aiRoasts: cached ?? [], aiPending: !cached });
      if (!cached) fetchAiFor(all, timeframe);
    },
    [fetchAiFor],
  );

  const handleFile = useCallback(
    async (file: File) => {
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
        const all = buildAllInsights(outcome.result.allTrips, outcome.result.completedTrips);
        const allTf = all.byTimeframe.get('all');
        if (!allTf || allTf.stats.totalRides === 0) {
          setState({ phase: 'idle', error: 'We parsed the file but found no completed rides to wrap.' });
          return;
        }
        aiCache.current.clear();
        // One timeframe (≤1 distinct year) → skip the picker, go straight to All-Time.
        if (all.years.length <= 1) {
          selectTimeframe(all, { kind: 'all' });
        } else {
          setState({ phase: 'picker', all });
        }
      } catch (err) {
        setState({ phase: 'idle', error: err instanceof Error ? err.message : 'Could not read that file.' });
      }
    },
    [selectTimeframe],
  );

  const restart = useCallback(() => {
    setSharing(false);
    aiCache.current.clear();
    setState({ phase: 'idle', error: null });
  }, []);
  const openShare = useCallback(() => setSharing(true), []);
  const goPicker = useCallback(
    () => setState((prev) => (prev.phase === 'story' || prev.phase === 'dashboard' ? { phase: 'picker', all: prev.all } : prev)),
    [],
  );
  const goDashboard = useCallback(
    () => setState((prev) => (prev.phase === 'story' ? { ...prev, phase: 'dashboard' } : prev)),
    [],
  );
  const goStory = useCallback(
    () => setState((prev) => (prev.phase === 'dashboard' ? { ...prev, phase: 'story' } : prev)),
    [],
  );

  const storyActions = useMemo(
    () => ({ onDashboard: goDashboard, onShare: openShare, onRestart: restart, onPickAnother: goPicker }),
    [goDashboard, openShare, restart, goPicker],
  );

  const insights = activeInsights(state);

  const fallback = (
    <main className="flex min-h-[100dvh] items-center justify-center">
      <Loading />
    </main>
  );

  return (
    <Suspense fallback={fallback}>
      {state.phase === 'idle' && <Landing onFile={handleFile} error={state.error} />}
      {state.phase === 'parsing' && fallback}
      {state.phase === 'picker' && (
        <Picker all={state.all} onSelect={(tf) => selectTimeframe(state.all, tf)} onRestart={restart} />
      )}
      {state.phase === 'story' && insights && <Story insights={insights} actions={storyActions} />}
      {state.phase === 'dashboard' && insights && (
        <Dashboard
          insights={insights}
          aiRoasts={state.aiRoasts}
          aiPending={state.aiPending}
          onRestart={restart}
          onReplay={goStory}
          onShare={openShare}
          onPickAnother={state.all.years.length > 1 ? goPicker : undefined}
        />
      )}
      {sharing && insights && <ShareSheet insights={insights} onClose={() => setSharing(false)} />}
    </Suspense>
  );
}

export default App;
