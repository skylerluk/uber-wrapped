import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      animate={{ scale: dragging ? 1.015 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`group elevated relative isolate flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[24px] border p-10 text-center transition-colors sm:p-14 ${
        dragging ? 'border-transparent bg-surface-2' : 'border-hairline bg-surface hover:border-hairline-strong'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      {/* Gradient sweep glow on drag */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300"
        style={{
          opacity: dragging ? 1 : 0,
          background:
            'radial-gradient(80% 120% at 50% 0%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(80% 120% at 50% 100%, rgba(236,72,153,0.22), transparent 60%)',
        }}
      />
      {dragging && (
        <span
          className="pointer-events-none absolute inset-0 -z-10 rounded-[24px]"
          style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.5)' }}
        />
      )}

      <motion.div
        animate={{ y: dragging ? -2 : 0 }}
        className="elevated mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface-2 text-xl"
      >
        <span className={`transition-transform duration-300 ${dragging ? 'translate-y-0.5' : 'group-hover:-translate-y-0.5'}`}>
          ↑
        </span>
      </motion.div>
      <p className="text-lg font-semibold">{dragging ? 'Drop it' : 'Drop your Uber .zip here'}</p>
      <p className="mt-1 text-sm text-dim">{dragging ? 'Release to unwrap your year' : 'or click to browse'}</p>
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
