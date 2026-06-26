import { DropZone } from './DropZone';

interface LandingProps {
  onFile: (file: File) => void;
  error?: string | null;
}

const HOW_TO_STEPS = [
  'Open your Uber account',
  'Go to the Privacy Center',
  'Tap "See Summary" (or "Download your data")',
  'Choose "View my trips"',
  'Open the top-right burger menu',
  'Tap "Download"',
];

export function Landing({ onFile, error }: LandingProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-8 px-6 py-16">
      <header className="text-center">
        <h1 className="font-display text-6xl font-black tracking-tight sm:text-7xl">Uber Wrapped</h1>
        <p className="mt-4 text-base text-dim sm:text-lg">
          Your year(s) in Uber, wrapped. Drop your data export to begin.
        </p>
      </header>

      <div className="w-full">
        <DropZone onFile={onFile} />
        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </p>
        )}
        <p className="mt-4 text-center text-xs text-dim">
          🔒 Your data never leaves your browser. Everything is processed on this device.
        </p>
      </div>

      <details className="w-full rounded-xl border border-hairline bg-surface p-5">
        <summary className="cursor-pointer text-sm font-semibold">
          How to download your Uber data
        </summary>
        <ol className="mt-4 space-y-2 text-sm text-dim">
          {HOW_TO_STEPS.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-hairline text-[11px] tabular-nums">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-dim">
          Uber emails your export as a <code>.zip</code> — it can take a while to arrive
          (sometimes up to 24–48 hours). When it lands, just drop the whole zip above —
          no need to unzip it.{' '}
          <a
            href="https://privacy.uber.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text underline"
          >
            Open Uber Privacy Center →
          </a>
        </p>
      </details>
    </main>
  );
}
