import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const B = ({ children }: { children: ReactNode }) => (
  <strong className="font-semibold text-text">{children}</strong>
);

const SECTIONS: { title: string; steps: ReactNode[] }[] = [
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

/** Brushed-metal "Step N" pill. */
function StepPill({ n }: { n: number }) {
  return (
    <span className="rounded-full border border-hairline-strong bg-gradient-to-b from-white/[0.14] to-white/[0.02] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
      Step {n}
    </span>
  );
}

/** Number circle with a soft metallic gradient ring. */
function StepNum({ n }: { n: number }) {
  return (
    <span className="mt-0.5 shrink-0 rounded-full bg-gradient-to-b from-white/35 to-white/[0.06] p-px">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold tabular-nums text-text">
        {n}
      </span>
    </span>
  );
}

export function HowTo() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const panelId = useId();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: reduce ? 0 : 0.05 } },
  };
  const item = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
      };

  const content = (
    <motion.div variants={container} initial="hidden" animate="show" className="px-5 pb-5">
      <div className="space-y-5">
        {SECTIONS.map((section, si) => (
          <motion.div key={si} variants={item}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
              <StepPill n={si + 1} />
              {section.title}
            </h3>
            <ol className="space-y-2.5 text-sm text-dim">
              {section.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <StepNum n={i + 1} />
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        ))}

        <motion.div
          variants={item}
          className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5 pl-4 text-xs leading-relaxed text-dim"
        >
          {/* silver→amber accent rule */}
          <span
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.7), #f59e0b)' }}
          />
          <B>Heads up:</B> Uber typically takes <B>24–48 hours</B> to generate the file. You&apos;ll
          get an email and an in-app notification when it&apos;s ready. Then download the{' '}
          <code className="text-dim">.zip</code> to your phone&apos;s Files app and <B>upload it here</B>{' '}
          — no need to unzip it.{' '}
          <a
            href="https://privacy.uber.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text underline underline-offset-2"
          >
            Open Uber Privacy Center →
          </a>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <div className="elevated w-full overflow-hidden rounded-2xl border border-hairline bg-[#0b0b0ce8] backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="group flex w-full items-center justify-between p-5 text-left text-sm font-semibold"
      >
        <span
          className="bg-clip-text text-transparent transition-opacity group-hover:opacity-90"
          style={{ backgroundImage: 'var(--chrome-ramp)' }}
        >
          How to download your Uber data
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
          className="text-dim"
        >
          ▾
        </motion.span>
      </button>

      <div id={panelId}>
        {reduce ? (
          open && content
        ) : (
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: 'hidden' }}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
