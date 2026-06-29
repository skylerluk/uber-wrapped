import type { ReactNode } from 'react';
import type { Roast } from '../types/insights';
import type { Gradient } from '../styles/gradients';

export interface SceneActions {
  onDashboard: () => void;
  onShare: () => void;
  onRestart: () => void;
  onPickAnother?: () => void;
}

/** Which world a scene belongs to, shown as a subtle chip. */
export interface SceneTag {
  icon: string;
  label: string;
}

export interface Scene {
  id: string;
  gradient: Gradient;
  /** 🚗 rides / 🍔 Eats / ✨ combined provenance chip. */
  tag?: SceneTag;
  kicker?: string;
  /** Big headline content (string or count-up). Omitted for pure roast scenes. */
  headline?: ReactNode;
  sub?: ReactNode;
  /** When set, the scene features this roast as a RoastCard. */
  roast?: Roast;
  /** Arbitrary custom content (e.g. the all-time timeline chart). */
  custom?: ReactNode;
  /** Outro action row. */
  footer?: ReactNode;
}
