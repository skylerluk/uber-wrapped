import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { DropZone } from './DropZone';
import { ChromeTitle } from './landing/ChromeTitle';
import { Marquee } from './landing/Marquee';
import { HowTo } from './landing/HowTo';

// Lazy so the OGL shader doesn't block first paint; a chrome poster shows meanwhile.
const LiquidChromeBackground = lazy(() => import('./landing/LiquidChromeBackground'));

const POSTER_BG =
  'radial-gradient(120% 90% at 50% 25%, rgba(205,205,214,0.4), transparent 55%), var(--chrome-ramp)';

interface LandingProps {
  onFile: (file: File) => void;
  error?: string | null;
}

export function Landing({ onFile, error }: LandingProps) {
  return (
    <div className="relative min-h-[100dvh] bg-bg">
      {/* Fixed full-viewport liquid-chrome backdrop — always fills the screen,
          even as the content (e.g. the expanded how-to) scrolls over it. */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Liquid-chrome WebGL background (poster while the module loads) */}
        <Suspense
          fallback={<div className="absolute inset-0 -z-10" style={{ background: POSTER_BG, opacity: 0.7 }} />}
        >
          <LiquidChromeBackground />
        </Suspense>

        {/* Counter-scrolling marquees */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-10">
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
        <div className="grain pointer-events-none absolute inset-0 opacity-50 mix-blend-overlay" />

        {/* Scrim for hero legibility, leaving the shader visible elsewhere */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(75% 55% at 50% 30%, rgba(0,0,0,0.8), rgba(0,0,0,0.42) 55%, transparent 80%)',
          }}
        />
      </div>

      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center gap-8 px-6 py-16">
        <header className="text-center">
          <ChromeTitle />
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-5 max-w-md text-base font-medium text-white/85 [text-shadow:0_1px_14px_rgba(0,0,0,0.9)] sm:text-lg"
          >
            Drop your data export for a cinematic recap of every ride, dollar, and questionable
            2&nbsp;a.m. decision.
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
          <p className="mt-4 text-center text-xs font-medium text-white/75 [text-shadow:0_1px_10px_rgba(0,0,0,0.95)]">
            🔒 100% on-device — your ride data and addresses never leave this browser.
          </p>
        </motion.div>

        <HowTo />

      <footer className="mt-2 flex flex-col items-center gap-1 text-center text-xs text-white/60 [text-shadow:0_1px_10px_rgba(0,0,0,0.95)]">
        <p>Processed entirely in your browser. Nothing uploaded.</p>
        <a
          href="https://github.com/skylerluk/uber-wrapped"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/75 underline underline-offset-2 hover:text-text"
        >
          View source on GitHub
        </a>
      </footer>
      </main>
    </div>
  );
}
