// Curated duotone scene gradients (Spotify-Wrapped energy) used one-per-scene
// over the true-black base. Vivid but tasteful; grain is layered on top so they
// never look flat.

export interface Gradient {
  from: string;
  to: string;
}

export const GRADIENTS = {
  iceIndigo: { from: '#38bdf8', to: '#4338ca' },
  limeTeal: { from: '#a3e635', to: '#0d9488' },
  magentaViolet: { from: '#ec4899', to: '#7c3aed' },
  amberRed: { from: '#f59e0b', to: '#dc2626' },
  emeraldBlue: { from: '#34d399', to: '#2563eb' },
  fuchsiaIndigo: { from: '#d946ef', to: '#4f46e5' },
  orangePink: { from: '#fb923c', to: '#ec4899' },
  cyanGreen: { from: '#22d3ee', to: '#22c55e' },
} satisfies Record<string, Gradient>;

/** CSS background layering a duotone gradient + depth over black. */
export function sceneBackground(g: Gradient): string {
  return [
    `radial-gradient(125% 85% at 50% 28%, ${g.from}55, transparent 60%)`,
    `radial-gradient(110% 100% at 82% 102%, ${g.to}4d, transparent 58%)`,
    `linear-gradient(160deg, ${g.from}14, ${g.to}10)`,
    '#000',
  ].join(', ');
}
