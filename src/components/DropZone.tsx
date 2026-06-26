import { useCallback, useRef, useState } from 'react';

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
    <div
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
      className={`group flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center transition-all sm:p-14 ${
        dragging ? 'border-text bg-surface-2 scale-[1.01]' : 'border-hairline bg-surface hover:border-white/25'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface-2 text-xl">
        ↑
      </div>
      <p className="text-lg font-semibold">Drop your Uber .zip here</p>
      <p className="mt-1 text-sm text-dim">or click to browse</p>
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
    </div>
  );
}
