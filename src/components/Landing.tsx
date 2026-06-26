import { motion } from 'framer-motion';
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
    <main className="relative mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center gap-8 px-6 py-16">
      {/* ambient glow behind the hero */}
      <div
        className="pointer-events-none absolute left-1/2 top-[18%] -z-10 h-72 w-72 -translate-x-1/2 rounded-full opacity-50 blur-[90px]"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.5), rgba(236,72,153,0.25) 60%, transparent)' }}
      />

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <h1 className="display-number text-[clamp(3rem,14vw,5.5rem)]">Uber Wrapped</h1>
        <p className="mx-auto mt-4 max-w-md text-base text-dim sm:text-lg">
          Your year in Uber, wrapped. Drop your data export for a cinematic recap of every ride,
          dollar, and questionable 2&nbsp;a.m. decision.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <DropZone onFile={onFile} />
        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">{error}</p>
        )}
        <p className="mt-4 text-center text-xs text-dim">
          🔒 100% on-device — your ride data and addresses never leave this browser.
        </p>
      </motion.div>

      <details className="elevated w-full rounded-2xl border border-hairline bg-surface p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
          How to download your Uber data
          <span className="text-dim transition-transform">▾</span>
        </summary>
        <ol className="mt-4 space-y-2.5 text-sm text-dim">
          {HOW_TO_STEPS.map((step, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-hairline-strong bg-surface-2 text-[11px] font-semibold tabular-nums text-text">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-faint">
          Uber emails your export as a <code className="text-dim">.zip</code> — it can take a while
          to arrive (sometimes up to 24–48 hours). When it lands, just drop the whole zip above; no
          need to unzip it.{' '}
          <a
            href="https://privacy.uber.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text underline underline-offset-2"
          >
            Open Uber Privacy Center →
          </a>
        </p>
      </details>

      <footer className="mt-2 flex flex-col items-center gap-1 text-center text-xs text-faint">
        <p>Processed entirely in your browser. Nothing uploaded.</p>
        <a
          href="https://github.com/skylerluk/uber-wrapped"
          target="_blank"
          rel="noopener noreferrer"
          className="text-dim underline underline-offset-2 hover:text-text"
        >
          View source on GitHub
        </a>
      </footer>
    </main>
  );
}
