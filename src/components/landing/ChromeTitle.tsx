import { motion, useReducedMotion } from 'framer-motion';

/** Custom "Uber Wrapped" wordmark: chrome ramp fill + sweeping specular sheen
 *  + chromatic fringe. Lands last in the hero stagger with extra weight. */
export function ChromeTitle() {
  const reduce = useReducedMotion();
  return (
    <motion.h1
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(12px)' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ delay: reduce ? 0 : 0.28, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      data-text="Uber Wrapped"
      className="chrome-text display-number text-[clamp(3rem,13vw,9rem)] leading-[0.9]"
    >
      Uber Wrapped
    </motion.h1>
  );
}
