/**
 * 4-point grid. Whitespace is sacred here.
 * Most screens use lg (24) for horizontal gutters and xl (32) for vertical breathing.
 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 96,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/**
 * Soft, layered shadows — used sparingly. We mostly fake elevation with
 * translucent surfaces, not drop shadows.
 */
export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  glow: {
    shadowColor: '#A78BFA',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;

/**
 * Spring presets — every animation in the app should pull from this.
 * No bouncy startup-feel; everything settles like a feather.
 */
export const springs = {
  gentle: { damping: 22, stiffness: 160, mass: 1 },
  soft: { damping: 18, stiffness: 130, mass: 0.9 },
  snappy: { damping: 26, stiffness: 240, mass: 0.8 },
} as const;

export const durations = {
  fast: 180,
  base: 280,
  slow: 480,
  cinematic: 800,
} as const;
