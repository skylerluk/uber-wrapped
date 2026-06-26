import { DropZone } from './DropZone';

interface LandingProps {
  onFile: (file: File) => void;
  error?: string | null;
}

// Stub of the "How to download your Uber data" guide. Full version: Phase 5.
const HOW_TO_STEPS = [
  'Open your Uber account',
  'Go to the Privacy Center',
  'Tap "See Summary" / "Download your data"',
  'Select "Trips" and request the export',
  'Open the email from Uber, download the .zip',
  'Drop the .zip above — it never leaves your browser',
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
      </details>
    </main>
  );
}
