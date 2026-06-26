import { motion, useReducedMotion } from 'framer-motion';

/** Tasteful parsing state: a dot travelling a route, not a generic spinner. */
export function Loading({ message = 'Crunching your rides…' }: { message?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-10 w-56">
        {/* route track */}
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/12" />
        {/* origin + destination pins */}
        <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white/40" />
        <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-sm bg-white/40" />
        {/* travelling glow */}
        <motion.div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white"
          style={{ boxShadow: '0 0 16px 4px rgba(255,255,255,0.6)' }}
          initial={{ left: '0%' }}
          animate={reduce ? { left: '50%' } : { left: ['0%', '100%'] }}
          transition={reduce ? { duration: 0 } : { duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>
      <p className="text-sm text-dim">{message}</p>
    </div>
  );
}
