import { Suspense, lazy, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { DropZone } from './DropZone';
import { ChromeTitle } from './landing/ChromeTitle';
import { Marquee } from './landing/Marquee';

// Lazy so the OGL shader doesn't block first paint; a chrome poster shows meanwhile.
const LiquidChromeBackground = lazy(() => import('./landing/LiquidChromeBackground'));

const B = ({ children }: { children: ReactNode }) => (
  <strong className="font-semibold text-text">{children}</strong>
);

const POSTER_BG =
  'radial-gradient(120% 90% at 50% 25%, rgba(205,205,214,0.4), transparent 55%), var(--chrome-ramp)';

interface LandingProps {
  onFile: (file: File) => void;
  error?: string | null;
}

const HOW_TO_SECTIONS: { title: string; steps: ReactNode[] }[] = [
  {
    title: 'Navigate to Privacy Settings',
    steps: [
      <>Open the <B>Uber app</B> on your phone.</>,
      <>Tap the <B>Account</B> tab in the bottom-right corner.</>,
      <>Select <B>Settings</B> from the menu list.</>,
      <>Scroll down slightly and tap <B>Privacy &amp; Data</B> (or <B>Privacy</B>).</>,
    ],
  },
  {
    title: 'Request Your Data',
    steps: [
      <>Tap <B>Privacy Center</B>.</>,
      <>Scroll down to the section titled <B>Your data and privacy</B>.</>,
      <>Tap <B>Download your data</B>.</>,
      <>Log in with your <B>Uber password</B> and complete the <B>2-step verification</B> (a code sent via SMS or email).</>,
    ],
  },
  {
    title: 'Confirm the Export',
    steps: [
      <>Review the data types being requested and tap <B>Request data</B>.</>,
      <>Uber will begin compiling your <code className="text-dim">.zip</code> archive.</>,
    ],
  },
];

export function Landing({ onFile, error }: LandingProps) {
  return (
    <main className="relative isolate min-h-[100dvh] overflow-hidden bg-bg">
      {/* Liquid-chrome WebGL background (poster while the module loads) */}
      <Suspense
        fallback={<div className="absolute inset-0 -z-10" style={{ background: POSTER_BG, opacity: 0.7 }} />}
      >
        <LiquidChromeBackground />
      </Suspense>

      {/* Counter-scrolling marquees behind the hero */}
      <div className="pointer-events-none absolute inset-0 -z-[5] flex flex-col justify-between py-10">
        <Marquee
          items={['UBER WRAPPED']}
          speed={32}
          className="display-number text-[clamp(3.5rem,12vw,9rem)] leading-none text-white/[0.16]"
        />
        <Marquee
          items={['RIDES', 'EATS', 'SURGE', '2 A.M.', 'LATE NIGHTS', 'AIRPORT RUNS']}
          direction="right"
          speed={26}
          className="text-[clamp(1.1rem,3.2vw,2.2rem)] font-bold uppercase tracking-[0.3em] text-white/[0.12]"
        />
      </div>

      {/* Grain above the shader so the chrome never looks flat */}
      <div className="grain pointer-events-none absolute inset-0 -z-[4] opacity-50 mix-blend-overlay" />

      {/* Scrim biased to the upper hero (title + subtitle) for legibility, while
          leaving the liquid-chrome shader visible around the edges and lower area. */}
      <div
        className="pointer-events-none absolute inset-0 -z-[3]"
        style={{
          background:
            'radial-gradient(75% 55% at 50% 30%, rgba(0,0,0,0.8), rgba(0,0,0,0.42) 55%, transparent 80%)',
        }}
      />

      <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center gap-8 px-6 py-16">
        <header className="text-center">
          <ChromeTitle />
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-5 max-w-md text-base text-dim sm:text-lg"
          >
            Your year in Uber, wrapped. Drop your data export for a cinematic recap of every ride,
            dollar, and questionable 2&nbsp;a.m. decision.
          </motion.p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
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

        <details className="elevated w-full rounded-2xl border border-hairline bg-[#0b0b0ce8] p-5 backdrop-blur-md">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
          How to download your Uber data
          <span className="text-dim transition-transform">▾</span>
        </summary>
        <div className="mt-5 space-y-5">
          {HOW_TO_SECTIONS.map((section, si) => (
            <div key={si}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-dim">
                  Step {si + 1}
                </span>
                {section.title}
              </h3>
              <ol className="space-y-2.5 text-sm text-dim">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-hairline-strong bg-surface-2 text-[11px] font-semibold tabular-nums text-text">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5 text-xs leading-relaxed text-dim">
          <B>⚠️ Heads up:</B> Uber typically takes <B>24–48 hours</B> to generate the file. You&apos;ll
          get an email and an in-app notification when it&apos;s ready. Then download the{' '}
          <code className="text-dim">.zip</code> to your phone&apos;s Files app and{' '}
          <B>upload it here</B> — no need to unzip it.{' '}
          <a
            href="https://privacy.uber.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text underline underline-offset-2"
          >
            Open Uber Privacy Center →
          </a>
        </div>
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
      </div>
    </main>
  );
}
