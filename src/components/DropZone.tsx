import { useCallback, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  // Magnetic hover — the card leans toward the cursor.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 200, damping: 18 });
  const y = useSpring(my, { stiffness: 200, damping: 18 });

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce || disabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 18);
    my.set(((e.clientY - (r.top + r.height / 2)) / r.height) * 18);
  };
  const resetPointer = () => {
    mx.set(0);
    my.set(0);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile, disabled],
  );

  return (
    <motion.div
      style={{ x, y }}
      animate={{ scale: dragging ? 1.02 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onPointerMove={onPointerMove}
      onPointerLeave={resetPointer}
      role="button"
      tabIndex={0}
      aria-label="Upload your Uber data zip"
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`group relative isolate w-full cursor-pointer overflow-hidden rounded-[24px] p-[1.5px] ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      {/* Traveling metal rim-light (chrome + a touch of iridescence) */}
      <div
        className="rim-light pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.9) 30deg, #18e0ff 55deg, #ff2d6b 75deg, transparent 110deg, transparent 360deg)',
          animation: 'rim-rotate 6s linear infinite',
          opacity: dragging ? 1 : 0.55,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Inner card surface */}
      <div
        className={`elevated relative flex flex-col items-center justify-center rounded-[23px] p-10 text-center transition-colors sm:p-14 ${
          dragging ? 'bg-surface-2' : 'bg-[#0b0b0cf5] backdrop-blur-md'
        }`}
      >
        {/* drag glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[23px] transition-opacity duration-300"
          style={{
            opacity: dragging ? 1 : 0,
            background:
              'radial-gradient(80% 120% at 50% 0%, rgba(24,224,255,0.12), transparent 60%), radial-gradient(80% 120% at 50% 100%, rgba(255,45,107,0.1), transparent 60%)',
          }}
        />
        <div className="relative">
          <div className="elevated mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface-2 text-xl">
            <span className={`transition-transform duration-300 ${dragging ? 'translate-y-0.5' : 'group-hover:-translate-y-0.5'}`}>
              ↑
            </span>
          </div>
          <p className="text-lg font-semibold">{dragging ? 'Drop it' : 'Drop your Uber .zip here'}</p>
          <p className="mt-1 text-sm text-dim">{dragging ? 'Release to unwrap your year' : 'or click to browse'}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </motion.div>
  );
}
