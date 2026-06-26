import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Insights } from '../types/insights';
import { buildScenes, type SceneActions } from './scenes';

interface StoryProps {
  insights: Insights;
  actions: SceneActions;
}

export function Story({ insights, actions }: StoryProps) {
  const scenes = useMemo(() => buildScenes(insights, actions), [insights, actions]);
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  const clamp = useCallback((i: number) => Math.max(0, Math.min(scenes.length - 1, i)), [scenes.length]);
  const next = useCallback(() => setIndex((i) => clamp(i + 1)), [clamp]);
  const prev = useCallback(() => setIndex((i) => clamp(i - 1)), [clamp]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const scene = scenes[index];
  const [from, to] = scene.gradient;
  const isLast = index === scenes.length - 1;

  const variants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 24, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -24, scale: 0.98 },
      };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-bg">
      {/* Progress dots */}
      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1.5 p-4">
        {scenes.map((s, i) => (
          <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: i < index ? '100%' : i === index ? '100%' : '0%', opacity: i <= index ? 1 : 0.3 }}
            />
          </div>
        ))}
      </div>

      {/* Tap zones (disabled on outro so buttons are clickable) */}
      {!scene.isOutro && (
        <>
          <button
            aria-label="Previous"
            className="absolute left-0 top-0 z-10 h-full w-1/3 cursor-default"
            onClick={prev}
          />
          <button
            aria-label="Next"
            className="absolute right-0 top-0 z-10 h-full w-2/3 cursor-default"
            onClick={next}
          />
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.section
          key={scene.id}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: reduce ? 0.25 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center px-8"
          style={{
            background: `radial-gradient(120% 80% at 50% 30%, ${from}40, transparent 60%), radial-gradient(100% 100% at 80% 100%, ${to}33, transparent 55%), #000`,
          }}
        >
          {scene.render()}
        </motion.section>
      </AnimatePresence>

      {/* Hint */}
      {!isLast && (
        <p className="absolute bottom-5 left-0 right-0 z-20 text-center text-xs text-white/50">
          Tap or use → to continue
        </p>
      )}
    </div>
  );
}
