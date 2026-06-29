import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Insights } from '../types/insights';
import { buildScenes, type SceneActions } from './scenes';
import { buildAllTimeScenes } from './alltime/allTimeScenes';
import { sceneBackground } from '../styles/gradients';
import { RoastCard } from '../components/RoastCard';

interface StoryProps {
  insights: Insights;
  actions: SceneActions;
}

const SCENE_MS = 5200;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Story({ insights, actions }: StoryProps) {
  const scenes = useMemo(
    () =>
      insights.meta.timeframe.kind === 'all' && insights.allTime
        ? buildAllTimeScenes(insights, actions)
        : buildScenes(insights, actions),
    [insights, actions],
  );
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const timer = useRef<number | null>(null);

  const clamp = useCallback((i: number) => Math.max(0, Math.min(scenes.length - 1, i)), [scenes.length]);
  const next = useCallback(() => setIndex((i) => clamp(i + 1)), [clamp]);
  const prev = useCallback(() => setIndex((i) => clamp(i - 1)), [clamp]);

  const scene = scenes[index];
  const isLast = index === scenes.length - 1;

  // Auto-advance (paused on the final outro scene).
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!isLast) timer.current = window.setTimeout(next, SCENE_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, isLast, next]);

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

  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 1.04 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
      };

  const container = {
    animate: { transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: reduce ? 0 : 0.1 } },
  };
  const item = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 24, filter: 'blur(6px)' },
        animate: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.55, ease: EASE_OUT },
        },
      };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-bg">
      {/* Progress bars */}
      <div className="absolute left-0 right-0 top-0 z-30 flex gap-1.5 p-4">
        {scenes.map((s, i) => (
          <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
            {i < index && <div className="h-full w-full rounded-full bg-white" />}
            {i === index &&
              (isLast || reduce ? (
                <div className="h-full w-full rounded-full bg-white" />
              ) : (
                <motion.div
                  key={index}
                  className="h-full rounded-full bg-white"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: SCENE_MS / 1000, ease: 'linear' }}
                />
              ))}
          </div>
        ))}
      </div>

      {/* Tap zones (disabled on the outro so buttons are clickable) */}
      {!scene.footer && (
        <>
          <button aria-label="Previous" className="absolute left-0 top-0 z-20 h-full w-1/3 cursor-default" onClick={prev} />
          <button aria-label="Next" className="absolute right-0 top-0 z-20 h-full w-2/3 cursor-default" onClick={next} />
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.section
          key={scene.id}
          variants={enter}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: reduce ? 0.25 : 0.5, ease: EASE_OUT }}
          className="grain absolute inset-0 flex items-center justify-center px-7"
          style={{ background: sceneBackground(scene.gradient) }}
        >
          {!reduce && (
            <div
              className="gradient-drift pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(60% 50% at 50% 40%, ${scene.gradient.from}22, transparent 70%)` }}
            />
          )}

          <motion.div variants={container} initial="initial" animate="animate" className="relative z-10 w-full">
            {scene.roast ? (
              <motion.div variants={item}>
                <RoastCard roast={scene.roast} gradient={scene.gradient} />
              </motion.div>
            ) : (
              <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                {scene.kicker && (
                  <motion.p variants={item} className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-white/75">
                    {scene.kicker}
                  </motion.p>
                )}
                {scene.headline && (
                  <motion.div
                    variants={item}
                    className="display-number text-[clamp(2.75rem,11vw,7rem)] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]"
                  >
                    {scene.headline}
                  </motion.div>
                )}
                {scene.custom && (
                  <motion.div variants={item} className="mt-8 w-full">
                    {scene.custom}
                  </motion.div>
                )}
                {scene.sub && (
                  <motion.p variants={item} className="mt-6 max-w-md text-lg text-white/85 sm:text-xl">
                    {scene.sub}
                  </motion.p>
                )}
                {scene.footer && <motion.div variants={item}>{scene.footer}</motion.div>}
              </div>
            )}
          </motion.div>
        </motion.section>
      </AnimatePresence>

      {!isLast && (
        <p className="absolute bottom-5 left-0 right-0 z-30 text-center text-xs text-white/50">Tap or use → to continue</p>
      )}
    </div>
  );
}
